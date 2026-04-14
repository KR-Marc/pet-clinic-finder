import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// All specialty tag names — used for Layer 2 direct-tag detection
const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '24H急診', '復健', '中獸醫',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, pet: string, district: string) {
  if (pet && pet !== 'both') {
    query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  }
  if (district) {
    query = query.eq('district', district)
  }
  return query
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q') ?? ''
  const pet = searchParams.get('pet') ?? ''
  const district = searchParams.get('district') ?? ''

  // ── Browse mode: empty query → return all clinics sorted by district ──────
  if (!q.trim()) {
    let query = supabase
      .from('clinics')
      .select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })
    query = applyFilters(query, pet, district)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const qLower = q.toLowerCase()

  // ── Layer 1: Fuzzy symptom match ──────────────────────────────────────────
  // Three checks (all case-insensitive):
  //   a) keyword contains q         e.g. keyword "牙齦紅腫" ⊇ query "牙齦"
  //   b) q contains keyword         e.g. query "牙齦問題" ⊇ keyword "牙齦"  (if it existed)
  //   c) keyword shares a 2-char bigram with q
  //      e.g. query "牙齦問題" has bigram "牙齦" which appears in keyword "牙齦紅腫"
  const { data: allSymptoms, error: symptomError } = await supabase
    .from('symptoms')
    .select('keyword, specialty_tag')
  if (symptomError) return NextResponse.json({ error: symptomError.message }, { status: 500 })

  // Build bigram set from query (every 2-char window)
  const qBigrams = new Set<string>()
  for (let i = 0; i < qLower.length - 1; i++) qBigrams.add(qLower.slice(i, i + 2))

  const fuzzyTags = new Set<string>()
  for (const { keyword, specialty_tag } of allSymptoms ?? []) {
    const kLower = keyword.toLowerCase()
    const directMatch = kLower.includes(qLower) || qLower.includes(kLower)
    const bigramMatch = [...qBigrams].some((bg) => kLower.includes(bg))
    if (directMatch || bigramMatch) fuzzyTags.add(specialty_tag)
  }

  // ── Layer 2: Tag name match — bidirectional ───────────────────────────────
  // "牙科問題" contains "牙科"  →  add 牙科
  // "心臟" is contained in "心臟科"  →  add 心臟科
  for (const tag of KNOWN_TAGS) {
    const tLower = tag.toLowerCase()
    if (qLower.includes(tLower) || tLower.includes(qLower)) fuzzyTags.add(tag)
  }

  // ── Layers 1+2: Fetch clinics matching resolved tags ──────────────────────
  let tagClinics: Record<string, unknown>[] = []
  if (fuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...fuzzyTags])
    tagQuery = applyFilters(tagQuery, pet, district)
    const { data, error } = await tagQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    tagClinics = data ?? []
  }

  // ── Layer 3: Clinic name substring match ──────────────────────────────────
  // Lets "路米" find "路米動物醫院" directly
  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${q}%`)
  nameQuery = applyFilters(nameQuery, pet, district)
  const { data: nameClinics, error: nameError } = await nameQuery
  if (nameError) return NextResponse.json({ error: nameError.message }, { status: 500 })

  // ── Combine: tag matches first, then name-only additions ─────────────────
  const seen = new Set(tagClinics.map((c) => c.id))
  const nameOnly = (nameClinics ?? []).filter((c) => !seen.has(c.id))

  return NextResponse.json([...tagClinics, ...nameOnly])
}
