'use client'
import Link from 'next/link'
import { Clock, MapPin, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRecentlyViewed, type RecentClinic } from '@/hooks/useRecentlyViewed'

export default function RecentlyViewedSection() {
  const { recent } = useRecentlyViewed()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || recent.length === 0) return null

  return (
    <section style={{ padding: '32px 0 16px' }}>
      <h2 style={{
        fontSize: 18, fontWeight: 800,
        color: 'var(--color-clay-text)',
        marginBottom: 16, marginTop: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Clock size={18} /> 最近查看
      </h2>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
      }}>
        {recent.map((clinic: RecentClinic) => (
          <Link
            key={clinic.id}
            href={`/clinic/${clinic.id}`}
            style={{
              flexShrink: 0, width: 200,
              background: 'var(--color-clay-surface)',
              border: '1px solid var(--color-clay-border)',
              borderRadius: 14, padding: 14,
              boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
              textDecoration: 'none', display: 'block',
            }}
          >
            <p style={{
              fontSize: 14, fontWeight: 700,
              color: 'var(--color-clay-text)',
              margin: '0 0 6px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{clinic.name}</p>
            <p style={{
              fontSize: 12, color: 'var(--color-clay-text-soft)',
              margin: '0 0 6px',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <MapPin size={11} /> {clinic.district}
            </p>
            {clinic.rating != null && (
              <p style={{
                fontSize: 12, fontWeight: 700,
                color: 'var(--color-clay-sage)',
                margin: '0 0 8px',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <Star size={11} fill="currentColor" /> {clinic.rating}
              </p>
            )}
            {clinic.specialty_tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {clinic.specialty_tags.slice(0, 2).map((tag) => (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 6,
                    background: 'var(--color-clay-tag-bg)',
                    color: 'var(--color-clay-tag-text)',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
