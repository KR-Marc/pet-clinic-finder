import { useState, useEffect } from 'react'

export interface FavoriteClinic {
  id: string
  name: string
  district: string
  rating: number | null
  specialty_tags: string[]
}

const KEY = 'pet_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteClinic[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      } else {
        // One-time migration from old key 'favorites' → 'pet_favorites'
        const legacy = localStorage.getItem('favorites')
        if (legacy) {
          const parsed = JSON.parse(legacy)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFavorites(parsed)
            localStorage.setItem(KEY, legacy)
          }
          localStorage.removeItem('favorites')
        }
      }
    } catch {}
  }, [])

  const save = (list: FavoriteClinic[]) => {
    setFavorites(list)
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
  }

  const toggle = (clinic: FavoriteClinic) => {
    const exists = favorites.some((f) => f.id === clinic.id)
    save(exists ? favorites.filter((f) => f.id !== clinic.id) : [...favorites, clinic])
  }

  const isFavorite = (id: string) => favorites.some((f) => f.id === id)

  return { favorites, toggle, isFavorite }
}
