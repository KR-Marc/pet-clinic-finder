'use client'
import { Share2 } from 'lucide-react'
import { useState } from 'react'

export default function ShareButton({ name }: { name: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = `${name} | 台北寵物專科診所`
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '11px 18px', borderRadius: 10,
        background: 'var(--color-clay-surface)',
        color: 'var(--color-clay-text)',
        border: '1px solid var(--color-clay-border)',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Share2 size={16} />{copied ? '已複製連結' : '分享'}
    </button>
  )
}
