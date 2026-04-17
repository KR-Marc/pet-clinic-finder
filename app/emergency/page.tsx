'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Clinic {
  id: string; name: string; district: string; address: string
  phone: string; rating: number | null; specialty_tags: string[]
  lat: number | null; lng: number | null
}

function dist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function EmergencyPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState<{lat:number;lng:number}|null>(null)

  useEffect(() => {
    fetch('/api/emergency-clinics')
      .then(r => r.json())
      .then(data => { setClinics((data ?? []) as Clinic[]); setLoading(false) })
      .catch(() => setLoading(false))

    navigator.geolocation?.getCurrentPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}, { timeout: 6000 }
    )
  }, [])

  const sorted = pos
    ? [...clinics].sort((a, b) => {
        const da = a.lat && a.lng ? dist(pos.lat, pos.lng, a.lat, a.lng) : 999
        const db = b.lat && b.lng ? dist(pos.lat, pos.lng, b.lat, b.lng) : 999
        return da - db
      })
    : clinics

  const navUrl = (c: Clinic) => c.lat && c.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}&travelmode=driving`

  return (
    <main className="min-h-screen bg-brand">
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm">🐾 首頁</Link>
        </div>
      </div>

      <div className="bg-ink border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#e16162', color: '#fff' }}>🚨 緊急資訊</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">台北市 24H 急診動物醫院</h1>
          <p className="text-mist/70 text-sm mb-2">遇到寵物緊急狀況時請直接撥打電話確認。</p>
          <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
            {loading ? '載入中...' : `共 ${clinics.length} 間全天候急診院所`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="rounded-xl p-4 mb-6 border border-mist/20" style={{ background: 'rgba(225,97,98,0.1)' }}>
          <p className="text-sm text-snow font-semibold mb-1">⚠️ 前往前請先來電確認</p>
          <p className="text-xs text-mist/70">急診服務可能因醫師排班而有所調整，建議出發前先致電確認。</p>
        </div>

        {pos && <p className="text-xs text-mist/50 mb-4 text-center">📍 已依距離排序</p>}

        {loading ? (
          <div className="text-center py-16 text-mist/50">載入中...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((c, i) => {
              const km = pos && c.lat && c.lng ? dist(pos.lat, pos.lng, c.lat, c.lng) : null
              return (
                <div key={c.id} className="bg-sand rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pos && i === 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#27ae60', color: '#fff' }}>最近</span>}
                      <Link href={`/clinic/${c.id}`} className="font-bold text-base text-ink hover:underline">{c.name}</Link>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#e16162', color: '#fff' }}>24H急診</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {km != null && <span className="text-xs font-bold" style={{ color: '#f9bc60' }}>{km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`}</span>}
                      {c.rating != null && <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>⭐ {c.rating}</span>}
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'rgba(0,30,29,0.5)' }}>📍 {c.district}・{c.address}</p>
                  <div className="flex gap-2 mb-2">
                    <a href={`tel:${c.phone}`} className="flex-1 py-3 rounded-xl text-center font-bold text-sm" style={{ background: '#27ae60', color: 'white' }}>📞 立即撥打</a>
                    <a href={navUrl(c)} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl text-center font-bold text-sm" style={{ background: '#2980b9', color: 'white' }}>🗺️ 導航前往</a>
                  </div>
                  {c.lat && c.lng && (
                    <a href={`uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${c.lat}&dropoff[longitude]=${c.lng}&dropoff[nickname]=${encodeURIComponent(c.name)}`}
                      className="block py-2.5 rounded-xl text-center font-semibold text-sm"
                      style={{ background: '#1a1a1a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                      🚗 Uber 叫車前往
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
