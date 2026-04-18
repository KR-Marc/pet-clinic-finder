import { AlertTriangle, Clock, Map as MapIcon, MapPin, Phone, Star } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import UberButtonClient from './UberButtonClient'
import { ClayNav, ClayFooter } from '@/app/components/clay'
import MobileTopBar from '@/app/components/clay/MobileTopBar'

interface Clinic {
  id: string; name: string; district: string; address: string
  phone: string; rating: number | null; review_count: number | null
  specialty_tags: string[]; opening_hours: string[] | null; is_24h: boolean
}

const WEEKDAYS = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']

function getTodayHours(hours: string[] | null): string | null {
  if (!hours?.length) return null
  const today = WEEKDAYS[new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).getDay()]
  const entry = hours.find(h => h.startsWith(today))
  if (!entry) return null
  const idx = entry.indexOf(': ')
  return idx >= 0 ? entry.slice(idx + 2) : null
}

function hasReviewWarning(c: Clinic): boolean {
  return (c.review_count ?? 0) > 2000 && (c.rating ?? 0) >= 4.0
}

async function fetchEmergencyClinics(): Promise<Clinic[]> {
  const { data } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, review_count, specialty_tags, opening_hours, is_24h')
    .contains('specialty_tags', ['24H急診'])
    .order('rating', { ascending: false })
  const clinics = (data ?? []) as Clinic[]
  return clinics.sort((a, b) => {
    const aWarn = hasReviewWarning(a) ? 1 : 0
    const bWarn = hasReviewWarning(b) ? 1 : 0
    if (aWarn !== bWarn) return aWarn - bWarn
    return (b.rating ?? 0) - (a.rating ?? 0)
  })
}

export default async function EmergencyPage() {
  const clinics = await fetchEmergencyClinics()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      <div className="hide-on-mobile">
        <ClayNav current="emergency" />
      </div>
      <MobileTopBar title="24H 急診" backHref="/" />

      {/* Red hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-clay-danger) 0%, #a82f2b 100%)',
        color: '#fff', padding: '48px 32px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, letterSpacing: 2,
            background: 'rgba(255,255,255,0.18)',
            padding: '6px 14px', borderRadius: 999,
            fontWeight: 700, marginBottom: 16,
          }}>🚨 緊急資訊</div>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800,
            letterSpacing: -0.8, marginBottom: 10, marginTop: 0,
          }}>台北市 24H 急診動物醫院</h1>
          <p style={{
            fontSize: 15, opacity: 0.95, marginBottom: 6, marginTop: 0,
          }}>遇到寵物緊急狀況時請直接撥打電話確認。</p>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
            共 {clinics.length} 間全天候急診院所
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 48px' }}>
        {/* Warning banner */}
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: 'var(--color-clay-primary-soft)',
          color: '#8a4621',
          borderLeft: '4px solid var(--color-clay-primary)',
          marginBottom: 22, fontSize: 13,
        }}>
          ⚠️ <b>前往前請先來電確認</b>　急診服務可能因醫師排班而有所調整，建議出發前先致電確認。
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}>
          {clinics.map(c => {
            const hours = getTodayHours(c.opening_hours)
            const warn = hasReviewWarning(c)
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.district + c.address)}&travelmode=driving`

            return (
              <div key={c.id} style={{
                background: 'var(--color-clay-surface)',
                border: '1px solid var(--color-clay-border)',
                borderLeft: '4px solid var(--color-clay-danger)',
                borderRadius: 14, padding: 20,
                boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
              }}>
                {warn && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--color-clay-primary-soft)',
                    color: '#8a4621', marginBottom: 12,
                  }}>
                    <AlertTriangle size={14} />
                    <span>此診所評論數量較多，建議參考多方資訊後再決定就診</span>
                  </div>
                )}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'start', marginBottom: 8, gap: 10,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  }}>
                    <Link href={`/clinic/${c.id}`} style={{
                      fontSize: 16, fontWeight: 800,
                      color: 'var(--color-clay-text)',
                      textDecoration: 'none',
                    }}>{c.name}</Link>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                      padding: '3px 8px', borderRadius: 5,
                      background: 'var(--color-clay-danger-soft)',
                      color: 'var(--color-clay-danger)',
                    }}>24H</span>
                  </div>
                  {c.rating != null && (
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-end', flexShrink: 0,
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 12, fontWeight: 700,
                        background: 'var(--color-clay-sage-soft)',
                        color: 'var(--color-clay-sage)',
                        padding: '3px 8px', borderRadius: 6,
                      }}>
                        <Star size={11} fill="currentColor" /> {c.rating}
                      </span>
                      {c.review_count != null && (
                        <span style={{
                          fontSize: 11, color: 'var(--color-clay-text-mute)',
                          marginTop: 3,
                        }}>{c.review_count.toLocaleString()} 則</span>
                      )}
                    </div>
                  )}
                </div>

                <p style={{
                  fontSize: 13, color: 'var(--color-clay-text-soft)',
                  marginBottom: 4, marginTop: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <MapPin size={12} />{c.district}・{c.address}
                </p>

                {hours && (
                  <p style={{
                    fontSize: 12, fontWeight: 600, marginBottom: 14, marginTop: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: 'var(--color-clay-sage)',
                  }}>
                    <Clock size={12} />今日 24 小時營業
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`tel:${c.phone}`} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px 20px', borderRadius: 10,
                    background: 'var(--color-clay-danger)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    textDecoration: 'none', flex: '1 1 auto', minWidth: 130,
                  }}>
                    <Phone size={16} />立即撥打
                  </a>
                  <a
                    href={navUrl}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '11px 18px', borderRadius: 10,
                      background: 'var(--color-clay-surface)',
                      color: 'var(--color-clay-text)',
                      border: '1px solid var(--color-clay-border)',
                      fontSize: 14, fontWeight: 600,
                      textDecoration: 'none', flex: '1 1 auto', minWidth: 130,
                    }}
                  >
                    <MapIcon size={16} />導航前往
                  </a>
                </div>

                <div style={{ marginTop: 8 }}>
                  <UberButtonClient
                    clinicName={c.name}
                    district={c.district}
                    address={c.address}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ClayFooter />
    </div>
  )
}
