/**
 * scripts/scrape_websites.ts
 *
 * Fetches clinic websites and uses keyword matching to infer specialty_tags.
 * If Supabase write is blocked by RLS, generates a SQL file instead.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/scrape_websites.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Config ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const FETCH_TIMEOUT_MS = 10_000
const DELAY_MS = 1_200

// ── Keyword map ────────────────────────────────────────────────────────────────
// A tag is assigned when 2+ keywords from its list appear in the page text.

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

const THRESHOLD = 2 // minimum keyword hits to assign a tag

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface Clinic {
  id: string
  name: string
  website: string
}

interface ScrapeResult {
  id: string
  name: string
  website: string
  tags: string[]
  status: 'updated' | 'sql_only' | 'no_tags' | 'fetch_error'
  error?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase()
    .trim()
}

async function fetchWithTimeout(url: string, ms: number): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClinicBot/1.0)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

function matchTags(text: string): string[] {
  const found: string[] = []
  for (const [tag, keywords] of Object.entries(KEYWORD_MAP)) {
    const hits = keywords.filter((kw) => text.includes(kw.toLowerCase()))
    if (hits.length >= THRESHOLD) {
      found.push(tag)
    }
  }
  return found
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function pgArray(tags: string[]): string {
  const escaped = tags.map((t) => `"${t.replace(/"/g, '\\"')}"`)
  return `ARRAY[${escaped.join(',')}]::TEXT[]`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌  Missing Supabase env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 1. Fetch clinics with a website
  console.log('🔍  Fetching clinics with website set...')
  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, website')
    .not('website', 'is', null)
    .order('name')

  if (error) {
    console.error('❌  Supabase error:', error.message)
    process.exit(1)
  }

  const targets = (clinics ?? []).filter((c) => c.website) as Clinic[]
  console.log(`✅  Found ${targets.length} clinics with websites\n`)

  if (targets.length === 0) {
    console.log('ℹ️   No clinics have websites yet. Add website URLs to Supabase first.')
    process.exit(0)
  }

  const results: ScrapeResult[] = []
  const sqlLines: string[] = ['-- specialty_tags UPDATE from keyword scrape', '-- Run in Supabase SQL Editor if direct update was blocked by RLS', '']
  let updated = 0, sqlOnly = 0, noTags = 0, fetchErrors = 0

  // 2. Process each clinic
  for (let i = 0; i < targets.length; i++) {
    const clinic = targets[i]
    const label = `[${i + 1}/${targets.length}] ${clinic.name}`
    process.stdout.write(`⏳  ${label} ... `)

    const result: ScrapeResult = {
      id: clinic.id,
      name: clinic.name,
      website: clinic.website,
      tags: [],
      status: 'no_tags',
    }

    try {
      const html = await fetchWithTimeout(clinic.website, FETCH_TIMEOUT_MS)
      const text = stripHtml(html)
      const tags = matchTags(text)

      if (tags.length > 0) {
        result.tags = tags

        // Try direct Supabase update
        const { error: updateErr } = await supabase
          .from('clinics')
          .update({ specialty_tags: tags })
          .eq('id', clinic.id)

        if (!updateErr) {
          result.status = 'updated'
          updated++
          console.log(`✅  [${tags.join(', ')}]`)
        } else {
          // RLS blocked — collect SQL instead
          result.status = 'sql_only'
          sqlLines.push(`UPDATE clinics SET specialty_tags = ${pgArray(tags)} WHERE id = '${clinic.id}'; -- ${clinic.name}`)
          sqlOnly++
          console.log(`📝  [${tags.join(', ')}] (SQL saved — RLS blocked write)`)
        }
      } else {
        result.status = 'no_tags'
        noTags++
        console.log('⚪  no tags matched')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      result.status = 'fetch_error'
      result.error = msg
      fetchErrors++
      console.log(`❌  ${msg.slice(0, 70)}`)
    }

    results.push(result)
    if (i < targets.length - 1) await sleep(DELAY_MS)
  }

  // 3. Save JSON results
  const jsonPath = path.join(__dirname, 'scrape_results.json')
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8')

  // 4. Save SQL fallback if needed
  const sqlPath = path.join(__dirname, 'scrape_updates.sql')
  if (sqlOnly > 0) {
    fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n', 'utf8')
    console.log(`\n📄  SQL updates saved to: scripts/scrape_updates.sql`)
    console.log(`    → Run in Supabase SQL Editor to apply tag updates`)
  }

  // 5. Summary
  console.log('\n──────────────────────────────────────────')
  console.log(`✅  Directly updated : ${updated} clinics`)
  console.log(`📝  SQL saved (RLS)  : ${sqlOnly} clinics`)
  console.log(`⚪  No tags matched  : ${noTags} clinics`)
  console.log(`❌  Fetch errors     : ${fetchErrors} clinics`)
  console.log(`📄  Full log         : scripts/scrape_results.json`)
  console.log('──────────────────────────────────────────')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
