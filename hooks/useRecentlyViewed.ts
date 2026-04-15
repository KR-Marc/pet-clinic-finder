import { useState, useEffect } from 'react'

export interface RecentClinic {
  id: string
  name: string
  district: string
  rating: number | null
  specialty_tags: string[]
}

const KEY = 'recently_viewed'
const MAX = 5

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentClinic[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch {}
  }, [])

  const addRecent = (clinic: RecentClinic) => {
    try {
      const stored = localStorage.getItem(KEY)
      const current: RecentClinic[] = stored ? JSON.parse(stored) : []
      const filtered = current.filter((c) => c.id !== clinic.id)
      const updated = [clinic, ...filtered].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(updated))
      setRecent(updated)
    } catch {}
  }

  return { recent, addRecent }
}
