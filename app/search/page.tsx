import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import ClinicList, { type Clinic } from './ClinicList'

// All specialty tag names — used for Layer 2 direct-tag detection
const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '24H急診', '復健', '中獸醫',
]

async function fetchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
  // ── Browse mode: no keyword → return all clinics sorted by district ───────
  if (!q.trim()) {
    let query = supabase
      .from('clinics')
      .select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })
    if (pet && pet !== 'both') query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) query = query.eq('district', district)
    const { data } = await query
    return (data ?? []) as Clinic[]
  }

  const qLower = q.toLowerCase()

  // ── Layer 1: Fuzzy symptom match ──────────────────────────────────────────
  // Three checks (all case-insensitive):
  //   a) keyword contains q         e.g. keyword "牙齦紅腫" ⊇ query "牙齦"
  //   b) q contains keyword         e.g. query "牙齦問題" ⊇ keyword "牙齦"  (if it existed)
  //   c) keyword shares a 2-char bigram with q
  //      e.g. query "牙齦問題" has bigram "牙齦" which appears in keyword "牙齦紅腫"
  const { data: allSymptoms } = await supabase
    .from('symptoms')
    .select('keyword, specialty_tag')

  const qBigrams = new Set<string>()
  for (let i = 0; i < qLower.length - 1; i++) qBigrams.add(qLower.slice(i, i + 2))

  const fuzzyTags = new Set<string>()
  for (const { keyword, specialty_tag } of (allSymptoms ?? []) as { keyword: string; specialty_tag: string }[]) {
    const kLower = keyword.toLowerCase()
    const directMatch = kLower.includes(qLower) || qLower.includes(kLower)
    const bigramMatch = [...qBigrams].some((bg) => kLower.includes(bg))
    if (directMatch || bigramMatch) fuzzyTags.add(specialty_tag)
  }

  // ── Layer 2: Tag name match — bidirectional ───────────────────────────────
  for (const tag of KNOWN_TAGS) {
    const tLower = tag.toLowerCase()
    if (qLower.includes(tLower) || tLower.includes(qLower)) fuzzyTags.add(tag)
  }

  // ── Layers 1+2: Fetch clinics matching resolved tags ──────────────────────
  let tagClinics: Clinic[] = []
  if (fuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...fuzzyTags])
    if (pet && pet !== 'both') tagQuery = tagQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) tagQuery = tagQuery.eq('district', district)
    const { data } = await tagQuery
    tagClinics = (data ?? []) as Clinic[]
  }

  // ── Layer 3: Clinic name substring match ──────────────────────────────────
  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${q}%`)
  if (pet && pet !== 'both') nameQuery = nameQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  if (district) nameQuery = nameQuery.eq('district', district)
  const { data: nameClinics } = await nameQuery

  // ── Combine: tag matches first, then name-only additions ──────────────────
  const seen = new Set(tagClinics.map((c) => c.id))
  const nameOnly = ((nameClinics ?? []) as Clinic[]).filter((c) => !seen.has(c.id))
  return [...tagClinics, ...nameOnly]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pet?: string; district?: string; source?: string }>
}) {
  const { q = '', pet = '', district = '', source = '' } = await searchParams
  const clinics = await fetchClinics(q, pet, district)

  let title = `「${q}」的搜尋結果`
  if (!q.trim()) {
    title = source === 'nearby' ? '📍 附近的診所' : '瀏覽所有診所'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap">
            ← 回首頁
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-700 text-sm font-medium truncate flex-1">{title}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <Suspense fallback={
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        }>
          <ClinicList clinics={clinics} />
        </Suspense>
      </div>
    </main>
  )
}
