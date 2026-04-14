import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  website: string | null
  description: string | null
  specialty_tags: string[]
  is_24h: boolean
  is_appointment: boolean
  pet_types: string[]
  rating: number | null
  opening_hours: string[] | null
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

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const clinic = data as Clinic
  const mapQuery = encodeURIComponent(`${clinic.name} ${clinic.address} 台北`)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
            ← 回首頁
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          {/* Name + badges */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-800">{clinic.name}</h1>
            <div className="flex gap-1.5 shrink-0 mt-1">
              {clinic.is_24h && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                  24H
                </span>
              )}
              {clinic.is_appointment && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                  預約制
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-teal-600 font-medium">{clinic.district}</p>
            {clinic.rating != null && (
              <span className="text-sm font-semibold text-amber-500">⭐ {clinic.rating} / 5</span>
            )}
          </div>

          {/* Specialty tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {clinic.specialty_tags.map((tag) => (
              <span
                key={tag}
                className={`px-3 py-1 rounded-full text-sm font-medium ${tagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Info rows */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">📍</span>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">地址</p>
                <p className="text-sm text-gray-700">{clinic.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">📞</span>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">電話</p>
                <a
                  href={`tel:${clinic.phone}`}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  {clinic.phone}
                </a>
              </div>
            </div>

            {clinic.website && (
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">🌐</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">網站</p>
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium break-all"
                  >
                    {clinic.website}
                  </a>
                </div>
              </div>
            )}

            {clinic.description && (
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">📋</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">介紹</p>
                  <p className="text-sm text-gray-700">{clinic.description}</p>
                </div>
              </div>
            )}

            {clinic.opening_hours && clinic.opening_hours.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">🕐</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">營業時間</p>
                  <ul className="flex flex-col gap-0.5">
                    {clinic.opening_hours.map((line, i) => (
                      <li key={i} className="text-sm text-gray-700">{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Google Maps embed */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">地圖位置</p>
          </div>
          <iframe
            title={`${clinic.name} 地圖`}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <a
            href={`tel:${clinic.phone}`}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-center font-medium text-sm transition-colors"
          >
            📞 立即撥打
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-gray-300 hover:border-teal-400 text-gray-700 hover:text-teal-600 py-3 rounded-xl text-center font-medium text-sm transition-colors"
          >
            🗺 Google Maps
          </a>
        </div>
      </div>
    </main>
  )
}
