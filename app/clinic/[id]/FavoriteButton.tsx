'use client'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFavorites, type FavoriteClinic } from '@/hooks/useFavorites'

export default function FavoriteButton({
  clinic,
}: { clinic: FavoriteClinic; className?: string }) {
  const { toggle, isFavorite } = useFavorites()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const saved = isFavorite(clinic.id)

  return (
    <button
      onClick={() => toggle(clinic)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        fontSize: 13, fontWeight: 700,
        background: saved ? 'var(--color-clay-primary-soft)' : 'var(--color-clay-surface)',
        color: saved ? 'var(--color-clay-primary)' : 'var(--color-clay-text-soft)',
        border: `1px solid ${saved ? 'var(--color-clay-primary)' : 'var(--color-clay-border)'}`,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
      {saved ? '已收藏' : '加入收藏'}
    </button>
  )
}
