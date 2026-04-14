/**
 * scripts/find_websites.ts
 *
 * Auto-searches Google for official websites of clinics that have no website
 * in the database.  Saves candidates to JSON and generates UPDATE SQL for
 * high-confidence matches.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/find_websites.ts
 *
 * DO NOT pipe output to a shell — review website_candidates.json before
 * running update_clinic_websites.sql.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const DELAY_MS   = 3_000   // be polite to Google
const TIMEOUT_MS = 15_000

const TEST_MODE  = true    // set to false to run all clinics

// ── Domain filters ───────────────────────────────────────────────────────────

const SKIP_DOMAINS = [
  // Search engines & their ad/redirect URLs
  'google.com', 'google.com.tw', 'maps.google.com',
  'duckduckgo.com', 'bing.com',
  // Social media
  'facebook.com', 'fb.com', 'instagram.com', 'youtube.com', 'line.me', 'liff.line.me',
  // Forums / news
  'ptt.cc', 'dcard.tw', 'mobile01.com', 'pixnet.net',
  'udn.com', 'appledaily.com', 'ettoday.net', 'chinatimes.com',
  // Job / business directories
  '1111.com.tw', '104.com.tw', 'yelp.com', 'yelp.com.tw',
  // Pet-specific directories (not clinic sites)
  'pethealthmap.com', 'pethealth.com.tw', 'petoplay.com',
  'tw-animal.com', 'afurkid.com', 'findglocal.com',
  'emer-vet.com.tw', 'twedr.com', 'klook.com',
  // General directories / encyclopedias
  'wikipedia.org', 'wiki', 'gov.tw',
]

const ACCEPT_TLDS = ['.com.tw', '.tw', '.com', '.vet', '.net', '.org']

// ── Interfaces ───────────────────────────────────────────────────────────────

interface Clinic {
  id:       string
  name:     string
  district: string
}

interface WebsiteCandidate {
  clinic_name: string
  district:    string
  found_url:   string | null
  confidence:  'high' | 'low' | 'none'
  reason:      string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Search DuckDuckGo HTML endpoint (no JS required, no bot-block).
 *  Uses POST to html.duckduckgo.com which returns plain server-rendered HTML.
 */
async function searchDDG(clinicName: string): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const query = `台北 ${clinicName} 官網`
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':       'text/html',
        'Referer':      'https://duckduckgo.com/',
      },
      body: `q=${encodeURIComponent(query)}&kl=tw-tzh`,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

/** Extract result URLs from DuckDuckGo HTML results.
 *  DDG renders result links as <a class="result__a" href="DIRECT_URL">.
 *  These are plain direct URLs — no redirect wrappers.
 */
