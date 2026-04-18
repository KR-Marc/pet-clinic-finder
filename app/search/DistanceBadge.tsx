'use client'
import { useEffect, useState } from 'react'
import { Navigation } from 'lucide-react'

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function DistanceBadge({ lat, lng }: { lat: number | null; lng: number | null }) {
  const [km, setKm] = useState<number | null>(null)

  useEffect(() => {
    if (lat == null || lng == null) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversine(pos.coords.latitude, pos.coords.longitude, lat, lng)
        setKm(d)
      },
      () => {},
      { maximumAge: 300_000 }
    )
  }, [lat, lng])

  if (km == null) return null

  const display = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600,
      color: 'var(--color-clay-text-mute)',
    }}>
      <Navigation size={10} />距離 {display}
    </span>
  )
}
