'use client'
import Link from 'next/link'
import { Clock, MapPin, Star, Phone } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import DistrictFilter from './DistrictFilter'
import OpenFilter from './OpenFilter'
import SymptomExplainer from './SymptomExplainer'
import CompareBar from './CompareBar'
import DistanceBadge from './DistanceBadge'
import { supabase } from '@/lib/supabase'
import { Chip, Tag } from '@/app/components/clay'

export interface Clinic {
  id: string; name: string; district: string; address: string; phone: string
  specialty_tags: string[]; is_24h: boolean; is_appointment: boolean
  pet_types: string[]; rating: number | null
  opening_hours: string[] | null
  lat: number | null; lng: number | null
  review_count: number | null; updated_at: string | null
}

const PAGE_SIZE = 20
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const SPECIALTY_TAGS = ['外科','心臟科','腫瘤科','泌尿科','腎臟科','牙科','中獸醫','神經外科','復健','皮膚科','骨科','眼科']

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
// 0 = 今日營業（含 24H）, 1 = 無時間資料（不確定）, 2 = 今日休息
function openScoreClient(clinic: Clinic): 0 | 1 | 2 {
  if (clinic.is_24h) return 0
  const hours = getTodayHours(clinic.opening_hours)
  if (hours === null) return 1
  return hours === '休息' ? 2 : 0
}

type SortOption = 'default' | 'rating' | 'open_first' | 'distance'

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function sortClinics(clinics: Clinic[], sort: SortOption, userLat?: number, userLng?: number): Clinic[] {
  if (sort === 'rating') {
    return [...clinics].sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0
      if (a.rating == null) return 1
      if (b.rating == null) return -1
      return b.rating - a.rating
    })
  }
  if (sort === 'open_first') {
    return [...clinics].sort((a, b) => openScoreClient(a) - openScoreClient(b))
  }
  if (sort === 'distance' && userLat != null && userLng != null) {
    return [...clinics].sort((a, b) => {
      const dA = (a.lat != null && a.lng != null) ? getDistanceKm(userLat, userLng, a.lat, a.lng) : 999
      const dB = (b.lat != null && b.lng != null) ? getDistanceKm(userLat, userLng, b.lat, b.lng) : 999
      return dA - dB
    })
  }
  // Default: open > unknown > closed
  return [...clinics].sort((a, b) => openScoreClient(a) - openScoreClient(b))
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (current > 3) out.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i)
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}

const selectStyle: React.CSSProperties = {
  appearance: 'none',
  padding: '7px 28px 7px 14px',
  borderRadius: 8, fontSize: 13,
  background: 'var(--color-clay-surface)',
  border: '1px solid var(--color-clay-border)',
  color: 'var(--color-clay-text)',
  fontFamily: 'inherit', cursor: 'pointer',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a8f7f' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
}

