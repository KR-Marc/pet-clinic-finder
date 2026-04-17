'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Clinic {
  id: string; name: string; district: string; address: string
  phone: string; rating: number | null; specialty_tags: string[]
  lat: number | null; lng: number | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function EmergencyClient() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [userPos, setUserPos] = useState<{lat: number; lng: number} | null>(null)
  const [locating, setLocating] = useState(true)

  useEffect(() => {
    // 載入診所
    supabase.from('clinics').select('id,name,district,address,phone,rating,specialty_tags,lat,lng')
      .overlaps('specialty_tags', ['24H急診'])
      .order('rating', { ascending: false })
      .then(({ data }) => { setClinics((data ?? []) as Clinic[]); setLoading(false) })

    // 定位
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => setLocating(false),
      { timeout: 6000 }
    )
  }, [])

  const sorted = userPos
    ? [...clinics].sort((a, b) => {
        const da = a.lat && a.lng ? haversineKm(userPos.lat, userPos.lng, a.lat, a.lng) : Infinity
        const db = b.lat && b.lng ? haversineKm(userPos.lat, userPos.lng, b.lat, b.lng) : Infinity
        return da - db
      })
    : clinics

  const getNavUrl = (c: Clinic) =>
    c.lat && c.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}&travelmode=driving`

  const getUberUrl = (c: Clinic) =>
    c.lat && c.lng
      ? `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${c.lat}&dropoff[longitude]=${c.lng}&dropoff[nickname]=${encodeURIComponent(c.name)}`
      : null

  return (
    <main className="min-h-screen bg-brand">
      {/* Nav */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm transition-colors">🐾 首頁</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-ink border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#e16162', color: '#fff' }}>
            🚨 緊急資訊
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">台北市 24H 急診動物醫院</h1>
          <p className="text-mist/70 text-sm leading-relaxed mb-2">
            以下診所提供 24 小時急診服務，遇到寵物緊急狀況時請直接撥打電話確認。
          </p>
          <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
            {loading ? '載入中...' : `共 ${clinics.length} 間全天候急診院所`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* 提示 */}
        <div className="rounded-xl p-4 mb-6 border border-mist/20" style={{ background: 'rgba(225,97,98,0.1)' }}>
          <p className="text-sm text-snow font-semibold mb-1">⚠️ 前往前請先來電確認</p>
          <p className="text-xs text-mist/70 leading-relaxed">急診服務可能因醫師排班而有所調整，建議出發前先致電確認是否有急診醫師值班。</p>
        </div>

        {/* 定位狀態 */}
        {locating && <p className="text-xs text-mist/50 mb-4 text-center">⏳ 定位中，稍後將依距離重新排序…</p>}
        {!locating && !userPos && <p className="text-xs mb-4 text-center" style={{ color: '#f9bc60' }}>⚠️ 無法取得定位，改以評分排序</p>}
        {!locating && userPos && <p className="text-xs text-mist/50 mb-4 text-center">📍 已依距離排序</p>}

        {loading ? (
          <div className="text-center py-16 text-mist/50">載入中...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((clinic, i) => {
              const distKm = userPos && clinic.lat && clinic.lng
                ? haversineKm(userPos.lat, userPos.lng, clinic.lat, clinic.lng)
                : null

              return (
                <div key={clinic.id} className="bg-sand rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {userPos && i === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#27ae60', color: '#fff' }}>最近</span>
                      )}
                      <Link href={`/clinic/${clinic.id}`} className="font-bold text-base text-ink hover:underline">
                        {clinic.name}
                      </Link>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#e16162', color: '#fff' }}>24H急診</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {distKm != null && (
                        <span className="text-xs font-bold" style={{ color: '#f9bc60' }}>
                          {distKm < 1 ? `${Math.round(distKm*1000)}m` : `${distKm.toFixed(1)}km`}
                        </span>
                      )}
                      {clinic.rating != null && (
                        <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>⭐ {clinic.rating}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs mb-3" style={{ color: 'rgba(0,30,29,0.5)' }}>📍 {clinic.district}・{clinic.address}</p>

                  {/* 電話 + 導航 */}
                  <div className="flex gap-2 mb-2">
                    <a href={`tel:${clinic.phone}`}
                      className="flex-1 py-3 rounded-xl text-center font-bold text-sm"
                      style={{ background: '#27ae60', color: 'white' }}>
                      📞 立即撥打
                    </a>
                    <a href={getNavUrl(clinic)} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl text-center font-bold text-sm"
                      style={{ background: '#2980b9', color: 'white' }}>
                      🗺️ 導航前往
                    </a>
                  </div>

                  {/* Uber */}
                  {getUberUrl(clinic) && (
                    <a href={getUberUrl(clinic)!}
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
