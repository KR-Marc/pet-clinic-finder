import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const KNOWN_TAGS = ['牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科', '神經外科', '泌尿科', '腎臟科', '外科', '24H急診', '復健', '中獸醫']

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const term = q.trim()
  if (!term) return NextResponse.json({ error: 'no query' })

  const tLower = term.toLowerCase()

  // 1. bigram
  const bigrams: string[] = []
  for (let i = 0; i < tLower.length - 1; i++) bigrams.push(tLower.slice(i, i + 2))

  // 2. symptoms table
  const { data: allSymptoms } = await supabase.from('symptoms').select('keyword, specialty_tag')
  const symptomMatches: { keyword: string; tag: string; matchType: string }[] = []
  const tagsFromSymptoms = new Set<string>()

  for (const { keyword, specialty_tag } of (allSymptoms ?? []) as { keyword: string; specialty_tag: string }[]) {
    const kLower = keyword.toLowerCase()
    const directMatch = kLower.includes(tLower) || tLower.includes(kLower)
    const bigramHits = bigrams.filter(bg => kLower.includes(bg)).length
    const bigramMatch = tLower.length >= 4 ? bigramHits >= 2 : bigramHits >= 1
    if (directMatch || bigramMatch) {
      symptomMatches.push({ keyword, tag: specialty_tag, matchType: directMatch ? 'direct' : `bigram(${bigramHits})` })
      tagsFromSymptoms.add(specialty_tag)
    }
  }

  // 3. KNOWN_TAGS direct
  const tagsFromKnown: string[] = []
  for (const tag of KNOWN_TAGS) {
    if (tLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(tLower)) {
      tagsFromKnown.push(tag)
    }
  }

  // 4. AI
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  let aiResult: { specialties?: string[] } = {}
  try {
    const res = await fetch(`${baseUrl}/api/symptom-explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: [term] }),
    })
    aiResult = await res.json()
  } catch { /* ignore */ }

  // 5. final tags
  const allTags = new Set([...tagsFromSymptoms, ...tagsFromKnown, ...(aiResult.specialties ?? [])])

  // 6. clinic count
  const { data: clinics } = await supabase.from('clinics').select('id, name, specialty_tags').overlaps('specialty_tags', [...allTags])

  return NextResponse.json({
    query: term,
    bigrams,
    symptomMatches: symptomMatches.slice(0, 20),
    tagsFromSymptoms: [...tagsFromSymptoms],
    tagsFromKnown,
    aiSpecialties: aiResult.specialties ?? [],
    finalTags: [...allTags],
    clinicCount: clinics?.length ?? 0,
    clinicSample: clinics?.slice(0, 3).map(c => ({ name: c.name, tags: c.specialty_tags })) ?? [],
  })
}
