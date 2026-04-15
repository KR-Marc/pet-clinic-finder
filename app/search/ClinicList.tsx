'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
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

// ── Time helpers ──────────────────────────────────────────────────────────────

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getTodayName(): string {
  const tw = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return WEEKDAYS[tw.getDay()]
}

function getTodayHours(openingHours: string[] | null): string | null {
  if (!openingHours?.length) return null
  const today = getTodayName()
  const entry = openingHours.find((h) => h.startsWith(today))
  if (!entry) return null
  const idx = entry.indexOf(': ')
  return idx >= 0 ? entry.slice(idx + 2) : null
}

function isOpenToday(clinic: Clinic): boolean {
  if (clinic.is_24h) return true
  const hours = getTodayHours(clinic.opening_hours)
  return hours !== null && hours !== '休息'
}

// ── Sorting ───────────────────────────────────────────────────────────────────

type SortOption = 'default' | 'rating' | 'open_first'

function sortClinics(clinics: Clinic[], sort: SortOption): Clinic[] {
  if (sort === 'rating') {
    return [...clinics].sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0
      if (a.rating == null) return 1
      if (b.rating == null) return -1
      return b.rating - a.rating
    })
  }
  if (sort === 'open_first') {
    return [...clinics].sort((a, b) => {
      return (isOpenToday(a) ? 0 : 1) - (isOpenToday(b) ? 0 : 1)
    })
  }
  return clinics
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClinicList({ clinics }: { clinics: Clinic[] }) {
  const searchParams = useSearchParams()
  const openOnly = searchParams.get('open') === 'true'
  const [sort, setSort] = useState<SortOption>('rating')

  const filtered = useMemo(
    () => (openOnly ? clinics.filter(isOpenToday) : clinics),
    [clinics, openOnly],
  )

  const sorted = useMemo(
    () => sortClinics(filtered, sort),
    [filtered, sort],
  )

  return (
    <>
      {/* ── Filter bar — sticky below top nav ─────────────────────────────── */}
      <div
        className="sticky top-[44px] z-10 -mx-4 px-4 py-3 mb-5"
        style={{
          background: 'rgba(0,30,29,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(171,209,198,0.12)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: count + pet + open filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#f9bc60' }}>
              找到{' '}
              <span className="text-base font-bold">{filtered.length}</span>{' '}
              間診所
            </p>
            <PetFilter />
            <OpenFilter />
          </div>
          {/* Right: sort + district */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="border border-mist/40 rounded-lg px-2.5 py-1.5 text-xs bg-ink text-mist focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="default">預設排序</option>
              <option value="rating">評分最高</option>
              <option value="open_first">今日營業優先</option>
            </select>
            <DistrictFilter />
          </div>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
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
        /* ── Clinic cards ────────────────────────────────────────────────── */
        <div className="flex flex-col gap-4">
          {sorted.map((clinic) => {
            const todayHours = getTodayHours(clinic.opening_hours)
            const isClosed = todayHours === '休息'
            const hasHours = todayHours !== null

            const visibleTags = clinic.specialty_tags.slice(0, 4)
            const extraCount = Math.max(0, clinic.specialty_tags.length - 4)

            return (
              <div
                key={clinic.id}
                className="bg-sand rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* ROW 1 — Name + rating + badges */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h2
                    className="text-lg font-semibold leading-snug"
                    style={{ color: '#001e1d' }}
                  >
                    {clinic.name}
                  </h2>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {clinic.rating != null && (
                      <span
                        className="text-sm font-bold whitespace-nowrap"
                        style={{ color: '#f9bc60' }}
                      >
                        ⭐ {clinic.rating}
                      </span>
                    )}
                    {clinic.is_24h && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral text-snow whitespace-nowrap">
                        24H
                      </span>
                    )}
                    {clinic.is_appointment && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold text-ink whitespace-nowrap">
                        需預約
                      </span>
                    )}
                  </div>
                </div>

                {/* ROW 2 — Location */}
                <p className="text-sm mb-1.5" style={{ color: 'rgba(0,30,29,0.5)' }}>
                  📍 {clinic.district}
                  {clinic.address &&
                    clinic.address !== clinic.district &&
                    !clinic.address.startsWith(clinic.district)
                    ? `　${clinic.address}`
                    : ''}
                </p>

                {/* ROW 3 — Today's hours */}
                <p
                  className="text-xs font-medium mb-3"
                  style={{
                    color: !hasHours
                      ? 'rgba(0,30,29,0.3)'
                      : isClosed
                        ? '#e16162'
                        : '#16a34a',
                  }}
                >
                  {!hasHours
                    ? '🕐 營業時間未提供'
                    : isClosed
                      ? '🕐 今日 休息'
                      : `🕐 今日 ${todayHours}`}
                </p>

                {/* ROW 4 — Specialty tags (max 4 + overflow) */}
                {clinic.specialty_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {visibleTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                      >
                        {tag}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(0,30,29,0.08)', color: 'rgba(0,30,29,0.45)' }}
                      >
                        +{extraCount} 更多
                      </span>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(0,30,29,0.1)', marginBottom: '0.75rem' }} />

                {/* ROW 5 — Phone + detail link */}
                <div className="flex items-center justify-between">
                  {clinic.phone ? (
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-sm font-medium transition-colors hover:opacity-70"
                      style={{ color: 'rgba(0,30,29,0.65)' }}
                    >
                      📞 {clinic.phone}
                    </a>
                  ) : (
                    <span className="text-sm" style={{ color: 'rgba(0,30,29,0.3)' }}>
                      電話未提供
                    </span>
                  )}
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="text-sm font-semibold hover:underline underline-offset-2 transition-all"
                    style={{ color: '#f9bc60' }}
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
