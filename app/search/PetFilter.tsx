'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat' },
  { label: '狗', value: 'dog' },
]

export default function PetFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = searchParams.get('pet') ?? ''
  const q = searchParams.get('q') ?? ''
  const district = searchParams.get('district') ?? ''
  const open = searchParams.get('open') ?? ''
  const source = searchParams.get('source') ?? ''

  const handleClick = (pet: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (pet) params.set('pet', pet)
    if (district) params.set('district', district)
    if (open) params.set('open', open)
    if (source) params.set('source', source)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex gap-1.5">
      {PET_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleClick(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
            current === opt.value
              ? 'bg-gold text-ink border-gold'
              : 'bg-transparent text-mist border-mist/50 hover:border-gold hover:text-gold'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