function extractDDGUrls(html: string): string[] {
  const urls: string[] = []
  const re = /class="result__a"[^>]*href="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      urls.push(decodeURIComponent(m[1]))
    } catch {
      urls.push(m[1])
    }
  }
  return urls
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function shouldSkip(url: string): boolean {
  const domain = getDomain(url)
  if (!domain) return true
  if (SKIP_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return true
  if (!ACCEPT_TLDS.some((tld) => domain.endsWith(tld))) return true
  return false
}

/** Loose match: strip 動物醫院/獸醫院/診所 suffix, then check if domain contains
 *  the remaining stem (romanised or Chinese characters).
 *  Works best for clinics whose name appears in their domain (e.g. lumi.vet).
 */
function isHighConfidence(clinicName: string, url: string): boolean {
  const domain = getDomain(url).replace(/^www\./, '')

  // Direct substring (catches e.g. shangqun in shangqun.com.tw)
  if (domain.includes(clinicName)) return true

  // Strip common suffixes and check stem
  const stem = clinicName
    .replace(/動物醫院$/, '')
    .replace(/獸醫院$/, '')
    .replace(/動物診所$/, '')
    .replace(/醫院$/, '')

  if (stem.length >= 2 && domain.includes(stem)) return true

  // Check if any 2-char slice of the stem appears in the domain
  for (let i = 0; i <= stem.length - 2; i++) {
    const chunk = stem.slice(i, i + 2)
    if (domain.includes(chunk)) return true
  }

  return false
}


function pgEscape(s: string): string {
  return s.replace(/'/g, "''")
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌  Missing Supabase env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 1. Fetch clinics with no website
  console.log('🔍  Fetching clinics with no website...')
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, district')
    .or('website.is.null,website.eq.')
    .order('district')
    .order('name')

  if (error) {
    console.error('❌  Supabase error:', error.message)
    process.exit(1)
  }

  let clinics = (data ?? []) as Clinic[]
  console.log(`✅  Found ${clinics.length} clinics without a website`)

  if (TEST_MODE) {
    clinics = clinics.slice(0, 10)
    console.log(`🧪  TEST_MODE: processing first ${clinics.length} clinics only\n`)
  } else {
    console.log()
  }

  if (clinics.length === 0) {
    console.log('ℹ️   All clinics already have websites.')
    process.exit(0)
  }

  // 2. Search Google for each clinic
  const candidates: WebsiteCandidate[] = []
  let high = 0, low = 0, none = 0, errors = 0

  for (let i = 0; i < clinics.length; i++) {
    const clinic = clinics[i]
    const label = `[${i + 1}/${clinics.length}] ${clinic.district} ${clinic.name}`
    process.stdout.write(`⏳  ${label} ... `)

    let html: string
    try {
      html = await searchDDG(clinic.name)
    } catch (err) {
      const msg = String(err).slice(0, 70)
      console.log(`❌  ${msg}`)
      candidates.push({
        clinic_name: clinic.name,
        district:    clinic.district,
        found_url:   null,
        confidence:  'none',
        reason:      `fetch error: ${msg}`,
      })
      errors++
      if (i < clinics.length - 1) await sleep(DELAY_MS)
      continue
    }

    // Extract and filter URLs
    const allUrls  = extractDDGUrls(html)
    const filtered = allUrls.filter((u) => !shouldSkip(u))

    if (filtered.length === 0) {
      console.log('⚪  no usable URL found')
      candidates.push({
        clinic_name: clinic.name,
        district:    clinic.district,
        found_url:   null,
        confidence:  'none',
        reason:      'no non-directory URL in results',
      })
      none++
    } else {
      const url        = filtered[0]
      const confidence = isHighConfidence(clinic.name, url) ? 'high' : 'low'
      const icon       = confidence === 'high' ? '✅' : '🟡'
      console.log(`${icon}  [${confidence}] ${url}`)
      candidates.push({
        clinic_name: clinic.name,
        district:    clinic.district,
        found_url:   url,
        confidence,
        reason:      confidence === 'high'
          ? 'clinic name matches domain'
          : 'first non-directory result',
      })
      confidence === 'high' ? high++ : low++
    }

    if (i < clinics.length - 1) await sleep(DELAY_MS)
  }

  // 3. Save JSON
  const jsonPath = path.join(__dirname, 'website_candidates.json')
  fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 2), 'utf8')
  console.log(`\n📄  Saved ${candidates.length} candidates → scripts/website_candidates.json`)

  // 4. Generate SQL for high-confidence only
  const highMatches = candidates.filter((c) => c.confidence === 'high' && c.found_url)
  const sqlLines = [
    '-- update_clinic_websites.sql',
    `-- Auto-generated by scripts/find_websites.ts`,
    `-- Contains ${highMatches.length} high-confidence matches only`,
    '-- REVIEW website_candidates.json before running this file!',
    '-- Low-confidence matches require manual verification.',
    '',
  ]

  for (const c of highMatches) {
    sqlLines.push(
      `UPDATE clinics SET website = '${pgEscape(c.found_url!)}' WHERE name = '${pgEscape(c.clinic_name)}' AND (website IS NULL OR website = '');`
    )
  }

  if (highMatches.length === 0) {
    sqlLines.push('-- No high-confidence matches found this run.')
  }

  const sqlPath = path.join(__dirname, 'update_clinic_websites.sql')
  fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n', 'utf8')

  // 5. Summary
  console.log('\n──────────────────────────────────────────')
  console.log(`🔍  Clinics searched      : ${clinics.length}`)
  console.log(`✅  High confidence       : ${high}`)
  console.log(`🟡  Low confidence        : ${low}`)
  console.log(`⚪  No URL found          : ${none}`)
  console.log(`❌  Fetch errors          : ${errors}`)
  console.log(`📝  SQL updates (high)    : ${highMatches.length}`)
  console.log(`📄  Candidates JSON       : scripts/website_candidates.json`)
  console.log(`📄  SQL file              : scripts/update_clinic_websites.sql`)
  console.log('──────────────────────────────────────────')
  console.log('\n⚠️   Review website_candidates.json before running the SQL.')
  console.log('    Low-confidence matches need manual verification.')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
