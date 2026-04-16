'use client'

interface DistrictMapProps {
  districtName: string
  lat: number
  lng: number
  apiKey: string
}

export default function DistrictMap({ districtName, apiKey }: DistrictMapProps) {
  const query = encodeURIComponent(`台北市${districtName}動物醫院`)

  return (
    <iframe
      title={`${districtName} 診所地圖`}
      width="100%"
      height="100%"
      style={{ border: 0, display: 'block', minHeight: '280px' }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${query}`}
    />
  )
}
