'use client'
import { useState, useEffect, useRef } from 'react'
import {
  MapPin, Search, Siren, Stethoscope,
  Eye, Heart, Bone, Ribbon, Leaf, Brain, Scissors,
  Droplets, Activity,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import RecentlyViewedSection from './components/RecentlyViewedSection'
import { ClayNav, ClayFooter, Chip } from './components/clay'
import MobileTopBar from './components/clay/MobileTopBar'

// ── Data ──────────────────────────────────────────────────────────────────────
const QUICK_TAGS = ['嘔吐', '拉肚子', '抽搐', '血尿', '血便', '呼吸困難', '食慾不振', '咳嗽', '沒精神', '掉毛', '一直抓', '半夜急診']
const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat' },
  { label: '狗', value: 'dog' },
]

const SPECIALTIES = [
  { icon: 'tooth', name: '牙科', desc: '口臭、掉牙、牙齦紅腫', q: '牙科' },
  { icon: 'eye', name: '眼科', desc: '眼屎多、眼睛紅、白內障', q: '眼科' },
  { icon: 'heart', name: '心臟科', desc: '咳嗽、容易喘、心雜音', q: '心臟科' },
  { icon: 'bone', name: '骨科', desc: '跛行、骨折、不肯走路', q: '骨科' },
  { icon: 'ribbon', name: '腫瘤科', desc: '腫塊、癌症、化療', q: '腫瘤科' },
  { icon: 'leaf', name: '皮膚科', desc: '一直抓、掉毛、皮膚紅疹', q: '皮膚科' },
  { icon: 'brain', name: '神經科', desc: '抽搐、癲癇、走路歪', q: '抽搐' },
  { icon: 'siren', name: '24H急診', desc: '昏倒、呼吸困難、緊急', q: '半夜急診' },
  { icon: 'scissors', name: '外科', desc: '腫塊切除、結紮、外傷縫合', q: '外科' },
  { icon: 'leaf2', name: '中獸醫', desc: '針灸、中藥、慢性病調理', q: '中獸醫' },
  { icon: 'droplets', name: '泌尿科', desc: '血尿、頻尿、尿結石、膀胱炎', q: '泌尿科' },
  { icon: 'activity', name: '復健', desc: '術後恢復、關節退化、水療', q: '復健' },
]

const DISTRICTS = ['大安區','信義區','中山區','內湖區','士林區','文山區','松山區','中正區','萬華區','北投區','南港區','大同區']

type GeoState = 'idle' | 'loading' | 'error'

async function reverseGeocodeDistrict(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.district ?? null
  } catch { return null }
}

