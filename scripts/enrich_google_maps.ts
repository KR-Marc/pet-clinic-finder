/**
 * scripts/enrich_google_maps.ts
 *
 * For every clinic in Supabase:
 *   1. Find the Google Place via Text Search
 *   2. Fetch Place Details (website, rating, phone, opening_hours, reviews)
 *   3. Extract specialty_tags from reviews via keyword matching
 *   4. Write two SQL files + a full JSON results file
 *
 * Prerequisites (run once in Supabase SQL editor):
 *   ALTER TABLE clinics ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
 *   ALTER TABLE clinics ADD COLUMN IF NOT EXISTS opening_hours TEXT[];
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=AIza... npx tsx --env-file=.env.local scripts/enrich_google_maps.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Config ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

const DELAY_MS    = 500
const TIMEOUT_MS  = 10_000
const MAX_REVIEWS = 5

// ── Keyword map (same as scrape_websites.ts) ───────────────────────────────────
// For full website text: threshold = 2 hits
// For short review snippets: threshold = 1 hit  ← used here

const KEYWORD_MAP: Record<string, string[]> = {
  '牙科':    ['牙科', '齒科', '洗牙', '牙結石', '根管', '牙周'],
  '眼科':    ['眼科', '白內障', '青光眼', '角膜', '眼球'],
  '心臟科':  ['心臟', '心臟超音波', '心電圖', '心肌', '瓣膜'],
  '骨科':    ['骨科', '骨折', '十字韌帶', '關節', '椎間盤'],
  '腫瘤科':  ['腫瘤', '癌症', '化療', '淋巴瘤', '切片'],
  '皮膚科':  ['皮膚科', '過敏', '黴菌', '異位性', '藥浴'],
  '神經外科':['神經', '癲癇', '脊椎', '椎間盤', 'MRI'],
  '泌尿科':  ['泌尿', '結石', '膀胱', '輸尿管', '血尿'],
  '腎臟科':  ['腎臟', '腎衰竭', '腎病', '透析'],
  '外科':    ['外科', '腹腔鏡', '內視鏡', '微創', '手術'],
  '24H急診': ['24小時', '24h', '急診', '全天候', '夜間急診'],
  '復健':    ['復健', '水療', '物理治療', '雷射治療'],
  '中獸醫':  ['中獸醫', '針灸', '中藥'],
}

const REVIEW_THRESHOLD = 1  // one keyword hit is enough in a short review snippet

// ── Types ──────────────────────────────────────────────────────────────────────

interface ClinicRow {
  id: string
  name: string
  district: string
  website: string | null
  specialty_tags: string[]
}

interface PlaceCandidate {
  place_id: string
  name: string
  formatted_address: string
}

interface PlaceDetails {
  name?: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  opening_hours?: { weekday_text?: string[] }
  reviews?: Array<{ text: string; rating: number; author_name: string }>
}

interface EnrichResult {
  id: string
  name: string
  district: string
  place_id: string | null
  google_name: string | null
  google_address: string | null
  phone: string | null
  website: string | null
  rating: number | null
  opening_hours: string[]
  reviews: Array<{ author: string; rating: number; text: string }>
  tags_from_reviews: string[]
  status: 'enriched' | 'no_place' | 'api_error'
  error?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function fetchJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

function matchTagsFromText(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [tag, keywords] of Object.entries(KEYWORD_MAP)) {
    const hits = keywords.filter((kw) => lower.includes(kw.toLowerCase()))
    if (hits.length >= REVIEW_THRESHOLD) found.push(tag)
  }
  return found
}

function pgLiteral(s: string): string {
  return `'${s.replace(/'/g, "''")}'`
}

function pgArray(tags: string[]): string {
  const escaped = tags.map((t) => `'${t.replace(/'/g, "''")}'`)
  return `ARRAY[${escaped.join(', ')}]::TEXT[]`
}

function pgTextArray(items: string[]): string {
  const escaped = items.map((s) => `'${s.replace(/'/g, "''")}'`)
  return `ARRAY[${escaped.join(', ')}]::TEXT[]`
}

// ── API calls ──────────────────────────────────────────────────────────────────

async function findPlace(name: string, district: string): Promise<PlaceCandidate | null> {
  const input = encodeURIComponent(`${name} 台北市 ${district}`)
  const fields = 'place_id,name,formatted_address'
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${input}&inputtype=textquery&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`

  const data = await fetchJson<{ status: string; candidates?: PlaceCandidate[] }>(url)

  if (data.status !== 'OK' || !data.candidates?.length) return null
  return data.candidates[0]
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fields = 'name,formatted_address,formatted_phone_number,website,rating,opening_hours,reviews'
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}&fields=${fields}&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`

  const data = await fetchJson<{ status: string; result?: PlaceDetails }>(url)

  if (data.status !== 'OK' || !data.result) return null
  return data.result
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌  Missing Supabase env vars')
    process.exit(1)
  }
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('❌  Missing GOOGLE_MAPS_API_KEY env var')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // ── Fetch all clinics ────────────────────────────────────────────────────────
  console.log('🔍  Fetching all clinics from Supabase...')
  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, district, website, specialty_tags')
    .order('district')
    .order('name')

  if (error) { console.error('❌  Supabase error:', error.message); process.exit(1) }

  const rows = (clinics ?? []) as ClinicRow[]
  console.log(`✅  ${rows.length} clinics loaded\n`)

  // ── Process each clinic ──────────────────────────────────────────────────────
  const results: EnrichResult[] = []
  let enriched = 0, noPlace = 0, apiErrors = 0

  for (let i = 0; i < rows.length; i++) {
    const clinic = rows[i]
    const label = `[${i + 1}/${rows.length}] ${clinic.name}`
    process.stdout.write(`⏳  ${label} ... `)

    const result: EnrichResult = {
      id:               clinic.id,
      name:             clinic.name,
      district:         clinic.district,
      place_id:         null,
      google_name:      null,
      google_address:   null,
      phone:            null,
      website:          null,
      rating:           null,
      opening_hours:    [],
      reviews:          [],
      tags_from_reviews: [],
      status:           'no_place',
    }

    try {
      // Step 1: Find place
      const candidate = await findPlace(clinic.name, clinic.district)
      await sleep(DELAY_MS)

      if (!candidate) {
        noPlace++
        console.log('❌  not found on Google Maps')
        results.push(result)
        continue
      }

      result.place_id      = candidate.place_id
      result.google_name   = candidate.name
      result.google_address = candidate.formatted_address

      // Step 2: Get place details
      const details = await getPlaceDetails(candidate.place_id)
      await sleep(DELAY_MS)

      if (!details) {
        noPlace++
        console.log('❌  place details unavailable')
        results.push(result)
        continue
      }

      result.phone         = details.formatted_phone_number ?? null
      result.website       = details.website ?? null
      result.rating        = details.rating ?? null
      result.opening_hours = details.opening_hours?.weekday_text ?? []

      // Step 3: Collect reviews (up to MAX_REVIEWS)
      if (details.reviews?.length) {
        result.reviews = details.reviews.slice(0, MAX_REVIEWS).map((r) => ({
          author: r.author_name,
          rating: r.rating,
          text:   r.text,
        }))
      }

      // Step 4: Extract tags from all review text combined
      const allReviewText = result.reviews.map((r) => r.text).join(' ')
      result.tags_from_reviews = allReviewText ? matchTagsFromText(allReviewText) : []

      result.status = 'enriched'
      enriched++

      const tagStr  = result.tags_from_reviews.length ? ` [${result.tags_from_reviews.join(', ')}]` : ''
      const ratingStr = result.rating != null ? ` ⭐${result.rating}` : ''
      console.log(`✅${ratingStr}${tagStr}`)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      result.status = 'api_error'
      result.error  = msg
      apiErrors++
      console.log(`❌  ${msg.slice(0, 80)}`)
    }

    results.push(result)
  }

  // ── Write JSON ────────────────────────────────────────────────────────────────
  const jsonPath = path.join(__dirname, 'google_maps_results.json')
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8')

  // ── Write google_maps_update.sql ──────────────────────────────────────────────
  // Updates website, rating, opening_hours (only fills in missing data)
  const updateLines: string[] = [
    '-- google_maps_update.sql',
    '-- Updates website, rating, and opening_hours from Google Maps data.',
    '-- website:       only set if currently NULL or empty',
    '-- rating:        always set when found',
    '-- opening_hours: always set when found',
    '-- Run in Supabase SQL editor.',
    '',
    '-- Prerequisites (run once if not already):',
    '-- ALTER TABLE clinics ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);',
    '-- ALTER TABLE clinics ADD COLUMN IF NOT EXISTS opening_hours TEXT[];',
    '',
  ]

  let updateCount = 0
  for (const r of results) {
    if (r.status !== 'enriched') continue
    const setParts: string[] = []

    // Website: only fill if the clinic has none in Supabase
    const clinicRow = rows.find((c) => c.id === r.id)!
    if (r.website && !clinicRow.website) {
      setParts.push(`website = ${pgLiteral(r.website)}`)
    }
    if (r.rating != null) {
      setParts.push(`rating = ${r.rating}`)
    }
    if (r.opening_hours.length > 0) {
      setParts.push(`opening_hours = ${pgTextArray(r.opening_hours)}`)
    }

    if (setParts.length > 0) {
      updateLines.push(
        `UPDATE clinics SET ${setParts.join(', ')} WHERE id = ${pgLiteral(r.id)}; -- ${r.name}`
      )
      updateCount++
    }
  }

  if (updateCount === 0) updateLines.push('-- No updates needed.')

  const updateSqlPath = path.join(__dirname, 'google_maps_update.sql')
  fs.writeFileSync(updateSqlPath, updateLines.join('\n') + '\n', 'utf8')

  // ── Write google_maps_tags.sql ────────────────────────────────────────────────
  // Only for clinics that currently have no specialty_tags
  const tagLines: string[] = [
    '-- google_maps_tags.sql',
    '-- Adds specialty_tags inferred from Google Maps reviews.',
    '-- Only updates clinics where specialty_tags is currently empty (={}).',
    '-- Run in Supabase SQL editor.',
    '',
  ]

  let tagCount = 0
  for (const r of results) {
    if (r.status !== 'enriched') continue
    if (r.tags_from_reviews.length === 0) continue

    const clinicRow = rows.find((c) => c.id === r.id)!
    const hasExistingTags = clinicRow.specialty_tags && clinicRow.specialty_tags.length > 0
    if (hasExistingTags) continue  // only fill empty slots

    tagLines.push(
      `UPDATE clinics SET specialty_tags = ${pgArray(r.tags_from_reviews)} WHERE id = ${pgLiteral(r.id)} AND specialty_tags = '{}'; -- ${r.name} (${r.district})`
    )
    tagCount++
  }

  if (tagCount === 0) tagLines.push('-- No tag updates found from reviews.')

  const tagSqlPath = path.join(__dirname, 'google_maps_tags.sql')
  fs.writeFileSync(tagSqlPath, tagLines.join('\n') + '\n', 'utf8')

  // ── Summary ───────────────────────────────────────────────────────────────────
  const withRating   = results.filter((r) => r.rating != null).length
  const withWebsite  = results.filter((r) => r.website).length
  const withHours    = results.filter((r) => r.opening_hours.length > 0).length
  const withReviews  = results.filter((r) => r.reviews.length > 0).length
  const withNewTags  = results.filter((r) => r.tags_from_reviews.length > 0).length

  console.log('\n──────────────────────────────────────────────────')
  console.log(`✅  Enriched              : ${enriched} / ${rows.length} clinics`)
  console.log(`❌  Not found             : ${noPlace}`)
  console.log(`❌  API errors            : ${apiErrors}`)
  console.log(`⭐  With rating           : ${withRating}`)
  console.log(`🌐  With website          : ${withWebsite}`)
  console.log(`🕐  With opening hours    : ${withHours}`)
  console.log(`💬  With reviews          : ${withReviews}`)
  console.log(`🏷   New tags from reviews : ${withNewTags} clinics`)
  console.log('──────────────────────────────────────────────────')
  console.log(`📄  JSON   : scripts/google_maps_results.json`)
  console.log(`📄  SQL #1 : scripts/google_maps_update.sql   (${updateCount} updates)`)
  console.log(`📄  SQL #2 : scripts/google_maps_tags.sql     (${tagCount} tag updates)`)
  console.log('──────────────────────────────────────────────────')
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1) })
