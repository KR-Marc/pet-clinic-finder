import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Star } from 'lucide-react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import { ClayNav, ClayFooter } from '@/app/components/clay'

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

const RowLabel = ({ children }: { children: React.ReactNode }) => (
  <td style={{
    padding: '16px 16px 16px 0',
    fontSize: 12, fontWeight: 700,
    color: 'var(--color-clay-text-mute)',
    textTransform: 'uppercase', letterSpacing: 0.5,
    verticalAlign: 'top',
    borderTop: '1px solid var(--color-clay-border)',
    width: 96,
  }}>{children}</td>
)

const Cell = ({ children }: { children: React.ReactNode }) => (
  <td style={{
    padding: '16px',
    verticalAlign: 'top',
    borderTop: '1px solid var(--color-clay-border)',
  }}>{children}</td>
)

const Dash = () => (
  <span style={{ fontSize: 12, color: 'var(--color-clay-text-mute)' }}>—</span>
)

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
    <main style={{ minHeight: '100vh', background: 'var(--color-clay-bg)', color: 'var(--color-clay-text)' }}>
      <ClayNav />

      {/* Hero */}
      <div style={{
        background: 'var(--color-clay-hero)',
        borderBottom: '1px solid var(--color-clay-border)',
        padding: '40px 24px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -100, top: -80, width: 380, height: 380,
          borderRadius: '50%', background: 'var(--color-clay-hero-accent)',
          filter: 'blur(50px)', opacity: 0.55, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 16 }}>
            <Link href="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, color: 'var(--color-clay-text-soft)',
              textDecoration: 'none', fontWeight: 600,
            }}>
              <ArrowLeft size={14} /> 回搜尋結果
            </Link>
          </div>

          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--color-clay-primary)',
            background: 'var(--color-clay-primary-soft)',
            padding: '5px 12px', borderRadius: 999, fontWeight: 700,
            marginBottom: 12,
          }}>
            ⇄ 診所比較
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: -0.8,
            margin: '0 0 8px',
            color: 'var(--color-clay-text)',
          }}>
            並排比較 {clinics.length} 間診所
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--color-clay-text-soft)',
            margin: 0, lineHeight: 1.7,
          }}>
            一次看清評分、特色、專科、營業時間 — 幫你決定該選哪間。
          </p>
        </div>
      </div>

      {/* Compare table */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 56px', overflowX: 'auto' }}>
        <div style={{
          background: 'var(--color-clay-surface)',
          border: '1px solid var(--color-clay-border)',
          borderRadius: 14,
          padding: 8,
          boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            minWidth: `${clinics.length * 240 + 96}px`,
          }}>
            {/* Header row — clinic names */}
            <thead>
              <tr>
                <th style={{ width: 96 }} />
                {clinics.map((clinic) => (
                  <th key={clinic.id} style={{ padding: '20px 16px 16px', textAlign: 'left', verticalAlign: 'top' }}>
                    <Link
                      href={`/clinic/${clinic.id}`}
                      style={{
                        display: 'block',
                        fontSize: 16, fontWeight: 800,
                        color: 'var(--color-clay-text)',
                        textDecoration: 'none', lineHeight: 1.3,
                      }}
                    >
                      {clinic.name}
                    </Link>
                    <p style={{
                      margin: '4px 0 0', fontSize: 12,
                      color: 'var(--color-clay-text-soft)',
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                      <MapPin size={12} /> {clinic.district}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Rating */}
              <tr>
                <RowLabel>評分</RowLabel>
                {clinics.map((clinic) => (
                  <Cell key={clinic.id}>
                    {clinic.rating != null ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 13, fontWeight: 700,
                        background: 'var(--color-clay-sage-soft)',
                        color: 'var(--color-clay-sage)',
                        padding: '4px 10px', borderRadius: 6,
                      }}>
                        <Star size={13} style={{ fill: 'currentColor' }} /> {clinic.rating}
                      </span>
                    ) : <Dash />}
                  </Cell>
                ))}
              </tr>

              {/* 24H / Appointment */}
              <tr>
                <RowLabel>特色</RowLabel>
                {clinics.map((clinic) => (
                  <Cell key={clinic.id}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {clinic.is_24h && (
                        <span style={{
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 11, fontWeight: 800,
                          background: 'var(--color-clay-danger)', color: '#fff',
                        }}>24H 急診</span>
                      )}
                      {clinic.is_appointment && (
                        <span style={{
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 11, fontWeight: 700,
                          background: 'var(--color-clay-primary-soft)',
                          color: 'var(--color-clay-primary)',
                        }}>需預約</span>
                      )}
                      {!clinic.is_24h && !clinic.is_appointment && <Dash />}
                    </div>
                  </Cell>
                ))}
              </tr>

              {/* Specialty tags */}
              <tr>
                <RowLabel>專科</RowLabel>
                {clinics.map((clinic) => (
                  <Cell key={clinic.id}>
                    {clinic.specialty_tags?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {clinic.specialty_tags.map((tag: string) => (
                          <span key={tag} style={{
                            fontSize: 11, fontWeight: 600,
                            padding: '3px 9px', borderRadius: 6,
                            background: 'var(--color-clay-tag-bg)',
                            color: 'var(--color-clay-tag-text)',
                          }}>{tag}</span>
                        ))}
                      </div>
                    ) : <Dash />}
                  </Cell>
                ))}
              </tr>

              {/* Phone */}
              <tr>
                <RowLabel>電話</RowLabel>
                {clinics.map((clinic) => (
                  <Cell key={clinic.id}>
                    {clinic.phone ? (
                      <a href={`tel:${clinic.phone}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 13, fontWeight: 700,
                        color: 'var(--color-clay-primary)',
                        textDecoration: 'none',
                      }}>
                        <Phone size={12} /> {clinic.phone}
                      </a>
                    ) : <Dash />}
                  </Cell>
                ))}
              </tr>

              {/* Opening hours */}
              <tr>
                <RowLabel>營業時間</RowLabel>
                {clinics.map((clinic) => {
                  const hoursMap = clinic.opening_hours ? parseHoursMap(clinic.opening_hours) : {}
                  return (
                    <Cell key={clinic.id}>
                      {Object.keys(hoursMap).length > 0 ? (
                        <div style={{
                          borderRadius: 10,
                          border: '1px solid var(--color-clay-border)',
                          overflow: 'hidden',
                        }}>
                          {WEEKDAYS_TABLE.map((day, idx) => {
                            const hrs = hoursMap[day]
                            if (!hrs) return null
                            const isToday = day === todayName
                            const isClosed = hrs === '休息'
                            return (
                              <div
                                key={day}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 10px', fontSize: 12,
                                  borderBottom: idx < WEEKDAYS_TABLE.length - 1 ? '1px solid var(--color-clay-border)' : 'none',
                                  background: isToday ? 'var(--color-clay-primary-soft)' : 'transparent',
                                }}
                              >
                                <span style={{
                                  width: 32, flexShrink: 0,
                                  color: isToday ? 'var(--color-clay-primary)' : 'var(--color-clay-text-mute)',
                                  fontWeight: isToday ? 700 : 500,
                                }}>
                                  {DAY_SHORT[day]}
                                </span>
                                <span style={{
                                  color: isClosed
                                    ? 'var(--color-clay-danger)'
                                    : isToday
                                      ? 'var(--color-clay-primary)'
                                      : 'var(--color-clay-text-soft)',
                                  fontWeight: isToday ? 700 : 400,
                                }}>
                                  {hrs}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-clay-text-mute)' }}>未收錄</span>
                      )}
                    </Cell>
                  )
                })}
              </tr>

              {/* Action row */}
              <tr>
                <td style={{
                  padding: '16px 16px 16px 0',
                  borderTop: '1px solid var(--color-clay-border)',
                }} />
                {clinics.map((clinic) => (
                  <td key={clinic.id} style={{
                    padding: '16px',
                    borderTop: '1px solid var(--color-clay-border)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <a
                        href={`tel:${clinic.phone}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'var(--color-clay-primary)', color: '#fff',
                          fontSize: 13, fontWeight: 700, textDecoration: 'none',
                        }}
                      >
                        <Phone size={14} /> 立即撥打
                      </a>
                      <Link
                        href={`/clinic/${clinic.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'var(--color-clay-surface)',
                          color: 'var(--color-clay-text)',
                          border: '1px solid var(--color-clay-border)',
                          fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        }}
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
      </div>

      <ClayFooter />
    </main>
  )
}
