import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '診所比較 | 台北寵物專科診所搜尋',
}

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
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

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids = '' } = await searchParams
  const idList = ids.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 3)
  if (idList.length < 2) notFound()

  const { data: clinics } = await supabase
    .from('clinics')
    .select('*')
    .in('id', idList)

  if (!clinics || clinics.length < 2) notFound()

  const todayName = getTaiwanWeekday()

  return (
    <main className="min-h-screen bg-brand">
      {/* Nav */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/search" className="text-mist/50 hover:text-snow text-sm transition-colors">
            ← 回搜尋結果
          </Link>
          <span className="text-mist/30">|</span>
          <span className="text-snow text-sm font-medium">診所比較</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${clinics.length * 240}px` }}>
          {/* Header row — clinic names */}
          <thead>
            <tr>
              <th className="w-28 shrink-0" />
              {clinics.map((clinic) => (
                <th key={clinic.id} className="px-4 pb-4 text-left align-top">
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="font-bold text-base text-snow hover:text-gold transition-colors leading-snug block"
                  >
                    {clinic.name}
                  </Link>
                  <p className="text-xs text-mist/50 mt-1">📍 {clinic.district}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rating */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4 text-xs font-semibold text-mist/50 align-top">評分</td>
              {clinics.map((clinic) => (
                <td key={clinic.id} className="px-4 py-4 align-top">
                  {clinic.rating != null ? (
                    <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>⭐ {clinic.rating}</span>
                  ) : (
                    <span className="text-xs text-mist/30">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* 24H / Appointment */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4 text-xs font-semibold text-mist/50 align-top">特色</td>
              {clinics.map((clinic) => (
                <td key={clinic.id} className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {clinic.is_24h && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#e16162', color: '#fff' }}>24H急診</span>
                    )}
                    {clinic.is_appointment && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f9bc60', color: '#001e1d' }}>需預約</span>
                    )}
                    {!clinic.is_24h && !clinic.is_appointment && (
                      <span className="text-xs text-mist/30">—</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Specialty tags */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4 text-xs font-semibold text-mist/50 align-top">專科</td>
              {clinics.map((clinic) => (
                <td key={clinic.id} className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {clinic.specialty_tags?.length > 0
                      ? clinic.specialty_tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow">{tag}</span>
                        ))
                      : <span className="text-xs text-mist/30">—</span>
                    }
                  </div>
                </td>
              ))}
            </tr>

            {/* Phone */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4 text-xs font-semibold text-mist/50 align-top">電話</td>
              {clinics.map((clinic) => (
                <td key={clinic.id} className="px-4 py-4 align-top">
                  {clinic.phone ? (
                    <a href={`tel:${clinic.phone}`} className="text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: '#f9bc60' }}>
                      {clinic.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-mist/30">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Opening hours */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4 text-xs font-semibold text-mist/50 align-top">營業時間</td>
              {clinics.map((clinic) => {
                const hoursMap = clinic.opening_hours ? parseHoursMap(clinic.opening_hours) : {}
                return (
                  <td key={clinic.id} className="px-4 py-4 align-top">
                    {Object.keys(hoursMap).length > 0 ? (
                      <div className="rounded-lg overflow-hidden border border-mist/10">
                        {WEEKDAYS_TABLE.map((day) => {
                          const hrs = hoursMap[day]
                          if (!hrs) return null
                          const isToday = day === todayName
                          const isClosed = hrs === '休息'
                          return (
                            <div
                              key={day}
                              className="flex items-center justify-between px-2 py-1.5 text-xs border-b border-mist/5 last:border-0"
                              style={isToday ? { background: 'rgba(249,188,96,0.15)' } : undefined}
                            >
                              <span className="w-8 shrink-0" style={{ color: isToday ? '#f9bc60' : 'rgba(171,209,198,0.5)', fontWeight: isToday ? 700 : 400 }}>
                                {DAY_SHORT[day]}
                              </span>
                              <span style={{ color: isClosed ? '#e16162' : isToday ? '#f9bc60' : 'rgba(171,209,198,0.7)', fontWeight: isToday ? 700 : 400 }}>
                                {hrs}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-mist/30">未收錄</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Action row */}
            <tr className="border-t border-mist/10">
              <td className="py-4 pr-4" />
              {clinics.map((clinic) => (
                <td key={clinic.id} className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <a
                      href={`tel:${clinic.phone}`}
                      className="block text-center py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: '#f9bc60', color: '#001e1d' }}
                    >
                      📞 立即撥打
                    </a>
                    <Link
                      href={`/clinic/${clinic.id}`}
                      className="block text-center py-2 rounded-xl text-xs font-medium hover:text-snow transition-colors border border-mist/30 text-mist"
                    >
                      查看詳情 →
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  )
}
