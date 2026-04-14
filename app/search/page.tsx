import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import DistrictFilter from './DistrictFilter'
import PetFilter from './PetFilter'

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  specialty_tags: string[]
  is_24h: boolean
  is_appointment: boolean
  pet_types: string[]
}

const TAG_COLORS: Record<string, string> = {
  '牙科': 'bg-yellow-100 text-yellow-700',
  '眼科': 'bg-blue-100 text-blue-700',
  '心臟科': 'bg-red-100 text-red-700',
  '骨科': 'bg-orange-100 text-orange-700',
  '腫瘤科': 'bg-purple-100 text-purple-700',
  '皮膚科': 'bg-pink-100 text-pink-700',
  '神經科': 'bg-indigo-100 text-indigo-700',
  '泌尿科': 'bg-cyan-100 text-cyan-700',
  '24H急診': 'bg-red-100 text-red-700',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'
}

async function searchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('specialty_tag')
    .eq('keyword', q)

  const tags = [...new Set((symptoms ?? []).map((s: { specialty_tag: string }) => s.specialty_tag))]

  let query = tags.length > 0
    ? supabase.from('clinics').select('*').overlaps('specialty_tags', tags)
    : supabase.from('clinics').select('*').contains('specialty_tags', [q])

  if (pet && pet !== 'both') {
    query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  }
  if (district) {
    query = query.eq('district', district)
  }

  const { data } = await query
  return (data ?? []) as Clinic[]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pet?: string; district?: string }>
}) {
  const { q = '', pet = '', district = '' } = await searchParams
  const clinics = q ? await searchClinics(q, pet, district) : []

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap">
            ← 回首頁
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-700 text-sm font-medium truncate flex-1">
            {q ? `「${q}」的搜尋結果` : '搜尋結果'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-gray-600 text-sm">
              找到 <span className="font-bold text-teal-700">{clinics.length}</span> 間
            </p>
            <Suspense fallback={null}>
              <PetFilter />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <DistrictFilter />
          </Suspense>
        </div>

        {/* Results */}
        {clinics.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium">找不到符合的診所</p>
            <p className="text-sm mt-1">試試其他關鍵字，或移除篩選條件</p>
            <Link
              href="/"
              className="inline-block mt-6 px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              重新搜尋
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all"
              >
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-base font-bold text-gray-800 leading-snug">{clinic.name}</h2>
                  <div className="flex gap-1.5 shrink-0">
                    {clinic.is_24h && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white whitespace-nowrap">
                        24H急診
                      </span>
                    )}
                    {clinic.is_appointment && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                        需預約
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <p className="text-sm text-gray-500 mb-3">
                  📍 {clinic.district}{clinic.address && clinic.address !== clinic.district && !clinic.address.startsWith(clinic.district) ? `　${clinic.address}` : ''}
                </p>

                {/* Specialty tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {clinic.specialty_tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Phone + detail link */}
                <div className="flex items-center justify-between">
                  <a
                    href={`tel:${clinic.phone}`}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    📞 {clinic.phone}
                  </a>
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="text-sm text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    查看詳情 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
