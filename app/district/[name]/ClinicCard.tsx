import Link from 'next/link'

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

export default function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <Link
      href={`/clinic/${clinic.id}`}
      className="bg-sand rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm text-ink leading-snug">{clinic.name}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {clinic.is_24h && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral text-snow">
              24H
            </span>
          )}
          {clinic.rating != null && (
            <span className="text-xs font-bold" style={{ color: '#f9bc60' }}>
              ⭐ {clinic.rating}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs mb-2 truncate" style={{ color: 'rgba(0,30,29,0.5)' }}>
        📍 {clinic.address}
      </p>
      {clinic.specialty_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {clinic.specialty_tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow">
              {tag}
            </span>
          ))}
          {clinic.specialty_tags.length > 4 && (
            <span className="text-xs" style={{ color: 'rgba(0,30,29,0.4)' }}>
              +{clinic.specialty_tags.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'rgba(0,30,29,0.45)' }}>
          {clinic.pet_types.includes('dog') && clinic.pet_types.includes('cat')
            ? '🐶🐱 犬貓皆可'
            : clinic.pet_types.includes('dog')
            ? '🐶 犬科'
            : clinic.pet_types.includes('cat')
            ? '🐱 貓科'
            : ''}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
          查看詳情 →
        </span>
      </div>
    </Link>
  )
}
