'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

interface Props {
  id: string
  name: string
  district: string
  rating: number | null
  specialty_tags: string[]
}

export default function RecentlyViewedTracker(props: Props) {
  const { addRecent } = useRecentlyViewed()

  useEffect(() => {
    addRecent(props)
  }, [props.id])

  return null
}
