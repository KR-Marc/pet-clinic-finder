'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const DISTRICTS = ['大安區','信義區','中山區','內湖區','士林區','文山區','松山區','中正區','萬華區','北投區','南港區','大同區']

export default function DistrictFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const district = searchParams.get('district') ?? ''

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('district', value)
    else params.delete('district')
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <select
      value={district}
      onChange={handleChange}
      style={{
        appearance: 'none',
        padding: '7px 28px 7px 14px',
        borderRadius: 8, fontSize: 13,
        background: 'var(--color-clay-surface)',
        border: '1px solid var(--color-clay-border)',
        color: 'var(--color-clay-text)',
        fontFamily: 'inherit', cursor: 'pointer',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a8f7f' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      <option value="">全部行政區</option>
      {DISTRICTS.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  )
}
