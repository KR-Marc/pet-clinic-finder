'use client'
import { Car } from 'lucide-react'

interface Props {
  clinicName: string
  district: string
  address: string
}

export default function UberButtonClient({ clinicName, district, address }: Props) {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const btn = e.currentTarget
    const fullAddress = '台北市' + district + address
    btn.textContent = '定位中...'
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`)
      const data = await res.json()
      if (data.lat && data.lng) {
        window.location.href = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${data.lat}&dropoff[longitude]=${data.lng}&dropoff[nickname]=${encodeURIComponent(clinicName)}&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}`
      } else {
        window.location.href = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}&dropoff[nickname]=${encodeURIComponent(clinicName)}`
      }
    } catch {
      window.location.href = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}&dropoff[nickname]=${encodeURIComponent(clinicName)}`
    } finally {
      btn.textContent = 'Uber 叫車前往'
    }
  }

  return (
    <a
      href="#"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '11px 18px', borderRadius: 10, width: '100%',
        background: 'var(--color-clay-surface)',
        color: 'var(--color-clay-text)',
        border: '1px solid var(--color-clay-border)',
        fontSize: 14, fontWeight: 600, textDecoration: 'none',
        boxSizing: 'border-box',
      }}
      onClick={handleClick}
    >
      <Car size={16} />Uber 叫車前往
    </a>
  )
}
