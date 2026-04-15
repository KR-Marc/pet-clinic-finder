'use client'

import { useUserLocation, calcDistance, formatDistance } from '@/hooks/useUserLocation'

export default function DistanceBadge({
  lat,
  lng,
}: {
  lat: number | null
  lng: number | null
}) {
  const userLocation = useUserLocation()

  if (!userLocation || lat == null || lng == null) return null

  const dist = calcDistance(userLocation.lat, userLocation.lng, lat, lng)

  return (
    <span className="text-xs" style={{ color: 'rgba(171,209,198,0.6)' }}>
      📍 距你約 {formatDistance(dist)}
    </span>
  )
}
