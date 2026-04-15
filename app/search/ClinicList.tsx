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

// Map JS getDay() (0=Sun) to Chinese weekday strings used in opening_hours
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getTodayName(): string {
  const taiwanDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return WEEKDAYS[taiwanDate.getDay()]
}

function getTodayHours(openingHours: string[] | null): string | null {
  if (!openingHours?.length) return null
  const today = getTodayName()
  const entry = openingHours.find((h) => h.startsWith(today))
  if (!entry) return null
  const colonIdx = entry.indexOf(': ')
  return colonIdx >= 0 ? entry.slice(colonIdx + 2) : null
}

function isOpenToday(clinic: Clinic): boolean {
  if (clinic.is_24h) return true
  const hours = getTodayHours(clinic.opening_hours)
  if (hours === null) return false
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
          <p className="text-mist text-sm">
            找到 <span className="font-bold text-gold">{filtered.length}</span> 間
          </p>
          <PetFilter />
          <OpenFilter />
        </div>
        <DistrictFilter />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-snow">找不到符合的診所</p>
          <p className="text-sm mt-1 text-mist">試試其他關鍵字，或移除篩選條件</p>
          <Link
            href="/"
            className="inline-block mt-6 px-5 py-2 bg-gold text-ink rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
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
                className="bg-sand rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Name + rating + badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-base font-bold text-ink leading-snug">{clinic.name}</h2>
                    {clinic.rating != null && (
                      <span className="text-xs font-medium text-gold whitespace-nowrap shrink-0">
                        ⭐ {clinic.rating}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {clinic.is_24h && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral text-snow whitespace-nowrap">
                        24H急診
                      </span>
                    )}
                    {clinic.is_appointment && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold text-ink whitespace-nowrap">
                        需預約
                      </span>
                    )}
                  </div>
                </div>

                {/* District + address */}
                <p className="text-sm text-ink/60 mb-1.5">
                  📍 {clinic.district}
                  {clinic.address &&
                    clinic.address !== clinic.district &&
                    !clinic.address.startsWith(clinic.district)
                    ? `　${clinic.address}`
                    : ''}
                </p>

                {/* Today's opening hours */}
                {todayHours && (
                  <p className={`text-xs mb-3 font-medium ${isClosed ? 'text-coral' : 'text-brand'}`}>
                    🕐 今日{isClosed ? ' 休息' : ` ${todayHours}`}
                  </p>
                )}

                {/* Specialty tags */}
                {clinic.specialty_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {clinic.specialty_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Phone + detail link */}
                <div className="flex items-center justify-between mt-1 pt-3 border-t border-ink/10">
                  {clinic.phone ? (
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-sm text-ink font-medium hover:text-brand transition-colors"
                    >
                      📞 {clinic.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-ink/30">電話未提供</span>
                  )}
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="text-sm text-ink/50 hover:text-brand font-medium transition-colors"
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
