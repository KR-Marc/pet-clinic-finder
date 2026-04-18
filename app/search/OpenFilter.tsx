'use client'
import { Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OpenFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source') ?? ''
  const openParam = searchParams.get('open')
  // nearby 預設開啟，其他預設關閉
  const active = openParam === 'true' || (source === 'nearby' && openParam !== 'false')

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (active) {
      // 當前是開的，要關掉
      if (source === 'nearby') params.set('open', 'false')
      else params.delete('open')
    } else {
      params.set('open', 'true')
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
