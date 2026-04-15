'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import PetFilter from './PetFilter'
import DistrictFilter from './DistrictFilter'
import OpenFilter from './OpenFilter'

export interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  specialty_tags: string[]
  is_24h: boolean
  is_appointment: boolean
  pet_types: string[]
  rating: number | null
  opening_hours: string[] | null
}

const TAG_COLORS: Record<string, string> = {
  '牙科':    'bg-yellow-100 text-yellow-700',
  '眼科':    'bg-blue-100 text-blue-700',
  '心臟科':  'bg-red-100 text-red-700',
  '骨科':    'bg-orange-100 text-orange-700',
  '腫瘤科':  'bg-purple-100 text-purple-700',
  '皮膚科':  'bg-pink-100 text-pink-700',
  '神經科':  'bg-indigo-100 text-indigo-700',
  '泌尿科':  'bg-cyan-100 text-cyan-700',
  '24H急診': 'bg-red-100 text-red-700',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'
}

// Map JS getDay() (0=Sun) to Chinese weekday strings used in opening_hours
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getTodayName(): string {
  // Interpret current time in Taiwan timezone
  const taiwanDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return WEEKDAYS[taiwanDate.getDay()]
}

function getTodayHours(openingHours: string[] | null): string | null {
  if (!openingHours?.length) return null
  const today = getTodayName()
  const entry = openingHours.find((h) => h.startsWith(today))
  if (!entry) return null
  // "星期一: 10:00 – 20:00" → "10:00 – 20:00"
  const colonIdx = entry.indexOf(': ')
  return colonIdx >= 0 ? entry.slice(colonIdx + 2) : null
}

function isOpenToday(clinic: Clinic): boolean {
  if (clinic.is_24h) return true
  const hours = getTodayHours(clinic.opening_hours)
  if (hours === null) return false  // no data → exclude when filtering
  return hours !== '休息'
}

export default function ClinicList({ clinics }: { clinics: Clinic[] }) {
  const searchParams = useSearchParams()
  const openOnly = searchParams.get('open') === 'true'

  const filtered = useMemo(
    () => (openOnly ? clinics.filter(isOpenToday) : clinics),
    [clinics, openOnly],
  )

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-gray-600 text-sm">
            找到 <span className="font-bold text-teal-700">{filtered.length}</span> 間
          </p>
          <PetFilter />
          <OpenFilter />
        </div>
        <DistrictFilter />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
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
          {filtered.map((clinic) => {
            const todayHours = getTodayHours(clinic.opening_hours)
            const isClosed = todayHours === '休息'

            return (
              <div
                key={clinic.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all"
              >
                {/* Name + rating + badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-base font-bold text-gray-800 leading-snug">{clinic.name}</h2>
                    {clinic.rating != null && (
                      <span className="text-xs font-medium text-amber-500 whitespace-nowrap shrink-0">
                        ⭐ {clinic.rating}
                      </span>
                    )}
                  </div>
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
                <p className="text-sm text-gray-500 mb-1.5">
                  📍 {clinic.district}
                  {clinic.address &&
                    clinic.address !== clinic.district &&
                    !clinic.address.startsWith(clinic.district)
                    ? `　${clinic.address}`
                    : ''}
                </p>

                {/* Today's opening hours */}
                {todayHours && (
                  <p className={`text-xs mb-3 font-medium ${isClosed ? 'text-red-400' : 'text-green-600'}`}>
                    🕐 今日{isClosed ? ' 休息' : ` ${todayHours}`}
                  </p>
                )}

                {/* Specialty tags */}
                {clinic.specialty_tags.length > 0 && (
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
                )}

                {/* Phone + detail link */}
                <div className="flex items-center justify-between mt-1">
                  {clinic.phone ? (
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      📞 {clinic.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-300">電話未提供</span>
                  )}
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="text-sm text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    查看詳情 →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
