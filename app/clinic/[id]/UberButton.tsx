'use client'
import { Car } from 'lucide-react'

export default function UberButton({
  clinicName, district, address,
}: { clinicName: string; district: string; address: string }) {
  const handleClick = () => {
    const dropoff = encodeURIComponent(`${district} ${address}`)
    const dropoffName = encodeURIComponent(clinicName)
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${dropoff}&dropoff[nickname]=${dropoffName}`
    window.open(uberUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '11px 18px', borderRadius: 10, width: '100%',
        background: 'var(--color-clay-surface)',
        color: 'var(--color-clay-text)',
        border: '1px solid var(--color-clay-border)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Car size={14} />Uber 叫車前往
    </button>
  )
}
