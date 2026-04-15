'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '🐱 貓', value: 'cat' },
  { label: '🐶 狗', value: 'dog' },
]

export default function SearchBar({
  initialQ,
  initialPet,
}: {
  initialQ: string
  initialPet: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQ)
  const [pet, setPet] = useState(initialPet)

  const handleSubmit = () => {
    const params = new URLSearchParams()
    const trimmed = query.trim()
    if (trimmed) params.set('q', trimmed)
    if (pet) params.set('pet', pet)
    // preserve district if set
    const district = searchParams.get('district') ?? ''
    if (district) params.set('district', district)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="描述症狀或搜尋診所名稱…"
          className="flex-1 bg-ink border border-mist/30 rounded-lg px-3 py-2 text-sm text-snow placeholder:text-mist/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
        <button
          onClick={handleSubmit}
          className="bg-gold hover:opacity-90 text-ink px-4 py-2 rounded-lg font-bold text-sm transition-opacity whitespace-nowrap"
        >
          搜尋
        </button>
      </div>
      <div className="flex gap-1.5">
        {PET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPet(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              pet === opt.value
                ? 'bg-gold text-ink border-gold'
                : 'bg-transparent text-mist border-mist/40 hover:border-gold hover:text-gold'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
