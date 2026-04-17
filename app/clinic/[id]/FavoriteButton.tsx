'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites, type FavoriteClinic } from '@/hooks/useFavorites'

export default function FavoriteButton({ clinic, className = '' }: { clinic: FavoriteClinic; className?: string }) {
  const { toggle, isFavorite } = useFavorites()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const saved = isFavorite(clinic.id)

  return (
    <button
      onClick={() => toggle(clinic)}
      aria-label={saved ? '取消收藏' : '加入收藏'}
      className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${className}`}
      style={
        saved
          ? { background: 'rgba(244,63,94,0.12)', borderColor: '#F43F5E', color: '#F43F5E' }
          : { background: 'transparent', borderColor: 'rgba(171,209,198,0.3)', color: 'rgba(171,209,198,0.6)' }
      }
    >
      {saved ? <><Heart size={14} className="inline fill-current" /><span className="hidden sm:inline ml-1">已收藏</span></> : <><Heart size={14} className="inline" /><span className="hidden sm:inline ml-1">收藏</span></>}
    </button>
  )
}
