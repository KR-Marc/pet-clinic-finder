import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  specialty_tags: string[]
  is_24h: boolean
  pet_types: string[]
  rating: number | null
  review_count: number | null
}

function petLabel(types: string[]): string {
  const hasDog = types.includes('dog')
  const hasCat = types.includes('cat')
  if (hasDog && hasCat) return '犬貓皆可'
  if (hasDog) return '犬科'
  if (hasCat) return '貓科'
  return ''
}

export default function ClinicCard({ clinic }: { clinic: Clinic }) {
  const label = petLabel(clinic.pet_types)

  return (
    <Link
      href={`/clinic/${clinic.id}`}
      style={{
        display: 'block', textDecoration: 'none',
        background: 'var(--color-clay-surface)',
        border: '1px solid var(--color-clay-border)',
        borderRadius: 14, padding: 16,
        boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 8, marginBottom: 6,
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--color-clay-text)', margin: 0, lineHeight: 1.4,
        }}>
          {clinic.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {clinic.is_24h && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
              padding: '2px 7px', borderRadius: 5,
              background: 'var(--color-clay-danger-soft)',
              color: 'var(--color-clay-danger)',
            }}>24H</span>
          )}
          {clinic.rating != null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 700,
              background: 'var(--color-clay-sage-soft)',
              color: 'var(--color-clay-sage)',
              padding: '2px 7px', borderRadius: 5,
            }}>
              <Star size={11} style={{ fill: 'currentColor' }} /> {clinic.rating}
            </span>
          )}
        </div>
      </div>

      <p style={{
        fontSize: 12, color: 'var(--color-clay-text-soft)',
        margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        <MapPin size={12} style={{ flexShrink: 0 }} /> {clinic.address}
      </p>

      {clinic.specialty_tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {clinic.specialty_tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 5,
              background: 'var(--color-clay-tag-bg)',
              color: 'var(--color-clay-tag-text)',
            }}>
              {tag}
            </span>
          ))}
          {clinic.specialty_tags.length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--color-clay-text-mute)' }}>
              +{clinic.specialty_tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {label && (
          <span style={{ fontSize: 12, color: 'var(--color-clay-text-mute)' }}>
            {label}
          </span>
        )}
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--color-clay-primary)', marginLeft: 'auto',
        }}>
          查看詳情 →
        </span>
      </div>
    </Link>
  )
}
