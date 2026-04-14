/**
 * scripts/scrape_ptt.ts
 *
 * Scrapes PTT boards for specialty clinic recommendations.
 * Matches post content against clinic names in Supabase, then infers
 * specialty_tags from nearby keyword context.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/scrape_ptt.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BOARDS = [
  'https://www.ptt.cc/bbs/cat/index.html',
  'https://www.ptt.cc/bbs/dog/index.html',
  'https://www.ptt.cc/bbs/pet/index.html',
]

const INDEX_PAGES = 20   // how many index pages to walk back per board
const DELAY_MS    = 2_000
const TIMEOUT_MS  = 15_000

// ── Keyword filters ─────────────────────────────────────────────────────────

const TITLE_KEYWORDS = [
  '推薦', '獸醫', '動物醫院', '診所', '專科',
  '牙科', '眼科', '心臟', '骨科', '腫瘤', '皮膚', '看診',
]

// tag → context keywords (any match within ±100 chars counts)
const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  '牙科':    ['牙科', '洗牙', '根管', '牙周', '齒科'],
  '眼科':    ['眼科', '白內障', '青光眼', '角膜'],
  '心臟科':  ['心臟', '心雜音', '心電圖', '心肌'],
  '骨科':    ['骨科', '骨折', '十字韌帶', '關節'],
  '腫瘤科':  ['腫瘤', '癌症', '化療', '淋巴瘤', '切片'],
  '皮膚科':  ['皮膚', '過敏', '掉毛', '黴菌', '藥浴'],
  '神經外科':['神經', '癲癇', '脊椎', '椎間盤'],
  '泌尿科':  ['泌尿', '結石', '膀胱', '血尿'],
  '腎臟科':  ['腎臟', '腎衰竭', '透析'],
  '外科':    ['外科', '手術', '腹腔鏡', '微創'],
  '24H急診': ['急診', '24小時', '夜間', '全天候'],
}

const CONTEXT_WINDOW = 100   // chars before/after clinic name to scan

// ── Nickname → canonical DB name ─────────────────────────────────────────────
// Lets the scraper match shorthand names PTT users commonly write.
// Value must exactly match the `name` column in the clinics table.

const CLINIC_NICKNAMES: Record<string, string> = {
  '台大':  '台大動物醫院',
  '路米':  '路米動物醫院',
  '沐恩':  '沐恩動物醫院',
  '敦品':  '敦品動物醫院',
  '弘吉':  '弘吉獸醫院',
  '白牙':  '白牙動物醫院',
  '常明':  '常明動物醫院',
  '汎亞':  '汎亞動物醫院',
  '上群':  '上群動物醫院',
  '綠洲':  '綠洲動物醫院',
  '伊甸園':'伊甸園動物醫院',
  '大安':  '大安動物醫院',
  '樂膚莉':'樂膚莉動物醫院',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

interface PostLink {
  title: string
  url:   string
  board: string
}

interface PttResult {
  clinic_name:    string
  matched_db_name: string
  tags_found:     string[]
  source_url:     string
  snippet:        string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchPtt(url: string): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'Cookie':     'over18=1',
        'User-Agent': 'Mozilla/5.0 (compatible; ClinicBot/1.0)',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

/** Extract <a href> and text from PTT index page list items */
function parseIndexLinks(html: string, boardBase: string): PostLink[] {
  const links: PostLink[] = []
  // PTT post rows: <div class="title"><a href="/bbs/...">title</a>
  const rowRe = /<div class="title">\s*(?:<[^>]+>\s*)*<a href="(\/bbs\/[^"]+)"[^>]*>([^<]+)<\/a>/g
  let m: RegExpExecArray | null
  while ((m = rowRe.exec(html)) !== null) {
    const href  = m[1]
    const title = m[2].trim()
    links.push({
      title,
      url:   `https://www.ptt.cc${href}`,
      board: boardBase,
    })
  }
  return links
}

