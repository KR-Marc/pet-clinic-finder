'use client'

import Link from 'next/link'
import { AlertTriangle, CheckSquare, Clock, MapPin, Phone, Search, Square, Star, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import PetFilter from './PetFilter'
import DistrictFilter from './DistrictFilter'
import OpenFilter from './OpenFilter'
import SymptomExplainer from './SymptomExplainer'
import CompareBar from './CompareBar'
import DistanceBadge from './DistanceBadge'
import { supabase } from '@/lib/supabase'

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
  lat: number | null
  lng: number | null
  review_count: number | null
  updated_at: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const SPECIALTY_TAGS = ['外科', '心臟科', '腫瘤科', '泌尿科', '腎臟科', '牙科', '中獸醫', '神經外科', '復健', '皮膚科', '骨科', '眼科']

// ── Time helpers ──────────────────────────────────────────────────────────────

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

// ── Pagination helper ─────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (current > 3) out.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i)
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}

// ── Flat select style (shared) ────────────────────────────────────────────────

const selectClass =
  'appearance-none bg-ink border border-mist/30 text-mist rounded-lg px-3 py-1.5 pr-7 text-xs focus:outline-none focus:border-gold cursor-pointer'

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClinicList({ clinics, queryTerms = [] }: { clinics: Clinic[]; queryTerms?: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const openOnly = searchParams.get('open') === 'true'
  const district = searchParams.get('district') ?? ''
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const [sort, setSort] = useState<SortOption>('rating')
  const [activeTag, setActiveTag] = useState<string>('')
  const [compareList, setCompareList] = useState<Clinic[]>([])
  const [aiFallbackClinics, setAiFallbackClinics] = useState<Clinic[]>([])
  const [logged, setLogged] = useState(false)

  const logSearch = (count: number, isAi: boolean) => {
    if (logged || queryTerms.length === 0) return
    setLogged(true)
    fetch('/api/log-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: queryTerms.join(','), clinic_count: count, is_ai_fallback: isAi }),
    }).catch(() => {})
  }

  const filtered = useMemo(() => {
    let result = openOnly ? clinics.filter(isOpenToday) : clinics
    if (activeTag) result = result.filter((c) => c.specialty_tags.includes(activeTag))
    return result
  }, [clinics, openOnly, activeTag])

  const sorted = useMemo(() => sortClinics(filtered, sort), [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  if (sorted.length > 0 && page === 1 && !logged && queryTerms.length > 0) {
    setTimeout(() => logSearch(sorted.length, false), 500)
  }

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`/search?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    // Reset to page 1
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const handleTagFilter = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? '' : tag))
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const toggleCompare = (clinic: Clinic) => {
    setCompareList((prev) => {
      if (prev.some((c) => c.id === clinic.id)) return prev.filter((c) => c.id !== clinic.id)
      if (prev.length >= 3) return prev
      return [...prev, clinic]
    })
  }

  // The sort select rendered twice (different positions on mobile vs desktop)
  const SortSelect = (
    <div className="relative">
      <select
        value={sort}
        onChange={(e) => handleSortChange(e.target.value as SortOption)}
        className={selectClass}
      >
        <option value="default">預設排序</option>
        <option value="rating">評分最高</option>
        <option value="open_first">今日營業優先</option>
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-mist/60 text-xs">▾</span>
    </div>
  )

  return (
    <>
      <SymptomExplainer
        symptoms={queryTerms}
        onSpecialties={async (aiTags) => {
          if (sorted.length > 0) return // 已有結果不需要補查
          // client-side 用 AI specialties 補查診所
          const { data } = await supabase
            .from('clinics')
            .select('*')
            .overlaps('specialty_tags', aiTags)
          if (data && data.length > 0) {
            setAiFallbackClinics(data as Clinic[])
            logSearch(Math.min(data.length, 10), true)
          }
        }}
      />
      {/* ── Sticky filter bar ────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 mb-4"
        style={{
          background: 'rgba(0,30,29,0.5)',
          border: '1px solid rgba(171,209,198,0.12)',
        }}
      >
        {/* Row 1: count */}
        <div className="flex items-center mb-3">
          {(() => {
            const isAi = aiFallbackClinics.length > 0 && sorted.length === 0
            const displayCount = isAi ? Math.min(aiFallbackClinics.length, 10) : sorted.length
            return (
              <p className="text-sm font-semibold" style={{ color: '#f9bc60' }}>
                {isAi ? 'AI 建議' : '找到'} <span className="text-base font-bold">{displayCount}</span> 間相關診所
              </p>
            )
          })()}
        </div>
        {/* Row 2: pet + open */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <PetFilter />
          <OpenFilter />
        </div>
        {/* Row 3: district + sort 緊靠在一起靠左 */}
        <div className="flex items-center gap-2 mb-3">
          <DistrictFilter />
          {SortSelect}
        </div>
        {/* Row 3: specialty tag pills (scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ borderTop: '1px solid rgba(171,209,198,0.1)', paddingTop: '10px' }}>
          {SPECIALTY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
              style={
                activeTag === tag
                  ? { background: '#f9bc60', color: '#001e1d' }
                  : { background: 'rgba(171,209,198,0.1)', color: '#abd1c6', border: '1px solid rgba(171,209,198,0.15)' }
              }
            >
              {tag}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => handleTagFilter('')}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
              style={{ background: 'rgba(225,97,98,0.15)', color: '#e16162', border: '1px solid rgba(225,97,98,0.2)' }}
            >
              ✕ 清除
            </button>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="pt-4">
        {sorted.length === 0 ? (
          /* Empty state */
          aiFallbackClinics.length > 0 ? (
            <div>
              <p className="text-xs text-mist/50 mb-4 text-center">以下為 AI 建議的相關診所</p>
              <div className="flex flex-col gap-3">
                {aiFallbackClinics.slice(0, 10).map((clinic) => {
                  const todayHours = getTodayHours(clinic.opening_hours)
                  const isClosed = todayHours === '休息'
                  const hasHours = todayHours !== null
                  return (
                    <div key={clinic.id} className="bg-sand rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h2 className="text-lg font-semibold leading-snug flex items-center gap-1.5" style={{ color: '#001e1d' }}>
                          <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: isOpenToday(clinic) ? '#4ade80' : '#e16162' }} />
                          {clinic.name}
                        </h2>
                        {clinic.rating != null && (
                          <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#f9bc60' }}><Star size={13} className="inline mr-0.5 fill-gold text-gold" />{clinic.rating}</span>
                        )}
                      </div>
                      <p className="text-sm mb-1.5" style={{ color: 'rgba(0,30,29,0.5)' }}><MapPin size={13} className="inline mr-0.5" />{clinic.district} {clinic.address}</p>
                      <p className="text-xs font-medium mb-3" style={{ color: !hasHours ? 'rgba(0,30,29,0.3)' : isClosed ? '#e16162' : '#16a34a' }}>
                        {!hasHours ? <><Clock size={13} className="inline mr-0.5" />營業時間未提供</> : isClosed ? <><Clock size={13} className="inline mr-0.5" />今日 休息</> : <><Clock size={13} className="inline mr-0.5" />{`今日 ${todayHours}`}</>}
                      </p>
                      {clinic.specialty_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {clinic.specialty_tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full text-sm font-medium bg-brand text-snow">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid rgba(0,30,29,0.1)', marginBottom: '0.75rem' }} />
                      <div className="flex items-center justify-between">
                        <a href={`tel:${clinic.phone}`} className="text-sm font-medium" style={{ color: 'rgba(0,30,29,0.65)' }}>📞 {clinic.phone}</a>
                        <a href={`/clinic/${clinic.id}`} className="text-sm font-semibold hover:underline" style={{ color: '#f9bc60' }}>查看詳情 →</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-snow">找不到符合的診所</p>
            <p className="text-sm mt-2 text-mist">試試其他關鍵字，或移除篩選條件</p>
            {district && (
              <p className="text-sm mt-1 text-gold">試試移除「{district}」行政區篩選</p>
            )}
            <Link
              href="/"
              className="inline-block mt-6 px-5 py-2 bg-gold text-ink rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              重新搜尋
            </Link>
            <div className="mt-8">
              <p className="text-xs text-mist/50 mb-3">你可能想搜尋</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['嘔吐','掉毛','抽搐','血尿','眼睛分泌物','口臭','食慾不振','咳嗽','跛行','皮膚搔癢'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-ink text-mist hover:text-gold border border-mist/20 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          )
        ) : (
          <>
            {/* Clinic cards */}
            <div className="flex flex-col gap-3">
              {paginated.map((clinic) => {
                const todayHours = getTodayHours(clinic.opening_hours)
                const isClosed = todayHours === '休息'
                const hasHours = todayHours !== null

                const visibleTags = clinic.specialty_tags.slice(0, 4)
                const extraCount = Math.max(0, clinic.specialty_tags.length - 4)

                return (
                  <div
                    key={clinic.id}
                    className="bg-sand rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* ROW 1 — Name + rating + badges */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h2 className="text-lg font-semibold leading-snug flex items-center gap-1.5" style={{ color: '#001e1d' }}>
                        <span
                          className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                          style={{ background: isOpenToday(clinic) ? '#4ade80' : '#e16162' }}
                        />
                        {clinic.name}
                      </h2>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {clinic.rating != null && (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#f9bc60' }}>
                              <Star size={13} className="inline mr-0.5 fill-gold text-gold" />{clinic.rating}
                            </span>
                            {clinic.review_count != null && (
                              <span className="text-xs whitespace-nowrap" style={{ color: 'rgba(249,188,96,0.5)' }}>
                                {clinic.review_count.toLocaleString()} 則
                              </span>
                            )}
                          </div>
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
                      <MapPin size={13} className="inline mr-0.5" />{clinic.district}
                      {clinic.address &&
                        clinic.address !== clinic.district &&
                        !clinic.address.startsWith(clinic.district)
                        ? `　${clinic.address}`
                        : ''}
                    </p>

                    <div className="mb-1.5">
                      <DistanceBadge lat={clinic.lat ?? null} lng={clinic.lng ?? null} />
                    </div>

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
                        ? <><Clock size={13} className="inline mr-0.5" />營業時間未提供</>
                        : isClosed
                          ? <><Clock size={13} className="inline mr-0.5" />今日 休息</>
                          : <><Clock size={13} className="inline mr-0.5" />{`今日 ${todayHours}`}</>}
                    </p>

                    {/* ROW 4 — Specialty tags (max 4 + overflow) */}
                    {clinic.specialty_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {visibleTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-brand text-snow"
                          >
                            {tag}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ background: 'rgba(0,30,29,0.08)', color: 'rgba(0,30,29,0.45)' }}
                          >
                            +{extraCount} 更多
                          </span>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(0,30,29,0.1)', marginBottom: '0.75rem' }} />

                    {/* ROW 5 — Phone + compare checkbox + detail link */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCompare(clinic)}
                        className="text-xs font-medium transition-all shrink-0 mr-2"
                        style={
                          compareList.some((c) => c.id === clinic.id)
                            ? { color: '#f9bc60' }
                            : { color: 'rgba(171,209,198,0.4)' }
                        }
                      >
                        {compareList.some((c) => c.id === clinic.id) ? <><CheckSquare size={13} className="inline mr-1" />比較中</> : <><Square size={13} className="inline mr-1" />加入比較</>}
                      </button>
                      {clinic.phone ? (
                        <a
                          href={`tel:${clinic.phone}`}
                          className="text-sm font-medium transition-opacity hover:opacity-70"
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

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                {/* Page buttons */}
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-mist hover:text-gold"
                  >
                    «
                  </button>

                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-mist/40">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className="min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={
                          p === page
                            ? { background: '#f9bc60', color: '#001e1d', fontWeight: 700 }
                            : { color: '#abd1c6' }
                        }
                      >
                        {p}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-mist hover:text-gold"
                  >
                    »
                  </button>
                </div>

                {/* Page info */}
                <p className="text-xs text-mist/50">
                  第 {page} 頁，共 {totalPages} 頁（{filtered.length} 筆結果）
                </p>
              </div>
            )}
          </>
        )}
      </div>
      {/* 資料來源說明 */}
      <div className="mt-6 rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(249,188,96,0.06)', border: '1px solid rgba(249,188,96,0.15)' }}>
        <p className="font-semibold mb-1" style={{ color: 'rgba(249,188,96,0.8)' }}>⚠️ 資料說明</p>
        <p style={{ color: 'rgba(171,209,198,0.55)' }}>診所資訊來源為 Google Maps，電話、地址、營業時間可能與實際有所落差。就診前建議先來電確認，或參考診所官網。</p>
      </div>
      {/* 行政區快速入口 */}
      <div className="mt-4 mb-2">
        <p className="text-xs text-mist/40 mb-2">依行政區搜尋</p>
        <div className="flex flex-wrap gap-1.5">
          {['大安區','信義區','中山區','內湖區','士林區','文山區','松山區','中正區','萬華區','北投區','南港區','大同區'].map((d) => (
            <a key={d} href={`/district/${encodeURIComponent(d)}`}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors border"
              style={{ color: 'rgba(171,209,198,0.5)', borderColor: 'rgba(171,209,198,0.15)', background: 'rgba(0,30,29,0.3)' }}>
              {d}
            </a>
          ))}
        </div>
      </div>
      <CompareBar
        selected={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((c) => c.id !== id))}
        onClear={() => setCompareList([])}
      />
    </>
  )
}