export default function ClinicList({
  clinics, queryTerms = [], source = '',
}: { clinics: Clinic[]; queryTerms?: string[]; source?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openOnly = searchParams.get('open') === 'true' || (source === 'nearby' && searchParams.get('open') !== 'false')
  const district = searchParams.get('district') ?? ''
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [sort, setSort] = useState<SortOption>(source === 'nearby' ? 'open_first' : 'rating')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [compareList, setCompareList] = useState<Clinic[]>([])
  const [aiFallbackClinics, setAiFallbackClinics] = useState<Clinic[]>([])
  const [logged, setLogged] = useState(false)
  const [userLat, setUserLat] = useState<number | undefined>(undefined)
  const [userLng, setUserLng] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
        () => {}
      )
    }
  }, [])

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
    if (activeTags.length > 0) result = result.filter((c) => activeTags.some(t => c.specialty_tags.includes(t)))
    return result
  }, [clinics, openOnly, activeTags])

  const sorted = useMemo(() => sortClinics(filtered, sort, userLat, userLng),
    [filtered, sort, userLat, userLng])
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
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const handleTagFilter = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleCompare = (clinic: Clinic) => {
    setCompareList((prev) => {
      if (prev.some((c) => c.id === clinic.id)) return prev.filter((c) => c.id !== clinic.id)
      if (prev.length >= 3) return prev
      return [...prev, clinic]
    })
  }

  const renderClinicCard = (clinic: Clinic) => {
    const todayHours = getTodayHours(clinic.opening_hours)
    const isClosed = todayHours === '休息'
    const hasHours = todayHours !== null
    const visibleTags = clinic.specialty_tags.slice(0, 4)
    const extraCount = Math.max(0, clinic.specialty_tags.length - 4)
    const isInCompare = compareList.some((c) => c.id === clinic.id)

    return (
      <div key={clinic.id} style={{
        background: 'var(--color-clay-surface)',
        border: '1px solid var(--color-clay-border)',
        borderRadius: 14, padding: 18,
        boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
      }}>
        {/* Row 1: name + rating pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'start', marginBottom: 6, gap: 8 }}>
          <Link href={`/clinic/${clinic.id}`} style={{
            fontSize: 16, fontWeight: 700,
            color: 'var(--color-clay-text)',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isOpenToday(clinic)
                ? 'var(--color-clay-sage)'
                : 'var(--color-clay-danger)',
              flexShrink: 0,
            }} />
            {clinic.name}
          </Link>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {clinic.rating != null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 11, fontWeight: 700,
                background: 'var(--color-clay-sage-soft)',
                color: 'var(--color-clay-sage)',
                padding: '3px 8px', borderRadius: 6,
              }}>
                <Star size={11} fill="currentColor" /> {clinic.rating}
              </div>
            )}
            {clinic.is_24h && (
              <div style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: 'var(--color-clay-danger-soft)',
                color: 'var(--color-clay-danger)',
              }}>24H</div>
            )}
            {clinic.is_appointment && (
              <div style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: 'var(--color-clay-primary-soft)',
                color: 'var(--color-clay-primary)',
              }}>需預約</div>
            )}
          </div>
        </div>

        {/* Review count */}
        {clinic.review_count != null && clinic.rating != null && (
          <div style={{ fontSize: 12, color: 'var(--color-clay-text-mute)', marginBottom: 6 }}>
            {clinic.review_count.toLocaleString()} 則評論
          </div>
        )}

        {/* Address */}
        <div style={{
          fontSize: 13, color: 'var(--color-clay-text-soft)', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <MapPin size={12} />
          {clinic.district}
          {clinic.address && clinic.address !== clinic.district && !clinic.address.startsWith(clinic.district)
            ? `・${clinic.address}` : ''}
        </div>

        <div style={{ marginBottom: 6 }}>
          <DistanceBadge lat={clinic.lat ?? null} lng={clinic.lng ?? null} />
        </div>

        {/* Hours */}
        <div style={{
          fontSize: 12, fontWeight: 500, marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          color: !hasHours
            ? 'var(--color-clay-text-mute)'
            : isClosed
              ? 'var(--color-clay-danger)'
              : 'var(--color-clay-sage)',
        }}>
          <Clock size={12} />
          {!hasHours ? '營業時間未提供' : `今日 ${todayHours}`}
        </div>

        {/* Tags */}
        {clinic.specialty_tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {visibleTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            {extraCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '3px 9px', borderRadius: 6,
                background: 'var(--color-clay-chip-bg)',
                color: 'var(--color-clay-text-mute)',
              }}>+{extraCount} 更多</span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderTop: '1px dashed var(--color-clay-border)',
          paddingTop: 12,
        }}>
          <button onClick={() => toggleCompare(clinic)} style={{
            padding: '5px 10px', borderRadius: 8,
            border: `1px solid ${isInCompare ? 'var(--color-clay-primary)' : 'var(--color-clay-border)'}`,
            background: isInCompare ? 'var(--color-clay-primary-soft)' : 'var(--color-clay-surface)',
            color: isInCompare ? 'var(--color-clay-primary)' : 'var(--color-clay-text-mute)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            {isInCompare ? '✓ 比較中' : '+ 比較'}
          </button>
          {clinic.phone && (
            <a href={`tel:${clinic.phone}`} style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid var(--color-clay-border)',
              background: 'var(--color-clay-surface)',
              color: 'var(--color-clay-text-soft)',
              fontSize: 11, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Phone size={11} />{clinic.phone}
            </a>
          )}
          <div style={{ flex: 1 }} />
          <Link href={`/clinic/${clinic.id}`} style={{
            fontSize: 12, fontWeight: 700,
            color: 'var(--color-clay-primary)',
            textDecoration: 'none',
          }}>查看詳情 →</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SymptomExplainer
        symptoms={queryTerms}
        onSpecialties={async (aiTags) => {
          if (sorted.length > 0) return
          const { data } = await supabase.from('clinics').select('*').overlaps('specialty_tags', aiTags)
          if (data && data.length > 0) {
            setAiFallbackClinics(data as Clinic[])
            logSearch(Math.min(data.length, 10), true)
          }
        }}
      />

      {/* Filter card */}
      <div style={{
        background: 'var(--color-clay-surface)',
        border: '1px solid var(--color-clay-border)',
        borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        {/* Count */}
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--color-clay-text)', marginBottom: 14,
        }}>
          {(() => {
            const isAi = aiFallbackClinics.length > 0 && sorted.length === 0
            const displayCount = isAi ? Math.min(aiFallbackClinics.length, 10) : sorted.length
            return (<>
              {isAi ? 'AI 建議 ' : '找到 '}
              <span style={{ color: 'var(--color-clay-primary)' }}>{displayCount} 間</span>
              {' 相關診所'}
            </>)
          })()}
        </div>

        {/* Filter row 2: district + sort + open */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <DistrictFilter />
          <div style={{ position: 'relative' }}>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              style={selectStyle}
            >
              <option value="default">預設排序</option>
              <option value="rating">評分最高</option>
              <option value="open_first">今日營業優先</option>
              <option value="distance">距離最近</option>
            </select>
          </div>
          <OpenFilter />
        </div>

        {/* Specialty tag chips */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: '1px solid var(--color-clay-border)',
        }}>
          {SPECIALTY_TAGS.map((tag) => (
            <Chip key={tag} active={activeTags.includes(tag)} onClick={() => handleTagFilter(tag)}>
              {tag}
            </Chip>
          ))}
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} style={{
              padding: '7px 13px', borderRadius: 999,
              fontSize: 12.5, fontWeight: 500,
              background: 'var(--color-clay-danger-soft)',
              color: 'var(--color-clay-danger)',
              border: '1px solid var(--color-clay-danger-soft)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✕ 清除</button>
          )}
        </div>
      </div>

      {/* Results */}
      {sorted.length === 0 ? (
        aiFallbackClinics.length > 0 ? (
          <>
            <p style={{
              fontSize: 12, color: 'var(--color-clay-text-mute)',
              textAlign: 'center', marginBottom: 14,
            }}>以下為 AI 建議的相關診所</p>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {aiFallbackClinics.slice(0, 10).map(renderClinicCard)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-clay-text)', margin: 0 }}>
              找不到符合的診所
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-clay-text-soft)', marginTop: 6 }}>
              試試其他關鍵字，或移除篩選條件
            </p>
            {district && (
              <p style={{ fontSize: 13, color: 'var(--color-clay-primary)', marginTop: 4 }}>
                試試移除「{district}」行政區篩選
              </p>
            )}
            <Link href="/" style={{
              display: 'inline-block', marginTop: 20,
              padding: '10px 22px', borderRadius: 10,
              background: 'var(--color-clay-primary)', color: '#fff',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>重新搜尋</Link>
            <div style={{ marginTop: 28 }}>
              <p style={{
                fontSize: 12, color: 'var(--color-clay-text-mute)', marginBottom: 10,
              }}>你可能想搜尋</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7 }}>
                {['嘔吐','掉毛','抽搐','血尿','眼睛分泌物','口臭','食慾不振','咳嗽','跛行','皮膚搔癢'].map((tag) => (
                  <Chip key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Chip>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {paginated.map(renderClinicCard)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10, marginTop: 28 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  style={{
                    minWidth: 34, height: 34, borderRadius: 8,
                    border: '1px solid var(--color-clay-border)',
                    background: 'var(--color-clay-surface)',
                    color: 'var(--color-clay-text-soft)',
                    fontSize: 13, fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >«</button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} style={{
                      minWidth: 34, height: 34,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-clay-text-mute)',
                    }}>…</span>
                  ) : (
                    <button key={p} onClick={() => handlePageChange(p)} style={{
                      minWidth: 34, height: 34, borderRadius: 8,
                      border: '1px solid var(--color-clay-border)',
                      background: p === page
                        ? 'var(--color-clay-primary)'
                        : 'var(--color-clay-surface)',
                      color: p === page ? '#fff' : 'var(--color-clay-text-soft)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>{p}</button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  style={{
                    minWidth: 34, height: 34, borderRadius: 8,
                    border: '1px solid var(--color-clay-border)',
                    background: 'var(--color-clay-surface)',
                    color: 'var(--color-clay-text-soft)',
                    fontSize: 13, fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >»</button>
              </div>
              <p style={{
                fontSize: 12, color: 'var(--color-clay-text-mute)', margin: 0,
              }}>
                第 {page} 頁，共 {totalPages} 頁（{filtered.length} 筆結果）
              </p>
            </div>
          )}
        </>
      )}

      {/* Data disclaimer */}
      <div style={{
        marginTop: 24, padding: '14px 18px', borderRadius: 10,
        background: 'var(--color-clay-primary-soft)',
        borderLeft: '4px solid var(--color-clay-primary)',
        fontSize: 13, color: '#8a4621',
      }}>
        <p style={{ fontWeight: 700, margin: '0 0 4px' }}>⚠️ 資料說明</p>
        <p style={{ margin: 0 }}>
          診所資訊來源為 Google Maps，電話、地址、營業時間可能與實際有所落差。
          就診前建議先來電確認，或參考診所官網。
        </p>
      </div>

      {/* District quick links */}
      <div style={{ marginTop: 18, marginBottom: 10 }}>
        <p style={{
          fontSize: 11, color: 'var(--color-clay-text-mute)',
          marginBottom: 8, fontWeight: 700, letterSpacing: 1,
        }}>依行政區搜尋</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['大安區','信義區','中山區','內湖區','士林區','文山區','松山區','中正區','萬華區','北投區','南港區','大同區'].map((d) => (
            <Chip key={d} href={`/district/${encodeURIComponent(d)}`}>{d}</Chip>
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
