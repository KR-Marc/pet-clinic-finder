'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Data ──────────────────────────────────────────────────────────────────────

const QUICK_TAGS = ['口臭', '牙齦紅腫', '眼屎多', '一直抓', '咳嗽不停', '跛行', '腫塊', '抽搐', '血尿', '半夜急診']

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '🐱 貓', value: 'cat' },
  { label: '🐶 狗', value: 'dog' },
]

const FEATURES = [
  {
    icon: '🔍',
    title: '描述症狀',
    desc: '輸入你的寵物症狀，例如口臭、掉毛、一直抓',
  },
  {
    icon: '🎯',
    title: '找到專科',
    desc: '系統自動比對最適合的專科動物醫院',
  },
  {
    icon: '📞',
    title: '立即聯繫',
    desc: '直接撥打電話或查看地圖前往',
  },
]

const SPECIALTIES = [
  { icon: '🦷', name: '牙科',    desc: '口臭、掉牙、牙齦紅腫',       q: '牙科'    },
  { icon: '👁️', name: '眼科',    desc: '眼屎多、眼睛紅、白內障',     q: '眼科'    },
  { icon: '❤️', name: '心臟科',  desc: '咳嗽、容易喘、心雜音',       q: '心臟科'  },
  { icon: '🦴', name: '骨科',    desc: '跛行、骨折、不肯走路',       q: '骨科'    },
  { icon: '🎗️', name: '腫瘤科',  desc: '腫塊、癌症、化療',           q: '腫瘤科'  },
  { icon: '🌿', name: '皮膚科',  desc: '一直抓、掉毛、皮膚紅疹',     q: '皮膚科'  },
  { icon: '🧠', name: '神經科',  desc: '抽搐、癲癇、走路歪',         q: '抽搐'    },
  { icon: '🚨', name: '24H急診', desc: '昏倒、呼吸困難、緊急',       q: '半夜急診' },
]

// ── Geolocation helper ────────────────────────────────────────────────────────

type GeoState = 'idle' | 'loading' | 'error'