function SpecIcon({ name }: { name: string }) {
  const size = 22
  switch (name) {
    case 'tooth': return <Stethoscope size={size} />
    case 'eye': return <Eye size={size} />
    case 'heart': return <Heart size={size} />
    case 'bone': return <Bone size={size} />
    case 'ribbon': return <Ribbon size={size} />
    case 'leaf': case 'leaf2': return <Leaf size={size} />
    case 'brain': return <Brain size={size} />
    case 'scissors': return <Scissors size={size} />
    case 'droplets': return <Droplets size={size} />
    case 'activity': return <Activity size={size} />
    case 'siren': return <Siren size={size} />
    default: return <Stethoscope size={size} />
  }
}

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pet, setPet] = useState('')
  const [clinicCount, setClinicCount] = useState<number | null>(null)
  const [geoState, setGeoState] = useState<GeoState>('idle')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('searchHistory')
      if (stored) setSearchHistory(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const saveToHistory = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const updated = [trimmed, ...searchHistory.filter(h => h !== trimmed)].slice(0, 8)
    setSearchHistory(updated)
    try { localStorage.setItem('searchHistory', JSON.stringify(updated)) } catch {}
  }

  const removeFromHistory = (item: string) => {
    const updated = searchHistory.filter(h => h !== item)
    setSearchHistory(updated)
    try { localStorage.setItem('searchHistory', JSON.stringify(updated)) } catch {}
  }

  useEffect(() => {
    supabase.from('clinics').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count != null) setClinicCount(count) })
  }, [])

  const handleSubmit = (q: string = query) => {
    const trimmed = q.trim()
    if (!trimmed) return
    saveToHistory(trimmed)
    setShowHistory(false)
    const params = new URLSearchParams({ q: trimmed })
    if (pet) params.set('pet', pet)
    router.push(`/search?${params.toString()}`)
  }

  const handleNearby = () => {
    if (!navigator.geolocation) { setGeoState('error'); return }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const district = await reverseGeocodeDistrict(latitude, longitude)
          const params = new URLSearchParams({ source: 'nearby' })
          if (district) params.set('district', district)
          if (pet) params.set('pet', pet)
          router.push(`/search?${params.toString()}`)
        } catch { setGeoState('error') }
      },
      () => setGeoState('error'),
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      <div className="hide-on-mobile">
        <ClayNav current="home" />
      </div>
      <MobileTopBar title="寵物專科診所搜尋" back={false} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="h5-hero" style={{
        padding: '56px 32px 44px',
        background: 'var(--color-clay-hero)',
        borderBottom: '1px solid var(--color-clay-border)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -60, top: -40, width: 320, height: 320,
          borderRadius: '50%', background: 'var(--color-clay-hero-accent)',
          filter: 'blur(60px)', opacity: 0.55, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block', fontSize: 12,
            color: 'var(--color-clay-primary)',
            background: 'var(--color-clay-primary-soft)',
            padding: '6px 12px', borderRadius: 999, fontWeight: 700, marginBottom: 20,
          }}>
            台北市 {clinicCount ?? 272} 間動物醫院
          </div>

          {/* Headline */}
          <h1 className="h5-hero-h1" style={{
            fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800,
            letterSpacing: -1.5, lineHeight: 1.1,
            color: 'var(--color-clay-text)', marginBottom: 14, marginTop: 0,
          }}>
            找到最適合<br />
            <span style={{ color: 'var(--color-clay-primary)' }}>你毛孩的</span>專科診所
          </h1>
          <p className="h5-hero-sub" style={{
            fontSize: 16, color: 'var(--color-clay-text-soft)',
            marginBottom: 26, maxWidth: 520, lineHeight: 1.6,
          }}>
            描述症狀，我們幫你找到台北市最專業的動物醫院
          </p>

          {/* Search box */}
          <div style={{
            background: 'var(--color-clay-surface)', padding: 8, borderRadius: 14,
            display: 'flex', gap: 8, alignItems: 'center', maxWidth: 640,
            boxShadow: '0 10px 40px rgb(79 56 28 / 0.10)',
            border: '1px solid var(--color-clay-border)',
            position: 'relative',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                onFocus={() => setShowHistory(true)}
                placeholder="例如：我家狗狗一直抓癢、掉毛⋯"
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 14,
                  border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: 'inherit', color: 'var(--color-clay-text)',
                }}
              />
              {showHistory && searchHistory.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                  background: 'var(--color-clay-surface)',
                  border: '1px solid var(--color-clay-border)',
                  borderRadius: 12, boxShadow: '0 8px 24px rgb(79 56 28 / 0.15)',
                  zIndex: 50, overflow: 'hidden',
                }}>
                  <p style={{
                    fontSize: 11, color: 'var(--color-clay-text-mute)',
                    padding: '12px 16px 4px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 1, margin: 0,
                  }}>最近搜尋</p>
                  {searchHistory.map((item) => (
                    <div key={item}
                      onMouseDown={() => { setQuery(item); handleSubmit(item) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-clay-section)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Search size={13} style={{ color: 'var(--color-clay-text-mute)' }} />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--color-clay-text)' }}>{item}</span>
                      <button
                        onMouseDown={(e) => { e.stopPropagation(); removeFromHistory(item) }}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--color-clay-text-mute)', cursor: 'pointer',
                          fontSize: 12, padding: 4,
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleSubmit()} style={{
              padding: '12px 28px', borderRadius: 10, border: 'none',
              background: 'var(--color-clay-primary)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>搜尋</button>
          </div>

          {/* Pet filter + Nearby */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {PET_OPTIONS.map(opt => (
              <Chip key={opt.value} active={pet === opt.value} onClick={() => setPet(opt.value)}>
                {opt.label}
              </Chip>
            ))}
            <button
              onClick={handleNearby}
              disabled={geoState === 'loading'}
              style={{
                padding: '7px 13px', borderRadius: 999,
                fontSize: 12.5, fontWeight: 500,
                background: 'var(--color-clay-chip-bg)',
                color: geoState === 'error'
                  ? 'var(--color-clay-danger)'
                  : 'var(--color-clay-chip-text)',
                border: `1px solid ${geoState === 'error' ? 'var(--color-clay-danger)' : 'var(--color-clay-chip-border)'}`,
                cursor: geoState === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <MapPin size={13} />
              {geoState === 'loading' ? '定位中...' : geoState === 'error' ? '無法定位' : '附近診所'}
            </button>
          </div>

          {/* Hot symptoms */}
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 11, color: 'var(--color-clay-text-mute)',
              marginBottom: 10, fontWeight: 700, letterSpacing: 1,
            }}>熱門症狀搜尋</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {QUICK_TAGS.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSubmit(s) }}
                  style={{
                    padding: '5px 11px', borderRadius: 8, fontSize: 12,
                    background: 'var(--color-clay-chip-bg)',
                    color: 'var(--color-clay-chip-text)',
                    border: '1px solid var(--color-clay-chip-border)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats highlight ───────────────────────────────── */}
      <div style={{
        padding: '40px 32px', maxWidth: 1000, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
        borderTop: '1px solid var(--color-clay-border)',
        borderBottom: '1px solid var(--color-clay-border)',
      }}>
        {[
          { num: clinicCount ?? 271, label: '間動物醫院', suffix: '' },
          { num: 12, label: '個行政區', suffix: '' },
          { num: 14, label: '個專科類別', suffix: '' },
        ].map(({ num, label }, i) => (
          <Link key={i} href="/search" style={{
            textDecoration: 'none',
            padding: '24px 20px',
            textAlign: 'center',
            borderRight: i < 2 ? '1px solid var(--color-clay-border)' : 'none',
            display: 'block',
          }}>
            <div style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 800,
              color: 'var(--color-clay-primary)',
              letterSpacing: -1.5,
              lineHeight: 1,
              marginBottom: 6,
            }}>{num}</div>
            <div style={{
              fontSize: 13,
              color: 'var(--color-clay-text-soft)',
              fontWeight: 500,
            }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* ── Two feature cards ──────────────────────────────── */}
      <div style={{
        padding: '36px 32px', maxWidth: 1000, margin: '0 auto', width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
        boxSizing: 'border-box',
      }}>
        <Link href="/guide" style={{
          background: 'var(--color-clay-section)',
          color: 'var(--color-clay-text)',
          padding: 22, borderRadius: 14,
          border: '1px solid var(--color-clay-border)',
          textDecoration: 'none', display: 'block',
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <Stethoscope size={20} /> 症狀對照表
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-clay-text-soft)' }}>
            不知道掛哪科？對照症狀快速找到專科 →
          </div>
        </Link>
        <Link href="/emergency" style={{
          background: 'var(--color-clay-danger)', color: '#fff',
          padding: 22, borderRadius: 14, textDecoration: 'none', display: 'block',
          boxShadow: '0 4px 16px rgb(199 62 58 / 0.25)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <Siren size={20} /> 24H 急診動物醫院
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>台北市 11 間全天候急診院所 →</div>
        </Link>
      </div>

      {/* ── Specialties ────────────────────────────────────── */}
      <section style={{ padding: '36px 32px', background: 'var(--color-clay-section)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, color: 'var(--color-clay-text)',
            marginBottom: 4, marginTop: 0,
          }}>熱門專科搜尋</h2>
          <p style={{
            fontSize: 13, color: 'var(--color-clay-text-soft)',
            marginBottom: 20, marginTop: 0,
          }}>點擊專科，直接找到相關診所</p>
          <div className="h5-grid-2col" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {SPECIALTIES.map(s => (
              <button key={s.name}
                onClick={() => router.push(`/search?q=${encodeURIComponent(s.q)}`)}
                style={{
                  background: 'var(--color-clay-surface)',
                  border: '1px solid var(--color-clay-border)',
                  borderRadius: 10, padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--color-clay-primary-soft)',
                  color: 'var(--color-clay-primary)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <SpecIcon name={s.icon} />
                </div>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: 'var(--color-clay-primary)', marginBottom: 3,
                  }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-clay-text-mute)' }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px' }}>
        <RecentlyViewedSection />
      </div>

      {/* ── Districts ──────────────────────────────────────── */}
      <section style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: 'var(--color-clay-text)',
          marginBottom: 4, marginTop: 0,
        }}>依行政區找診所</h2>
        <p style={{
          fontSize: 12, color: 'var(--color-clay-text-soft)',
          marginBottom: 14, marginTop: 0,
        }}>台北市 12 個行政區，完整覆蓋</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {DISTRICTS.map(d => (
            <Chip key={d} href={`/district/${encodeURIComponent(d)}`}>{d}</Chip>
          ))}
        </div>
      </section>

      <ClayFooter />
    </div>
  )
}
