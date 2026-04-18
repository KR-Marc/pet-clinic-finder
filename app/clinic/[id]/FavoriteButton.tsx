'use client'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'

type FavoriteClinic = {
  id: string; name: string; district: string
  rating: number | null; specialty_tags: string[]
}

export default function FavoriteButton({
  clinic,
}: { clinic: FavoriteClinic; className?: string }) {
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      setSaved(stored.some((c: { id: string }) => c.id === clinic.id))
    } catch {}
  }, [clinic.id])

  const toggle = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      const exists = stored.some((c: { id: string }) => c.id === clinic.id)
      const next = exists
        ? stored.filter((c: { id: string }) => c.id !== clinic.id)
        : [...stored, clinic]
      localStorage.setItem('favorites', JSON.stringify(next))
      setSaved(!exists)
    } catch {}
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
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
