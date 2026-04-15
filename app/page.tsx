'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const QUICK_TAGS = ['口臭', '牙齦紅腫', '眼屎多', '一直抓', '咳嗽不停', '跛行', '腫塊', '抽搐', '血尿', '半夜急診']

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat' },
  { label: '狗', value: 'dog' },
]

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
    <main className="min-h-screen bg-brand flex flex-col items-center px-4 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-ink rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🐾</span>
        </div>
        <h1 className="text-3xl font-bold text-snow mb-2">寵物專科診所搜尋</h1>
        <p className="text-mist text-base">描述症狀，找到台北最合適的專科動物醫院</p>
      </div>

      {/* Search area */}
      <div className="w-full max-w-xl">
        {/* Input + button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="描述你的寵物症狀，例如：口臭、掉毛、一直抓"
            className="flex-1 bg-ink border border-mist/40 rounded-xl px-4 py-3 text-base text-snow placeholder:text-mist/50 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent shadow-sm"
          />
          <button
            onClick={() => handleSubmit()}
            className="bg-gold hover:opacity-90 active:opacity-80 text-ink px-6 py-3 rounded-xl font-semibold transition-opacity shadow-sm whitespace-nowrap"
          >
            搜尋
          </button>
        </div>

        {/* Pet type toggle */}
        <div className="flex gap-2 mt-4 justify-center">
          {PET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPet(opt.value)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all border ${
                pet === opt.value
                  ? 'bg-gold text-ink border-gold shadow-sm'
                  : 'bg-transparent text-mist border-mist/50 hover:border-gold hover:text-gold'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Quick symptom tags */}
        <div className="mt-8">
          <p className="text-mist/60 text-sm mb-3 font-medium">熱門症狀搜尋</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => { setQuery(tag); handleSubmit(tag) }}
                className="px-3 py-1.5 rounded-full text-sm text-mist bg-transparent border border-mist/40 hover:border-gold hover:text-gold transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 pt-6 border-t border-mist/20 flex items-center justify-center gap-4 flex-wrap">
          {/* Geolocation */}
          <button
            onClick={handleNearby}
            disabled={geoState === 'loading'}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-xl border ${
              geoState === 'error'
                ? 'text-coral border-coral/40 bg-coral/10'
                : geoState === 'loading'
                  ? 'text-mist/40 border-mist/20 cursor-not-allowed'
                  : 'text-snow border-mist/40 hover:bg-ink hover:border-gold hover:text-gold'
            }`}
          >
            <span>📍</span>
            <span>
              {geoState === 'loading' ? '定位中...' : geoState === 'error' ? '無法取得位置' : '找附近診所'}
            </span>
          </button>

          {/* Browse all */}
          <button
            onClick={handleBrowseAll}
            className="inline-flex items-center gap-2 text-sm text-gold hover:opacity-80 transition-opacity"
          >
            <span>🏥</span>
            <span>瀏覽所有診所</span>
            <span className="text-xs bg-ink text-mist px-2 py-0.5 rounded-full">
              {clinicCount ?? '...'} 間
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}
