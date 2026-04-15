'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function OpenFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const open = searchParams.get('open') === 'true'
  const q = searchParams.get('q') ?? ''
  const pet = searchParams.get('pet') ?? ''
  const district = searchParams.get('district') ?? ''
  const source = searchParams.get('source') ?? ''

  const toggle = () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (pet) params.set('pet', pet)
    if (district) params.set('district', district)
    if (source) params.set('source', source)
    if (!open) params.set('open', 'true')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
        open
          ? 'bg-gold text-ink border-gold'
          : 'bg-transparent text-mist border-mist/50 hover:border-gold hover:text-gold'
      }`}
    >
      {open ? '🟢 今日營業中' : '今日營業中'}
    </button>
  )
}
