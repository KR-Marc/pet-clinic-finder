'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: 0, background: 'transparent', border: 'none',
          color: 'var(--color-clay-text-soft)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-clay-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-clay-text-soft)' }}
      >
        <ArrowLeft size={14} /> 回上頁
      </button>
      <span style={{ color: 'var(--color-clay-text-mute)', fontSize: 12 }}>·</span>
      <Link
        href="/search"
        style={{
          color: 'var(--color-clay-text-mute)',
          fontSize: 12, textDecoration: 'none',
        }}
      >
        搜尋頁
      </Link>
    </div>
  )
}