/** Walk back INDEX_PAGES pages from the given board index URL */
async function collectPostLinks(boardIndexUrl: string): Promise<PostLink[]> {
  const allLinks: PostLink[] = []
  let currentUrl = boardIndexUrl

  for (let page = 0; page < INDEX_PAGES; page++) {
    process.stdout.write(`  📄  Fetching index: ${currentUrl} ... `)
    let html: string
    try {
      html = await fetchPtt(currentUrl)
      console.log('ok')
    } catch (err) {
      console.log(`❌ ${String(err).slice(0, 60)}`)
      break
    }

    allLinks.push(...parseIndexLinks(html, boardIndexUrl))

    // Find "上頁" (previous page) link — PTT uses &lsaquo; entity for ‹
    const prevMatch = html.match(/<a[^>]+href="(\/bbs\/[^"]+)"[^>]*>(?:&lsaquo;|‹) 上頁<\/a>/)
    if (!prevMatch) break
    currentUrl = `https://www.ptt.cc${prevMatch[1]}`
    await sleep(DELAY_MS)
  }

  return allLinks
}

/** Check if title contains any of the filter keywords */
function titleMatches(title: string): boolean {
  return TITLE_KEYWORDS.some((kw) => title.includes(kw))
}

/** Strip basic HTML tags from PTT post.
 *  PTT's #main-content contains deeply nested divs so we cannot use a simple
 *  closing-tag regex to isolate it.  Instead, drop <head>, <nav>, and the
 *  push/recommend section, then strip all remaining tags from the whole page.
 */
function extractPostText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/id="action-bar-container"[\s\S]*$/i, ' ')  // drop footer/action bar
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&lsaquo;/g, '‹')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Find specialty tags from text near a clinic name mention */
function findTagsNearMention(text: string, clinicName: string): { tags: string[]; snippet: string } {
  const idx = text.indexOf(clinicName)
  if (idx === -1) return { tags: [], snippet: '' }

  const start   = Math.max(0, idx - CONTEXT_WINDOW)
  const end     = Math.min(text.length, idx + clinicName.length + CONTEXT_WINDOW)
  const snippet = text.slice(start, end).replace(/\s+/g, ' ')

  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (keywords.some((kw) => snippet.includes(kw))) {
      tags.push(tag)
    }
  }
  return { tags, snippet }
}

