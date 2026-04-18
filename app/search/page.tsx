import { Suspense } from 'react'
import { MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ClinicList, { type Clinic } from './ClinicList'
import SearchBar from './SearchBar'
import { ClayNav, ClayFooter } from '@/app/components/clay'

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '內科', '24H急診',
  '復健', '中獸醫',
]

const TAG_REMAP: Record<string, string> = {
  '健檢': '外科',
  '行為醫學': '中獸醫',
  '呼吸科': '心臟科',
  '重症加護': '24H急診',
  '一般科': '外科',
  '腸胃科': '外科',
  '感染科': '外科',
}

function remapTags(tags: string[]): string[] {
  return tags.map(t => TAG_REMAP[t] ?? t)
}

const aiTagCache = new Map<string, string[]>()

async function fetchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)

  if (queryTerms.length === 0) {
    let query = supabase
      .from('clinics').select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })
    if (pet && pet !== 'both') query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) query = query.eq('district', district)
    const { data } = await query
    return (data ?? []) as Clinic[]
  }

  const { data: allSymptoms } = await supabase
    .from('symptoms').select('keyword, specialty_tag')

  const tagSetsPerTerm: Set<string>[] = queryTerms.map((term) => {
    const tLower = term.toLowerCase()
    const bigrams = new Set<string>()
    for (let i = 0; i < tLower.length - 1; i++) bigrams.add(tLower.slice(i, i + 2))
    const tags = new Set<string>()
    for (const { keyword, specialty_tag } of (allSymptoms ?? []) as { keyword: string; specialty_tag: string }[]) {
      const kLower = keyword.toLowerCase()
      const directMatch = kLower.includes(tLower) || tLower.includes(kLower)
      const bigramHits = [...bigrams].filter((bg) => kLower.includes(bg)).length
      const bigramMatch = tLower.length >= 4 ? bigramHits >= 2 : bigramHits >= 1
      if (directMatch || bigramMatch) tags.add(specialty_tag)
    }
    for (const tag of KNOWN_TAGS) {
      const tagLower = tag.toLowerCase()
      if (tLower.includes(tagLower) || tagLower.includes(tLower)) tags.add(tag)
    }
    return tags
  })

  let tagClinics: Clinic[] = []
  const allFuzzyTags = new Set<string>([...tagSetsPerTerm.flatMap((s) => [...s])])
  let lastAiTags: string[] = []

  if (queryTerms.length > 0) {
    const cacheKey = queryTerms.join(',')
    if (aiTagCache.has(cacheKey)) {
      lastAiTags = aiTagCache.get(cacheKey)!
      lastAiTags.forEach((t) => allFuzzyTags.add(t))
    } else {
      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/symptom-explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: queryTerms }),
        })
        const data = await res.json()
        if (data.specialties && Array.isArray(data.specialties)) {
          const remapped = remapTags(data.specialties)
          aiTagCache.set(cacheKey, remapped)
          lastAiTags = remapped
          remapped.forEach((t: string) => allFuzzyTags.add(t))
        }
        if (data.extractedSymptoms && Array.isArray(data.extractedSymptoms)) {
          const { data: extraSymptoms } = await supabase
            .from('symptoms').select('specialty_tag')
            .in('keyword', data.extractedSymptoms)
          if (extraSymptoms) {
            const extraRemapped = remapTags(extraSymptoms.map((s: { specialty_tag: string }) => s.specialty_tag))
            extraRemapped.forEach((t: string) => allFuzzyTags.add(t))
            lastAiTags = [...new Set([...lastAiTags, ...extraRemapped])]
          }
        }
      } catch {}
    }
  }

  if (allFuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...allFuzzyTags])
    if (pet && pet !== 'both') tagQuery = tagQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) tagQuery = tagQuery.eq('district', district)
    const { data } = await tagQuery
    let results = (data ?? []) as Clinic[]
    if (queryTerms.length > 1) {
      results = results.filter((clinic) =>
        tagSetsPerTerm.every((tagSet) =>
          tagSet.size === 0 || clinic.specialty_tags.some((t) => tagSet.has(t))
        )
      )
    }
    tagClinics = results
  }

  if (tagClinics.length === 0 && lastAiTags.length > 0) {
    let fallbackQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', lastAiTags)
    if (pet && pet !== 'both') fallbackQuery = fallbackQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) fallbackQuery = fallbackQuery.eq('district', district)
    const { data: fallbackData } = await fallbackQuery
    tagClinics = (fallbackData ?? []) as Clinic[]
  }

  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${queryTerms[0]}%`)
  if (pet && pet !== 'both') nameQuery = nameQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  if (district) nameQuery = nameQuery.eq('district', district)
  const { data: nameClinics } = await nameQuery
  const seen = new Set(tagClinics.map((c) => c.id))
  const nameOnly = ((nameClinics ?? []) as Clinic[]).filter((c) => !seen.has(c.id))

  const scoredTagClinics = tagClinics.map((clinic) => {
    const matchCount = clinic.specialty_tags.filter((t) => allFuzzyTags.has(t)).length
    return { clinic, score: matchCount }
  })
  scoredTagClinics.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ratingA = a.clinic.rating ?? 0
    const ratingB = b.clinic.rating ?? 0
    return ratingB - ratingA
  })

  return [...scoredTagClinics.map((s) => s.clinic), ...nameOnly]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pet?: string; district?: string; source?: string }>
}) {
  const { q = '', pet = '', district = '', source = '' } = await searchParams
  const clinics = await fetchClinics(q, pet, district)

  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)
  const subtitleText = queryTerms.length === 0
    ? (source === 'nearby' ? '附近的診所' : '瀏覽所有診所')
    : queryTerms.length === 1
      ? `搜尋「${queryTerms[0]}」`
      : `複合搜尋「${queryTerms.join('」+「')}」`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      <ClayNav current="search" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* Subtitle */}
        <div style={{
          fontSize: 13, color: 'var(--color-clay-text-mute)',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {source === 'nearby' && <MapPin size={13} />}
          {subtitleText}
        </div>

        {/* Search bar (tags input) */}
        <Suspense fallback={null}>
          <SearchBar initialQ={q} initialPet={pet} />
        </Suspense>

        {/* Results */}
        <Suspense fallback={
          <div style={{
            padding: 24, marginTop: 16,
            background: 'var(--color-clay-surface)',
            border: '1px solid var(--color-clay-border)',
            borderRadius: 14, fontSize: 13,
            color: 'var(--color-clay-text-mute)',
          }}>載入中⋯</div>
        }>
          <ClinicList clinics={clinics} queryTerms={queryTerms} source={source} />
        </Suspense>
      </div>

      <ClayFooter />
    </div>
  )
}
