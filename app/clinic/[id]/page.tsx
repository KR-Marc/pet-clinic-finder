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
    <main className="min-h-screen bg-brand">
      {/* Top bar */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/" className="text-mist hover:text-snow text-sm font-medium transition-colors">
            ← 回首頁
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header card */}
        <div className="bg-sand rounded-2xl p-6 shadow-sm mb-4">
          {/* Name + badges */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">{clinic.name}</h1>
            <div className="flex gap-1.5 shrink-0 mt-1">
              {clinic.is_24h && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral text-snow">
                  24H
                </span>
              )}
              {clinic.is_appointment && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold text-ink">
                  預約制
                </span>
              )}
            </div>
          </div>

          {/* District + rating */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-brand font-semibold">{clinic.district}</p>
            {clinic.rating != null && (
              <span className="text-sm font-semibold text-gold">⭐ {clinic.rating} / 5</span>
            )}
          </div>

          {/* Specialty tags */}
          {clinic.specialty_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {clinic.specialty_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-brand text-snow"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Info rows */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">📍</span>
              <div>
                <p className="text-xs text-ink/40 font-medium mb-0.5">地址</p>
                <p className="text-sm text-ink">{clinic.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">📞</span>
              <div>
                <p className="text-xs text-ink/40 font-medium mb-0.5">電話</p>
                <a
                  href={`tel:${clinic.phone}`}
                  className="text-sm text-brand font-medium hover:opacity-70 transition-opacity"
                >
                  {clinic.phone}
                </a>
              </div>
            </div>

            {clinic.website && (
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">🌐</span>
                <div>
                  <p className="text-xs text-ink/40 font-medium mb-0.5">網站</p>
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand font-medium hover:opacity-70 transition-opacity break-all"
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
                  <p className="text-xs text-ink/40 font-medium mb-0.5">介紹</p>
                  <p className="text-sm text-ink">{clinic.description}</p>
                </div>
              </div>
            )}

            {clinic.opening_hours && clinic.opening_hours.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">🕐</span>
                <div>
                  <p className="text-xs text-ink/40 font-medium mb-1">營業時間</p>
                  <ul className="flex flex-col gap-0.5">
                    {clinic.opening_hours.map((line, i) => (
                      <li key={i} className="text-sm text-ink">{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Google Maps embed */}
        <div className="bg-sand rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-ink/10">
            <p className="text-sm font-medium text-ink">地圖位置</p>
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
            className="flex-1 bg-gold hover:opacity-90 text-ink py-3 rounded-xl text-center font-semibold text-sm transition-opacity"
          >
            📞 立即撥打
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-sand border border-mist/40 hover:border-gold text-ink hover:text-brand py-3 rounded-xl text-center font-medium text-sm transition-all"
          >
            🗺 Google Maps
          </a>
        </div>
      </div>
    </main>
  )
}
