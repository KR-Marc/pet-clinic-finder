'use client'
import { Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OpenFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source') ?? ''
  const openParam = searchParams.get('open')
  const active = openParam !== 'false'

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (active) {
      params.set('open', 'false')
    } else {
      params.delete('open')
    }
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        padding: '7px 13px', borderRadius: 999,
        fontSize: 12.5, fontWeight: 500,
        background: active ? 'var(--color-clay-sage)' : 'var(--color-clay-chip-bg)',
        color: active ? '#fff' : 'var(--color-clay-chip-text)',
        border: `1px solid ${active ? 'var(--color-clay-sage)' : 'var(--color-clay-chip-border)'}`,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}
    >
      <Clock size={13} />今日營業中
    </button>
  )
}
