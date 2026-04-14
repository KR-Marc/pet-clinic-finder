/**
 * scripts/generate_enrich_csv.ts
 *
 * Queries Supabase for all clinics and generates scripts/clinics_to_enrich.csv
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate_enrich_csv.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const TARGET_DISTRICTS = ['大安區', '中山區', '信義區', '士林區', '內湖區', '松山區']

function escapeCsvField(val: string | null | undefined): string {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

async function main() {
  // ── 1. Clinics WITH specialty_tags ─────────────────────────────────────────
  const { data: withTags, error: e1 } = await supabase
    .from('clinics')
    .select('name, district, address, phone, website, specialty_tags')
    .neq('specialty_tags', '{}')
    .order('district')
    .order('name')

  if (e1) { console.error('Error fetching tagged clinics:', e1); process.exit(1) }

  console.log('\n=== Clinics WITH specialty_tags ===')
  console.log(`Found: ${withTags!.length}`)
  for (const c of withTags!) {
    console.log(`  [${c.district}] ${c.name} — ${JSON.stringify(c.specialty_tags)}`)
  }

  // ── 2. Clinics WITHOUT tags in target districts ────────────────────────────
  const { data: noTagsTarget, error: e2 } = await supabase
    .from('clinics')
    .select('name, district, address, phone, website, specialty_tags')
    .eq('specialty_tags', '{}')
    .in('district', TARGET_DISTRICTS)
    .order('district')
    .order('name')

  if (e2) { console.error('Error fetching untagged clinics:', e2); process.exit(1) }

  console.log('\n=== Clinics WITHOUT tags in target districts ===')
  console.log(`Found: ${noTagsTarget!.length}`)
  for (const c of noTagsTarget!) {
    console.log(`  [${c.district}] ${c.name}`)
  }

  // ── 3. ALL clinics for the CSV ─────────────────────────────────────────────
  const { data: allClinics, error: e3 } = await supabase
    .from('clinics')
    .select('name, district, address, phone, website, specialty_tags')
    .order('district')
    .order('name')

  if (e3) { console.error('Error fetching all clinics:', e3); process.exit(1) }

  // Sort: tagged first (by district/name), then untagged (by district/name)
  const tagged   = allClinics!.filter(c => c.specialty_tags && c.specialty_tags.length > 0)
  const untagged = allClinics!.filter(c => !c.specialty_tags || c.specialty_tags.length === 0)

  const sorted = [...tagged, ...untagged]

  // Build CSV
  const header = ['name', 'district', 'address', 'phone', 'website', 'specialty_tags']
  const rows = sorted.map(c => [
    escapeCsvField(c.name),
    escapeCsvField(c.district),
    escapeCsvField(c.address),
    escapeCsvField(c.phone),
    escapeCsvField(c.website),
    escapeCsvField(c.specialty_tags?.join('|') ?? ''),
  ].join(','))

  const csv = [header.join(','), ...rows].join('\n')
  const outPath = path.join(__dirname, 'clinics_to_enrich.csv')
  fs.writeFileSync(outPath, csv, 'utf8')

  // ── 4. Summary ─────────────────────────────────────────────────────────────
  const withWebsite = allClinics!.filter(c => c.website && c.website.trim() !== '').length

  console.log('\n=== Summary ===')
  console.log(`Total clinics:            ${allClinics!.length}`)
  console.log(`Have specialty_tags:      ${tagged.length}`)
  console.log(`Missing specialty_tags:   ${untagged.length}`)
  console.log(`Have website URL:         ${withWebsite}`)
  console.log(`\nCSV written to: ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })
