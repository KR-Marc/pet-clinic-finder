'use client'
import { Cat, Dog } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat', icon: <Cat size={13} /> },
  { label: '狗', value: 'dog', icon: <Dog size={13} /> },
]

export default function PetFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pet = searchParams.get('pet') ?? ''

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('pet', value)
    else params.delete('pet')
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {PET_OPTIONS.map((opt) => {
        const active = pet === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            style={{
              padding: '7px 13px', borderRadius: 999,
              fontSize: 12.5, fontWeight: 500,
              background: active ? 'var(--color-clay-primary)' : 'var(--color-clay-chip-bg)',
              color: active ? '#fff' : 'var(--color-clay-chip-text)',
              border: `1px solid ${active ? 'var(--color-clay-primary)' : 'var(--color-clay-chip-border)'}`,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            {opt.icon}{opt.label}
          </button>
        )
      })}
    </div>
  )
}
