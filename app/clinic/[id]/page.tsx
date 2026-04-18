import type { Metadata } from 'next'
import {
  AlertTriangle, ClipboardList,
  Globe, MapPin, Phone, Star, Map as MapIcon,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UberButton from './UberButton'
import ShareButton from './ShareButton'
import ReportButton from './ReportButton'
import FavoriteButton from './FavoriteButton'
import RecentlyViewedTracker from './RecentlyViewedTracker'
import { ClayNav, ClayFooter, Tag } from '@/app/components/clay'
import MobileTopBar from '@/app/components/clay/MobileTopBar'

interface Clinic {
  id: string; name: string; district: string; address: string
  phone: string; website: string | null; description: string | null
  specialty_tags: string[]; is_24h: boolean; is_appointment: boolean
  pet_types: string[]; rating: number | null
  opening_hours: string[] | null; review_count: number | null
  updated_at: string | null
}

interface SimilarClinic {
  id: string; name: string; district: string
  rating: number | null; specialty_tags: string[]
}

const WEEKDAY_NAMES = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
const WEEKDAYS_TABLE = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
const DAY_SHORT: Record<string, string> = {
  '星期一':'週一','星期二':'週二','星期三':'週三','星期四':'週四',
  '星期五':'週五','星期六':'週六','星期日':'週日',
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

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data } = await supabase
    .from('clinics')
    .select('name, district, address, specialty_tags, description')
    .eq('id', id).single()
  if (!data) return { title: '診所未找到 | 台北寵物專科診所搜尋' }
  const tags = data.specialty_tags?.length > 0 ? data.specialty_tags.join('、') : '動物醫院'
  const description = data.description ||
    `${data.name}位於台北市${data.district}，提供${tags}等專科服務。查看營業時間、地址與聯絡方式。`
  return {
    title: `${data.name} | 台北寵物專科診所`,
    description,
    openGraph: {
      title: `${data.name} | 台北寵物專科診所`,
      description,
      url: `https://pet-clinic-finder.vercel.app/clinic/${id}`,
      siteName: '台北寵物專科診所搜尋',
      locale: 'zh_TW', type: 'website',
    },
  }
}

const sectionStyle = {
  background: 'var(--color-clay-surface)',
  border: '1px solid var(--color-clay-border)',
  borderRadius: 14, padding: 22,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'var(--color-clay-text-mute)',
  paddingBottom: 12, marginBottom: 14, marginTop: 0,
  borderBottom: '1px solid var(--color-clay-border)',
}

function InfoRow({ label, value, link, href }: {
  label: string; value: string; link?: boolean; href?: string
}) {
  const content = (
    <div style={{
      display: 'flex', padding: '10px 0', fontSize: 13,
      borderBottom: '1px dashed var(--color-clay-border)',
      gap: 10,
    }}>
      <div style={{
        width: 48, flexShrink: 0,
        color: 'var(--color-clay-text-mute)',
        fontWeight: 600,
      }}>{label}</div>
      <div style={{
        color: link ? 'var(--color-clay-primary)' : 'var(--color-clay-text)',
        flex: 1, wordBreak: 'break-all',
      }}>{value}</div>
    </div>
  )
  if (href) {
    return <a href={href} target={link ? '_blank' : undefined} rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}>{content}</a>
  }
  return content
}