function pgArray(tags: string[]): string {
  const escaped = tags.map((t) => `'${t.replace(/'/g, "''")}'`)
  return `ARRAY[${escaped.join(', ')}]::TEXT[]`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌  Missing Supabase env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 1. Load all clinic names from DB
  console.log('🔍  Loading clinic names from Supabase...')
  const { data: clinicRows, error } = await supabase
    .from('clinics')
    .select('id, name, specialty_tags')

  if (error) {
    console.error('❌  Supabase error:', error.message)
    process.exit(1)
  }

  const clinics = (clinicRows ?? []) as { id: string; name: string; specialty_tags: string[] }[]
  console.log(`✅  Loaded ${clinics.length} clinics\n`)

  // Build a match list of { searchTerm, canonicalName } pairs.
  // Full names first, then nicknames — both sorted longest-first so longer
  // terms shadow shorter ambiguous ones (e.g. '伊甸園' before '園').
  const matchTargets: { searchTerm: string; canonicalName: string }[] = [
    ...clinics
      .map((c) => ({ searchTerm: c.name, canonicalName: c.name }))
      .sort((a, b) => b.searchTerm.length - a.searchTerm.length),
    ...Object.entries(CLINIC_NICKNAMES)
      .map(([nick, canonical]) => ({ searchTerm: nick, canonicalName: canonical }))
      .sort((a, b) => b.searchTerm.length - a.searchTerm.length),
  ]

  // 2. Collect post links from all boards
  const allPostLinks: PostLink[] = []

  for (const boardUrl of BOARDS) {
    console.log(`\n📋  Board: ${boardUrl}`)
    const links = await collectPostLinks(boardUrl)
    console.log(`    Found ${links.length} posts on index pages`)
    allPostLinks.push(...links)
    await sleep(DELAY_MS)
  }

  // 3. Filter by title keywords
  const matchingPosts = allPostLinks.filter((p) => titleMatches(p.title))
  // Deduplicate by URL
  const uniquePosts = [...new Map(matchingPosts.map((p) => [p.url, p])).values()]
  console.log(`\n🎯  ${uniquePosts.length} posts match title keywords (after dedup)\n`)

  // 4. Fetch each post and scan for clinic names
  const results: PttResult[] = []
  const seen = new Set<string>() // clinic+url dedup

  for (let i = 0; i < uniquePosts.length; i++) {
    const post = uniquePosts[i]
    process.stdout.write(`⏳  [${i + 1}/${uniquePosts.length}] ${post.title.slice(0, 40)} ... `)

    let html: string
    try {
      html = await fetchPtt(post.url)
      console.log('ok')
    } catch (err) {
      console.log(`❌ ${String(err).slice(0, 60)}`)
      if (i < uniquePosts.length - 1) await sleep(DELAY_MS)
      continue
    }

    const text = extractPostText(html)

    for (const { searchTerm, canonicalName } of matchTargets) {
      if (!text.includes(searchTerm)) continue
      // Dedup by canonical clinic name + URL so a nickname and full name in the
      // same post don't produce two entries for the same clinic.
      const key = `${canonicalName}::${post.url}`
      if (seen.has(key)) continue
      seen.add(key)

      const { tags, snippet } = findTagsNearMention(text, searchTerm)
      if (tags.length === 0) continue  // mention with no specialty context — skip

      const label = searchTerm !== canonicalName ? `${searchTerm} (→${canonicalName})` : canonicalName
      results.push({
        clinic_name:     searchTerm,
        matched_db_name: canonicalName,
        tags_found:      tags,
        source_url:      post.url,
        snippet:         snippet.slice(0, 200),
      })

      console.log(`    🏥  ${label} → [${tags.join(', ')}]`)
    }

    if (i < uniquePosts.length - 1) await sleep(DELAY_MS)
  }

  // 5. Save JSON results
  const jsonPath = path.join(__dirname, 'ptt_results.json')
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8')
  console.log(`\n📄  Saved ${results.length} results → scripts/ptt_results.json`)

  // 6. Generate SQL — only update clinics with empty specialty_tags
  const clinicsWithEmptyTags = new Set(
    clinics.filter((c) => !c.specialty_tags || c.specialty_tags.length === 0).map((c) => c.name)
  )

  // Merge tags per clinic (a clinic may appear in multiple posts)
  const tagsByClinic = new Map<string, Set<string>>()
  for (const r of results) {
    if (!clinicsWithEmptyTags.has(r.matched_db_name)) continue  // skip — already has tags
    if (!tagsByClinic.has(r.matched_db_name)) tagsByClinic.set(r.matched_db_name, new Set())
    r.tags_found.forEach((t) => tagsByClinic.get(r.matched_db_name)!.add(t))
  }

  const sqlLines = [
    '-- ptt_update_tags.sql',
    '-- Tags inferred from PTT post mentions — only updates clinics with empty specialty_tags',
    '-- Run in Supabase SQL Editor',
    '',
  ]

  for (const [name, tagSet] of tagsByClinic) {
    const tags = [...tagSet]
    sqlLines.push(
      `UPDATE clinics SET specialty_tags = ${pgArray(tags)} WHERE name = '${name.replace(/'/g, "''")}' AND specialty_tags = '{}';`
    )
  }

  const sqlPath = path.join(__dirname, 'ptt_update_tags.sql')
  fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n', 'utf8')

  // 7. Summary
  console.log('\n──────────────────────────────────────────')
  console.log(`📋  Boards scanned        : ${BOARDS.length}`)
  console.log(`📰  Index pages/board     : ${INDEX_PAGES} (nicknames: ${Object.keys(CLINIC_NICKNAMES).length})`)
  console.log(`🔍  Posts title-matched   : ${uniquePosts.length}`)
  console.log(`🏥  Clinic mentions found : ${results.length}`)
  console.log(`📝  SQL updates generated : ${tagsByClinic.size} clinics`)
  console.log(`📄  Results JSON          : scripts/ptt_results.json`)
  console.log(`📄  SQL file              : scripts/ptt_update_tags.sql`)
  console.log('──────────────────────────────────────────')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
