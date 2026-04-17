'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PhoneLink from './PhoneLink'

export interface EmergencyClinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  rating: number | null
  specialty_tags: string[]
  lat: number | null
  lng: number | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export default function ClinicList({ clinics }: { clinics: EmergencyClinic[] }) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(true)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 6000 }
    )
  }, [])

  const withDist = clinics.map(c => ({
    ...c,
    distKm:
      userPos && c.lat != null && c.lng != null
        ? haversineKm(userPos.lat, userPos.lng, c.lat, c.lng)
        : null,
  }))

  const sorted = userPos
    ? [...withDist].sort((a, b) => {
        if (a.distKm == null && b.distKm == null) return 0
        if (a.distKm == null) return 1
        if (b.distKm == null) return -1
        return a.distKm - b.distKm
      })
    : withDist

  return (
    <>
      {/* 定位狀態提示 */}
      {locating && (
        <p className="text-xs text-mist/50 mb-4 text-center">⏳ 定位中，稍後將依距離重新排序…</p>
      )}
      {!locating && !userPos && (
        <p className="text-xs mb-4 text-center" style={{ color: '#f9bc60' }}>
          ⚠️ 無法取得定位，改以評分排序
        </p>
      )}
      {!locating && userPos && (
        <p className="text-xs text-mist/50 mb-4 text-center">📍 已依距離排序</p>
      )}

      <div className="flex flex-col gap-4">
        {sorted.map((clinic, i) => {
          const navUrl =
            clinic.lat != null && clinic.lng != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}&travelmode=driving`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}&travelmode=driving`

          return (
            <div key={clinic.id} className="bg-sand rounded-xl p-5 shadow-sm">
              {/* 名稱行 */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {userPos && i === 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: '#27ae60', color: '#fff' }}
                    >
                      最近
                    </span>
                  )}
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="font-bold text-base text-ink hover:underline"
                  >
                    {clinic.name}
                  </Link>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#e16162', color: '#fff' }}
                  >
                    24H急診
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {clinic.distKm != null && (
                    <span className="text-xs font-bold" style={{ color: '#f9bc60' }}>
                      {fmtDist(clinic.distKm)}
                    </span>
                  )}
                  {clinic.rating != null && (
                    <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>
                      ⭐ {clinic.rating}
                    </span>
                  )}
                </div>
              </div>

              {/* 地址 */}
              <p className="text-xs mb-1" style={{ color: 'rgba(0,30,29,0.5)' }}>
                📍 {clinic.district}・{clinic.address}
              </p>

              {/* 電話 */}
              <PhoneLink phone={clinic.phone} />

              {/* 標籤 */}
              {clinic.specialty_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {clinic.specialty_tags.slice(0, 5).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 導航按鈕 */}
              <a
                href={navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: '#2980b9', color: '#fff' }}
              >
                🗺️ Google Maps 導航
              </a>
            </div>
          )
        })}
      </div>
    </>
  )
}
