import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import ClinicList, { type Clinic } from './ClinicList'

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '24H急診', '復健', '中獸醫',
]

async function fetchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
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

  for (const tag of KNOWN_TAGS) {
    const tLower = tag.toLowerCase()
    if (qLower.includes(tLower) || tLower.includes(qLower)) fuzzyTags.add(tag)
  }

  let tagClinics: Clinic[] = []
  if (fuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...fuzzyTags])
    if (pet && pet !== 'both') tagQuery = tagQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) tagQuery = tagQuery.eq('district', district)
    const { data } = await tagQuery
    tagClinics = (data ?? []) as Clinic[]
  }

  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${q}%`)
  if (pet && pet !== 'both') nameQuery = nameQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  if (district) nameQuery = nameQuery.eq('district', district)
  const { data: nameClinics } = await nameQuery

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
    <main className="min-h-screen bg-brand">
      {/* Top bar */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-mist hover:text-snow text-sm font-medium whitespace-nowrap transition-colors">
            ← 回首頁
          </Link>
          <span className="text-mist/30">|</span>
          <span className="text-snow text-sm font-medium truncate flex-1">{title}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <Suspense fallback={
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-32 bg-ink rounded animate-pulse" />
          </div>
        }>
          <ClinicList clinics={clinics} />
        </Suspense>
      </div>
    </main>
  )
}
