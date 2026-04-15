'use client'

export default function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 mt-2 mb-3 text-sm font-semibold transition-opacity hover:opacity-70"
      style={{ color: '#001e1d' }}
    >
      📞 {phone}
    </a>
  )
}
