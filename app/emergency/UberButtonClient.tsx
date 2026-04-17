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
      className="md:hidden py-2.5 rounded-xl text-center font-semibold text-sm flex items-center justify-center gap-2"
      style={{ background: '#1a1a1a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
      onClick={handleClick}
    >
      <Car size={16} />Uber 叫車前往
    </a>
  )
}
