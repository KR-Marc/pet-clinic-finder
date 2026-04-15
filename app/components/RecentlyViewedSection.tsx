'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRecentlyViewed, type RecentClinic } from '@/hooks/useRecentlyViewed'

export default function RecentlyViewedSection() {
  const { recent } = useRecentlyViewed()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || recent.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 pb-10">
      <h2 className="text-lg font-bold text-snow mb-4">🕐 最近查看</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recent.map((clinic: RecentClinic) => (
          <Link
            key={clinic.id}
            href={`/clinic/${clinic.id}`}
            className="shrink-0 bg-sand rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-48"
          >
            <p className="font-semibold text-sm text-ink leading-snug mb-1 truncate">{clinic.name}</p>
            <p className="text-xs mb-2" style={{ color: 'rgba(0,30,29,0.5)' }}>
              📍 {clinic.district}
            </p>
            {clinic.rating != null && (
              <p className="text-xs font-bold mb-2" style={{ color: '#f9bc60' }}>⭐ {clinic.rating}</p>
            )}
            {clinic.specialty_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {clinic.specialty_tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-brand text-snow">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