export default async function ClinicPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('clinics').select('*').eq('id', id).single()
  if (error || !data) notFound()
  const clinic = data as Clinic

  let simQuery = supabase
    .from('clinics')
    .select('id, name, district, rating, specialty_tags')
    .eq('district', clinic.district)
    .neq('id', id).limit(3)
  if (clinic.specialty_tags.length > 0) {
    simQuery = simQuery.overlaps('specialty_tags', clinic.specialty_tags)
  }
  const { data: similar } = await simQuery

  const todayName = getTaiwanWeekday()
  const hoursMap = clinic.opening_hours ? parseHoursMap(clinic.opening_hours) : {}
  const todayHours = hoursMap[todayName] ?? null
  const isOpenToday = todayHours !== null && todayHours !== '休息'

  const mapQuery = encodeURIComponent(`${clinic.name} ${clinic.address} 台北`)
  const showReviewWarning = (clinic.review_count ?? 0) > 2000 && (clinic.rating ?? 0) >= 4.0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      <RecentlyViewedTracker
        id={clinic.id} name={clinic.name} district={clinic.district}
        rating={clinic.rating} specialty_tags={clinic.specialty_tags}
      />
      <div className="hide-on-mobile">
        <ClayNav />
      </div>
      <MobileTopBar title="診所詳情" backHref="/search" />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 48px' }}>
        {/* Back link (desktop only — mobile uses MobileTopBar back button) */}
        <Link href="/search" className="hide-on-mobile" style={{
          fontSize: 12, color: 'var(--color-clay-text-mute)',
          marginBottom: 18, display: 'inline-block',
          textDecoration: 'none',
        }}>← 回診所列表</Link>

        {/* Hero card */}
        <div className="h5-hero-card" style={{
          background: 'var(--color-clay-surface)',
          border: '1px solid var(--color-clay-border)',
          borderRadius: 16, padding: 28, marginBottom: 18,
          boxShadow: '0 1px 3px rgb(79 56 28 / 0.06)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'start', marginBottom: 10, gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 28, fontWeight: 800,
                color: 'var(--color-clay-text)',
                marginBottom: 8, marginTop: 0, lineHeight: 1.2,
              }}>{clinic.name}</h1>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                flexWrap: 'wrap', fontSize: 13,
                color: 'var(--color-clay-text-soft)',
              }}>
                <span>{clinic.district}</span>
                {clinic.rating != null && (
                  <>
                    <span style={{ color: 'var(--color-clay-text-mute)' }}>·</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 12, fontWeight: 700,
                      background: 'var(--color-clay-sage-soft)',
                      color: 'var(--color-clay-sage)',
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      <Star size={11} fill="currentColor" /> {clinic.rating}
                    </span>
                    {clinic.review_count != null && (
                      <span style={{ color: 'var(--color-clay-text-mute)' }}>
                        {clinic.review_count.toLocaleString()} 則 Google 評論
                      </span>
                    )}
                  </>
                )}
                {clinic.is_24h && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: 'var(--color-clay-danger-soft)',
                    color: 'var(--color-clay-danger)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>24H急診</span>
                )}
                {clinic.is_appointment && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: 'var(--color-clay-primary-soft)',
                    color: 'var(--color-clay-primary)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>需預約</span>
                )}
                {todayHours !== null && (
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: isOpenToday
                      ? 'var(--color-clay-sage)'
                      : 'var(--color-clay-danger)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'currentColor',
                    }} />
                    {isOpenToday ? '今日營業中' : '今日休息'}
                  </span>
                )}
              </div>
            </div>
            <FavoriteButton clinic={{
              id: clinic.id, name: clinic.name, district: clinic.district,
              rating: clinic.rating, specialty_tags: clinic.specialty_tags,
            }} />
          </div>

          {/* Specialty tags */}
          {clinic.specialty_tags.length > 0 && (
            <div style={{
              display: 'flex', gap: 5, marginTop: 14, marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              {clinic.specialty_tags.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}
                  style={{ textDecoration: 'none' }}>
                  <Tag>{t}</Tag>
                </Link>
              ))}
            </div>
          )}

          {/* Review warning */}
          {showReviewWarning && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: 'var(--color-clay-primary-soft)',
              color: '#8a4621',
              border: '1px solid var(--color-clay-primary-soft)',
              fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} />
              <span>此診所評論數量較多，建議參考多方資訊後再決定就診</span>
            </div>
          )}

          {/* CTA buttons row */}
          <div className="h5-cta-3col" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={`tel:${clinic.phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '11px 20px', borderRadius: 10,
              background: 'var(--color-clay-primary)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', flex: '1 1 auto',
              justifyContent: 'center', minWidth: 140,
            }}>
              <Phone size={16} /><span className="h5-cta-phone">立即撥打 {clinic.phone}</span>
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 18px', borderRadius: 10,
                background: 'var(--color-clay-surface)',
                color: 'var(--color-clay-text)',
                border: '1px solid var(--color-clay-border)',
                fontSize: 14, fontWeight: 600,
                textDecoration: 'none', flex: '0 1 auto',
                justifyContent: 'center', minWidth: 130,
              }}
            >
              <MapIcon size={16} />導航前往
            </a>
            {clinic.website && (
              <a
                href={clinic.website}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '11px 18px', borderRadius: 10,
                  background: 'var(--color-clay-surface)',
                  color: 'var(--color-clay-text)',
                  border: '1px solid var(--color-clay-border)',
                  fontSize: 14, fontWeight: 600,
                  textDecoration: 'none', flex: '0 1 auto',
                  justifyContent: 'center', minWidth: 130,
                }}
              >
                <Globe size={16} />官方網站
              </a>
            )}
            <ShareButton name={clinic.name} />
          </div>
        </div>

        {/* Two-column main content */}
        <div className="h5-grid-1col" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 18,
        }}>
          {/* Left column */}
          <div className="h5-detail-left" style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            {/* Info section */}
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>診所資訊</h2>
              <InfoRow label="地址" value={`${clinic.district} · ${clinic.address}`} />
              {clinic.phone && <InfoRow label="電話" value={clinic.phone} />}
              {clinic.website && (
                <InfoRow label="網站" value={clinic.website} link href={clinic.website} />
              )}
              {clinic.specialty_tags.length > 0 && (
                <InfoRow label="專科" value={clinic.specialty_tags.join('、')} />
              )}
            </section>

            {/* Hours section */}
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>營業時間</h2>
              {Object.keys(hoursMap).length > 0 ? (
                WEEKDAYS_TABLE.map((day, i) => {
                  const hrs = hoursMap[day]
                  if (!hrs) return null
                  const isToday = day === todayName
                  const isClosed = hrs === '休息'
                  return (
                    <div key={day} style={{
                      display: 'flex', padding: '9px 0', fontSize: 13,
                      borderBottom: i < WEEKDAYS_TABLE.length - 1
                        ? '1px dashed var(--color-clay-border)'
                        : 'none',
                      background: isToday ? 'var(--color-clay-primary-soft)' : 'transparent',
                      borderRadius: isToday ? 6 : 0,
                      paddingLeft: isToday ? 10 : 0,
                      paddingRight: isToday ? 10 : 0,
                    }}>
                      <div style={{
                        width: 56, color: isToday
                          ? 'var(--color-clay-primary)'
                          : 'var(--color-clay-text-mute)',
                        fontWeight: isToday ? 700 : 600,
                      }}>{DAY_SHORT[day]}</div>
                      <div style={{
                        color: isClosed
                          ? 'var(--color-clay-danger)'
                          : isToday
                            ? 'var(--color-clay-text)'
                            : 'var(--color-clay-text-soft)',
                        fontWeight: isToday ? 700 : 400,
                        flex: 1,
                      }}>{hrs}</div>
                    </div>
                  )
                })
              ) : (
                <p style={{
                  fontSize: 13, color: 'var(--color-clay-text-mute)', margin: 0,
                }}>營業時間未收錄，建議來電確認</p>
              )}
            </section>

            {/* Description */}
            {clinic.description && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>診所介紹</h2>
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'start',
                }}>
                  <ClipboardList size={18} style={{
                    flexShrink: 0, marginTop: 2,
                    color: 'var(--color-clay-text-mute)',
                  }} />
                  <p style={{
                    fontSize: 13, color: 'var(--color-clay-text)',
                    lineHeight: 1.65, margin: 0,
                  }}>{clinic.description}</p>
                </div>
              </section>
            )}
          </div>

          {/* Right column */}
          <div className="h5-detail-right" style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            {/* Map */}
            <div className="h5-map" style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid var(--color-clay-border)',
              background: 'var(--color-clay-section)',
              height: 280, position: 'relative',
            }}>
              <iframe
                title={`${clinic.name} 地圖位置`}
                style={{
                  border: 0, display: 'block',
                  width: '100%', height: '100%',
                }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${mapQuery}`}
              />
            </div>

            {/* Quick actions */}
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>快速操作</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <UberButton
                  clinicName={clinic.name}
                  district={clinic.district}
                  address={clinic.address}
                />
                <ReportButton clinicId={clinic.id} clinicName={clinic.name} />
              </div>
            </section>

          </div>
        </div>

        {/* Similar clinics — always at bottom */}
        {similar && similar.length > 0 && (
          <section style={{ ...sectionStyle, marginTop: 18 }}>
            <h2 style={sectionTitleStyle}>同區域其他診所</h2>
            {(similar as SimilarClinic[]).map((c, i) => (
              <Link key={c.id} href={`/clinic/${c.id}`} style={{
                display: 'block', padding: '11px 0',
                borderBottom: i < similar.length - 1
                  ? '1px dashed var(--color-clay-border)'
                  : 'none',
                textDecoration: 'none',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--color-clay-text)',
                  marginBottom: 3,
                }}>{c.name}</div>
                <div style={{
                  fontSize: 11, color: 'var(--color-clay-text-mute)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <MapPin size={10} />{c.district}
                  {c.rating != null && (
                    <>
                      <span>·</span>
                      <Star size={10} fill="currentColor" /> {c.rating}
                    </>
                  )}
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* Footer info */}
        <div style={{
          marginTop: 28, padding: '14px 0',
          textAlign: 'center', fontSize: 11,
          color: 'var(--color-clay-text-mute)',
          display: 'flex', justifyContent: 'center',
          gap: 10, flexWrap: 'wrap',
        }}>
          <span>資料來源：Google Maps</span>
          {clinic.updated_at && (
            <>
              <span>·</span>
              <span>最後更新：{new Date(clinic.updated_at).toLocaleDateString('zh-TW', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}</span>
            </>
          )}
        </div>
      </div>

      <ClayFooter />
    </div>
  )
}
