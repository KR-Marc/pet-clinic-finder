import type { Metadata } from 'next'
import { AlertTriangle, ClipboardList, Clock, Globe, Map, MapPin, PawPrint, Phone, Siren, Star } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BackButton from './BackButton'
import ShareButton from './ShareButton'
import ReportButton from './ReportButton'
import FavoriteButton from './FavoriteButton'
import RecentlyViewedTracker from './RecentlyViewedTracker'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  review_count: number | null
  updated_at: string | null
}

interface SimilarClinic {
  id: string
  name: string
  district: string
  rating: number | null
  specialty_tags: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
// Display labels: Mon-first order for the hours table
const WEEKDAYS_TABLE = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
const DAY_SHORT: Record<string, string> = {
  '星期一': '週一', '星期二': '週二', '星期三': '週三', '星期四': '週四',
  '星期五': '週五', '星期六': '週六', '星期日': '週日',
}

function getTaiwanWeekday(): string {
  const tw = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return WEEKDAY_NAMES[tw.getDay()]
}

function parseHoursMap(openingHours: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of openingHours) {
    const idx = entry.indexOf(': ')
    if (idx >= 0) map[entry.slice(0, idx)] = entry.slice(idx + 2)
  }
  return map
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data } = await supabase
    .from('clinics')
    .select('name, district, address, specialty_tags, description')
    .eq('id', id)
    .single()

  if (!data) {
    return {
      title: '診所未找到 | 台北寵物專科診所搜尋',
    }
  }

  const tags = data.specialty_tags?.length > 0
    ? data.specialty_tags.join('、')
    : '動物醫院'

  const description = data.description
    || `${data.name}位於台北市${data.district}，提供${tags}等專科服務。查看營業時間、地址與聯絡方式。`

  return {
    title: `${data.name} | 台北寵物專科診所`,
    description,
    openGraph: {
      title: `${data.name} | 台北寵物專科診所`,
      description,
      url: `https://pet-clinic-finder.vercel.app/clinic/${id}`,
      siteName: '台北寵物專科診所搜尋',
      locale: 'zh_TW',
      type: 'website',
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch clinic
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const clinic = data as Clinic

  // Fetch similar clinics (same district, overlapping tags)
  let simQuery = supabase
    .from('clinics')
    .select('id, name, district, rating, specialty_tags')
    .eq('district', clinic.district)
    .neq('id', id)
    .limit(3)
  if (clinic.specialty_tags.length > 0) {
    simQuery = simQuery.overlaps('specialty_tags', clinic.specialty_tags)
  }
  const { data: similar } = await simQuery

  // Today info
  const todayName = getTaiwanWeekday()
  const hoursMap = clinic.opening_hours ? parseHoursMap(clinic.opening_hours) : {}
  const todayHours = hoursMap[todayName] ?? null
  const isOpenToday = todayHours !== null && todayHours !== '休息'

  const mapQuery = encodeURIComponent(`${clinic.name} ${clinic.address} 台北`)

  // 簡單異常偵測：評論數超過 1000 且評分高於 4.8 顯示提示
  const showReviewWarning = (clinic.review_count ?? 0) > 2000 && (clinic.rating ?? 0) >= 4.0

  return (
    <main className="min-h-screen bg-brand">
      <RecentlyViewedTracker
        id={clinic.id}
        name={clinic.name}
        district={clinic.district}
        rating={clinic.rating}
        specialty_tags={clinic.specialty_tags}
      />

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <span className="text-mist/30 shrink-0">|</span>
          <Link href="/" className="text-mist/50 hover:text-snow text-sm transition-colors shrink-0">
            <PawPrint size={14} className="inline mr-1" />首頁
          </Link>
          <span className="text-mist/30 shrink-0">|</span>
          <Link href="/emergency" className="text-xs font-bold transition-colors shrink-0 hover:opacity-80" style={{ color: '#e16162' }}>
            🚨 急診
          </Link>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="bg-brand border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          {/* Clinic name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3 leading-snug">
            {clinic.name}
          </h1>

          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-mist">{clinic.district}</span>
            {clinic.rating != null && (
              <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>
                <Star size={14} className="inline mr-1 fill-gold text-gold" />{clinic.rating}
                {clinic.review_count != null && (
                  <span className="text-xs font-normal ml-1" style={{ color: 'rgba(249,188,96,0.6)' }}>
                    （{clinic.review_count.toLocaleString()} 則評論）
                  </span>
                )}
              </span>
            )}
            {clinic.is_24h && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-coral text-snow">
                24H急診
              </span>
            )}
            {clinic.is_appointment && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold text-ink">
                需預約
              </span>
            )}
            {todayHours !== null && (
              <span
                className="text-xs font-semibold"
                style={{ color: isOpenToday ? '#4ade80' : '#e16162' }}
              >
                {isOpenToday ? '🟢 今日營業中' : '🔴 今日休息'}
              </span>
            )}
          </div>

          {/* Specialty tags */}
          {clinic.specialty_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {clinic.specialty_tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-ink text-mist hover:bg-mist/20 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {showReviewWarning && (
            <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(249,188,96,0.1)', color: '#f9bc60', border: '1px solid rgba(249,188,96,0.2)' }}>
              <AlertTriangle size={14} />
              <span>此診所評論數量較多，建議參考多方資訊後再決定就診</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Two-column: info card + map */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

          {/* LEFT — info card */}
          <div className="lg:col-span-3 bg-sand rounded-xl p-6">

            {/* Address */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 mb-5 group"
            >
              <MapPin size={18} className="shrink-0 mt-0.5 text-mist/60" />
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(0,30,29,0.4)' }}>地址</p>
                <p className="text-sm text-ink group-hover:text-brand transition-colors leading-relaxed">
                  {clinic.address}
                </p>
              </div>
            </a>

            {/* Phone */}
            <a href={`tel:${clinic.phone}`} className="flex items-start gap-3 mb-5 group">
              <Phone size={18} className="shrink-0 mt-0.5 text-mist/60" />
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(0,30,29,0.4)' }}>電話</p>
                <p className="text-sm font-semibold text-brand group-hover:opacity-70 transition-opacity">
                  {clinic.phone}
                </p>
              </div>
            </a>

            {/* Website */}
            {clinic.website && (
              <a
                href={clinic.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 mb-5 group"
              >
                <Globe size={18} className="shrink-0 mt-0.5 text-mist/60" />
                <div className="min-w-0">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(0,30,29,0.4)' }}>網站</p>
                  <p className="text-sm font-medium text-brand group-hover:opacity-70 transition-opacity truncate">
                    {clinic.website}
                  </p>
                </div>
              </a>
            )}

            {/* Opening hours table */}
            <div className="flex items-start gap-3">
              <Clock size={18} className="shrink-0 mt-0.5 text-mist/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-2" style={{ color: 'rgba(0,30,29,0.4)' }}>
                  營業時間
                </p>
                {Object.keys(hoursMap).length > 0 ? (
                  <div className="rounded-lg overflow-hidden border border-ink/10">
                    {WEEKDAYS_TABLE.map((day) => {
                      const hrs = hoursMap[day]
                      if (!hrs) return null
                      const isToday = day === todayName
                      const isClosed = hrs === '休息'
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between px-3 py-2 text-sm border-b border-ink/5 last:border-0"
                          style={isToday ? { background: 'rgba(249,188,96,0.18)' } : undefined}
                        >
                          <span
                            className="w-10 shrink-0 text-xs"
                            style={{
                              color: isToday ? '#001e1d' : 'rgba(0,30,29,0.5)',
                              fontWeight: isToday ? 700 : 500,
                            }}
                          >
                            {DAY_SHORT[day]}
                          </span>
                          <span
                            className="text-xs text-right"
                            style={{
                              color: isClosed ? '#e16162' : isToday ? '#001e1d' : 'rgba(0,30,29,0.7)',
                              fontWeight: isToday ? 700 : 400,
                            }}
                          >
                            {hrs}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'rgba(0,30,29,0.4)' }}>
                    營業時間未收錄，建議來電確認
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {clinic.description && (
              <div className="flex items-start gap-3 mt-5 pt-5 border-t border-ink/10">
                <ClipboardList size={18} className="shrink-0 mt-0.5 text-mist/60" />
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'rgba(0,30,29,0.4)' }}>介紹</p>
                  <p className="text-sm text-ink leading-relaxed">{clinic.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — map */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden relative" style={{ minHeight: '350px' }}>
            <iframe
              title={`${clinic.name} 地圖位置`}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', minHeight: '350px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${mapQuery}`}
            />
          </div>
        </div>

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <a
            href={`tel:${clinic.phone}`}
            className="shrink-0 min-w-[120px] py-3 rounded-xl text-center font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: '#f9bc60', color: '#001e1d' }}
          >
            <><Phone size={16} className="inline-block mr-1.5" />立即撥打</>
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 min-w-[160px] py-3 rounded-xl text-center font-medium text-sm transition-colors hover:text-snow border border-mist/30 bg-ink text-mist"
          >
            <><Map size={16} className="inline-block mr-1.5" />Google Maps 導航</>
          </a>
          {clinic.website && (
            <a
              href={clinic.website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 min-w-[120px] py-3 rounded-xl text-center font-medium text-sm transition-colors hover:opacity-80 border border-mist/30 bg-ink text-mist"
            >
              <Globe size={15} className="inline mr-1.5" />官網預約
            </a>
          )}
          <ShareButton name={clinic.name} />
          <FavoriteButton clinic={{
            id: clinic.id,
            name: clinic.name,
            district: clinic.district,
            rating: clinic.rating,
            specialty_tags: clinic.specialty_tags,
          }} />
        </div>

        {/* ── Similar clinics ───────────────────────────────────────────────── */}
        {similar && similar.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-snow mb-4">同區域其他診所</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(similar as SimilarClinic[]).map((c) => (
                <Link
                  key={c.id}
                  href={`/clinic/${c.id}`}
                  className="bg-sand rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm text-ink leading-snug">{c.name}</h3>
                    {c.rating != null && (
                      <span className="text-xs font-bold shrink-0" style={{ color: '#f9bc60' }}>
                        ⭐ {c.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'rgba(0,30,29,0.5)' }}>
                    📍 {c.district}
                  </p>
                  {c.specialty_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.specialty_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
                    查看詳情 →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-mist/20 px-6 py-5 text-center">
            <p className="text-sm text-mist/60 mb-3">此區域暫無其他專科診所資料</p>
            <Link
              href="/search"
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#f9bc60', color: '#001e1d' }}
            >
              搜尋全台北診所 →
            </Link>
          </div>
        )}

        {/* Report button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {/* 資料來源 + 最後更新時間 */}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(171,209,198,0.4)' }}>
            <span>資料來源：Google Maps</span>
            {clinic.updated_at && (
              <>
                <span>·</span>
                <span>最後更新：{new Date(clinic.updated_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </>
            )}
          </div>
          <ReportButton clinicId={clinic.id} clinicName={clinic.name} />
        </div>
      </div>
    </main>
  )
}
