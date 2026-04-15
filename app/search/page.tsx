import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import ClinicList, { type Clinic } from './ClinicList'
import SearchBar from './SearchBar'

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '24H急診', '復健', '中獸醫',
]

async function getTagsFromAI(terms: string[]): Promise<string[]> {
  const AI_KNOWN_TAGS = ['牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科', '神經外科', '泌尿科', '腎臟科', '外科', '復健', '中獸醫', '24H急診', '重症加護', '內科', '呼吸科', '健檢', '行為醫學']
  const apiKey = process.env.GEMINI_API_KEY
  console.log('[AI Fallback] apiKey exists:', !!apiKey, 'length:', apiKey?.length ?? 0)
  if (!apiKey) return []

  const prompt = `寵物出現以下症狀：${terms.join('、')}

從以下專科清單中，選出最相關的 1-3 個專科（只輸出專科名稱，用逗號分隔，不要其他文字）：
${AI_KNOWN_TAGS.join('、')}`

  try {
    console.log('[AI Fallback] calling Gemini with prompt:', prompt.slice(0, 50))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0 },
        }),
      }
    )
    const data = await res.json()
    console.log('[AI Fallback] response status:', res.status)
    console.log('[AI Fallback] data keys:', Object.keys(data))
    console.log('[AI Fallback] full data:', JSON.stringify(data).slice(0, 300))
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('[AI Fallback] raw text:', JSON.stringify(text))
    const result = text.split(/[,，、\n]/).map((t: string) => t.trim()).filter((t: string) => AI_KNOWN_TAGS.includes(t))
    console.log('[AI Fallback] parsed result:', result)
    return result
  } catch (e) {
    console.log('[AI Fallback] error:', e)
    return []
  }
}

async function fetchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
  // 支援多症狀複合查詢（逗號分隔）
  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)

  if (queryTerms.length === 0) {
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

  const { data: allSymptoms } = await supabase
    .from('symptoms')
    .select('keyword, specialty_tag')

  // 每個查詢詞各自找出對應的 specialty tags
  const tagSetsPerTerm: Set<string>[] = queryTerms.map((term) => {
    const tLower = term.toLowerCase()
    const bigrams = new Set<string>()
    for (let i = 0; i < tLower.length - 1; i++) bigrams.add(tLower.slice(i, i + 2))

    const tags = new Set<string>()
    for (const { keyword, specialty_tag } of (allSymptoms ?? []) as { keyword: string; specialty_tag: string }[]) {
      const kLower = keyword.toLowerCase()
      const directMatch = kLower.includes(tLower) || tLower.includes(kLower)
      const bigramMatch = [...bigrams].some((bg) => kLower.includes(bg))
      if (directMatch || bigramMatch) tags.add(specialty_tag)
    }
    for (const tag of KNOWN_TAGS) {
      const tagLower = tag.toLowerCase()
      if (tLower.includes(tagLower) || tagLower.includes(tLower)) tags.add(tag)
    }
    return tags
  })

  // 單一症狀：用 overlaps（OR 邏輯）
  // 多症狀：先各自查，再取交集（AND 邏輯）
  let tagClinics: Clinic[] = []
  const allFuzzyTags = new Set<string>([...tagSetsPerTerm.flatMap((s) => [...s])])

  // 如果 symptoms 表找不到任何 tag，用 AI 判斷
  if (allFuzzyTags.size === 0 && queryTerms.length > 0) {
    console.log('[AI Fallback] Triggering for terms:', queryTerms)
    const aiTags = await getTagsFromAI(queryTerms)
    console.log('[AI Fallback] Got tags:', aiTags)
    aiTags.forEach(t => allFuzzyTags.add(t))
    console.log('[AI Fallback] allFuzzyTags after:', [...allFuzzyTags])
  }

  if (allFuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...allFuzzyTags])
    if (pet && pet !== 'both') tagQuery = tagQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) tagQuery = tagQuery.eq('district', district)
    const { data } = await tagQuery
    let results = (data ?? []) as Clinic[]

    // 多症狀時，過濾出同時符合所有症狀對應 tag 的診所
    if (queryTerms.length > 1) {
      results = results.filter((clinic) =>
        tagSetsPerTerm.every((tagSet) =>
          tagSet.size === 0 || clinic.specialty_tags.some((t) => tagSet.has(t))
        )
      )
    }
    tagClinics = results
  }

  // 名稱搜尋只用第一個關鍵字
  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${queryTerms[0]}%`)
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

  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)
  const subtitle = queryTerms.length === 0
    ? (source === 'nearby' ? '📍 附近的診所' : '瀏覽所有診所')
    : queryTerms.length === 1
      ? `「${queryTerms[0]}」`
      : `「${queryTerms.join('」+「')}」複合搜尋`

  return (
    <main className="min-h-screen bg-brand">
      {/* ── Top bar ── */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-mist hover:text-snow text-sm font-medium whitespace-nowrap transition-colors shrink-0"
          >
            ← 回首頁
          </Link>
          <span className="text-mist/30 shrink-0">|</span>
          <span className="text-snow text-sm font-medium truncate">{subtitle}</span>
        </div>
      </div>

      {/* ── Inline search bar ── */}
      <div className="bg-ink/60 border-b border-mist/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Suspense fallback={null}>
            <SearchBar initialQ={q} initialPet={pet} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        <Suspense fallback={
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-32 bg-ink rounded animate-pulse" />
          </div>
        }>
          <ClinicList clinics={clinics} queryTerms={queryTerms} />
        </Suspense>
      </div>
    </main>
  )
}
