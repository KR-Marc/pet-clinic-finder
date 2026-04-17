'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites, type FavoriteClinic } from '@/hooks/useFavorites'

export default function FavoriteButton({ clinic }: { clinic: FavoriteClinic }) {
  const { toggle, isFavorite } = useFavorites()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const saved = isFavorite(clinic.id)

  return (
    <button
      onClick={() => toggle(clinic)}
      aria-label={saved ? '取消收藏' : '加入收藏'}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border"
      style={
        saved
          ? { background: 'rgba(249,188,96,0.15)', borderColor: '#f9bc60', color: '#f9bc60' }
          : { background: 'transparent', borderColor: 'rgba(171,209,198,0.3)', color: 'rgba(171,209,198,0.6)' }
      }
    >
      {saved ? <><Heart size={14} className="inline fill-current" /><span className="hidden sm:inline ml-1">已收藏</span></> : <><Heart size={14} className="inline" /><span className="hidden sm:inline ml-1">收藏</span></>}
    </button>
  )
}