async function reverseGeocodeDistrict(lat: number, lng: number): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=zh-TW&key=${key}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null
  for (const result of data.results) {
    for (const component of result.address_components as { long_name: string; types: string[] }[]) {
      if (
        component.types.includes('administrative_area_level_3') ||
        component.types.includes('sublocality_level_1')
      ) {
        if (component.long_name.endsWith('區')) return component.long_name
      }
    }
  }
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pet, setPet] = useState('')
  const [clinicCount, setClinicCount] = useState<number | null>(null)
  const [geoState, setGeoState] = useState<GeoState>('idle')

  useEffect(() => {
    supabase
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count != null) setClinicCount(count) })
  }, [])

  const handleSubmit = (q: string = query) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const params = new URLSearchParams({ q: trimmed })
    if (pet) params.set('pet', pet)
    router.push(`/search?${params.toString()}`)
  }

  const handleBrowseAll = () => {
    const params = new URLSearchParams()
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
    <div className="min-h-screen bg-brand">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="bg-ink sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <span className="text-snow font-bold text-base sm:text-lg tracking-tight">
              寵物專科診所搜尋
            </span>
          </div>
          <button
            onClick={handleBrowseAll}
            className="text-mist hover:text-gold text-sm font-medium transition-colors duration-200"
          >
            瀏覽診所
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* Left column — 60% */}
          <div className="lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-ink rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse shrink-0" />
              <span className="text-mist text-sm font-medium">
                台北市 {clinicCount ?? '272'} 間動物醫院
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-snow leading-tight mb-6">
              找到最適合<br />
              你毛孩的<br />
              <span className="text-gold">專科診所</span>
            </h1>

            <p className="text-mist text-base sm:text-lg mb-8 max-w-md leading-relaxed">
              描述症狀，我們幫你找到台北市最專業的動物醫院
            </p>

            {/* Search box */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="描述你的寵物症狀，例如：口臭、掉毛、一直抓"
                className="flex-1 bg-ink border border-mist/30 rounded-xl px-4 py-3.5 text-base text-snow placeholder:text-mist/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent shadow-sm"
              />
              <button
                onClick={() => handleSubmit()}
                className="bg-gold hover:opacity-90 active:opacity-80 text-ink px-6 py-3.5 rounded-xl font-bold text-base transition-opacity shadow-sm whitespace-nowrap"
              >
                搜尋
              </button>
            </div>

            {/* Pet filter */}
            <div className="flex gap-2 mb-6">
              {PET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPet(opt.value)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    pet === opt.value
                      ? 'bg-gold text-ink border-gold shadow-sm'
                      : 'bg-transparent text-mist border-mist/40 hover:border-gold hover:text-gold'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {/* Nearby button */}
              <button
                onClick={handleNearby}
                disabled={geoState === 'loading'}
                className={`ml-auto px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-1.5 ${
                  geoState === 'error'
                    ? 'text-coral border-coral/40'
                    : geoState === 'loading'
                      ? 'text-mist/40 border-mist/20 cursor-not-allowed'
                      : 'text-mist border-mist/40 hover:border-gold hover:text-gold'
                }`}
              >
                <span>📍</span>
                <span className="hidden sm:inline">
                  {geoState === 'loading' ? '定位中...' : geoState === 'error' ? '無法定位' : '附近診所'}
                </span>
              </button>
            </div>

            {/* Quick symptom tags */}
            <div>
              <p className="text-mist/50 text-xs font-medium mb-2.5 uppercase tracking-wide">
                熱門症狀搜尋
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setQuery(tag); handleSubmit(tag) }}
                    className="px-3 py-1.5 rounded-full text-xs text-mist bg-transparent border border-mist/30 hover:border-gold hover:text-gold transition-all duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — 40% illustration */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="relative rounded-3xl bg-ink/40 p-6 overflow-hidden min-h-[420px]">
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-mist/15 blur-3xl pointer-events-none" />

              {/* Header label */}
              <p className="text-mist/50 text-xs font-medium uppercase tracking-wide mb-4">
                搜尋結果預覽
              </p>

              {/* Mock clinic card 1 */}
              <div className="bg-sand rounded-2xl p-4 mb-3 shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-ink text-sm">敦品動物醫院</p>
                    <p className="text-ink/50 text-xs mt-0.5">📍 大安區　敦化南路一段</p>
                  </div>
                  <span className="text-xs font-semibold text-gold whitespace-nowrap">⭐ 4.8</span>
                </div>
                <p className="text-brand text-xs font-medium mb-2">🕐 今日 10:00 – 21:00</p>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">牙科</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">根管治療</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">牙周病</span>
                </div>
              </div>

              {/* Mock clinic card 2 */}
              <div className="bg-sand rounded-2xl p-4 mb-3 shadow-lg rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-ink text-sm">路米動物醫院</p>
                    <p className="text-ink/50 text-xs mt-0.5">📍 中山區　民權西路</p>
                  </div>
                  <span className="text-xs font-semibold text-gold whitespace-nowrap">⭐ 4.2</span>
                </div>
                <p className="text-brand text-xs font-medium mb-2">🕐 今日 09:00 – 20:00</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">眼科</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">腫瘤科</span>
                </div>
              </div>

              {/* Mock clinic card 3 — partially visible */}
              <div className="bg-sand rounded-2xl p-4 shadow-lg opacity-60 scale-95 -mb-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-ink text-sm">汎亞動物醫院</p>
                    <p className="text-ink/50 text-xs mt-0.5">📍 士林區　中山北路六段</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral text-snow">24H</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">骨科</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">神經外科</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="bg-ink">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 divide-x divide-mist/20">
            {[
              { icon: '🏥', number: clinicCount ?? 272, unit: '間', label: '台北市動物醫院' },
              { icon: '🔬', number: 194,                unit: '項', label: '專科標籤覆蓋'  },
              { icon: '📍', number: 12,                 unit: '區', label: '行政區完整覆蓋' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 sm:px-10 text-center">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl sm:text-3xl font-bold text-snow">
                  {stat.number}
                  <span className="text-gold ml-1 text-xl">{stat.unit}</span>
                </p>
                <p className="text-mist text-xs sm:text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-snow mb-3">如何使用</h2>
          <p className="text-mist">三個步驟，快速找到最適合的專科醫院</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="bg-ink rounded-2xl p-7 relative overflow-hidden group hover:ring-1 hover:ring-gold/30 transition-all duration-200">
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-6xl font-black text-snow/5 select-none">
                {i + 1}
              </span>
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-snow font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-mist text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular specialties ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-16 lg:pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-snow mb-3">熱門專科搜尋</h2>
          <p className="text-mist">點擊專科，直接找到相關診所</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec.name}
              onClick={() => router.push(`/search?q=${encodeURIComponent(spec.q)}`)}
              className="group bg-sand hover:bg-brand rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 border border-transparent hover:border-gold/20"
            >
              <span className="text-2xl sm:text-3xl mb-3 block">{spec.icon}</span>
              <h3 className="font-bold text-ink group-hover:text-snow text-sm sm:text-base mb-1 transition-colors duration-200">
                {spec.name}
              </h3>
              <p className="text-ink/50 group-hover:text-mist text-xs leading-relaxed transition-colors duration-200">
                {spec.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-ink">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🐾</span>
                <span className="text-snow font-bold">寵物專科診所搜尋</span>
              </div>
              <p className="text-mist/60 text-sm">台北市最完整的動物醫院專科查詢平台</p>
            </div>
            {/* Right */}
            <div className="text-right">
              <p className="text-mist/60 text-xs leading-relaxed">
                資料來源：台北市動物保護處、Google Maps
              </p>
            </div>
          </div>
          <div className="border-t border-mist/10 pt-6">
            <p className="text-mist/40 text-xs text-center">
              © 2025 寵物專科診所搜尋　·　資料僅供參考，實際資訊請以診所公告為準
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
