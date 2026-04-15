'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const DISTRICTS = [
  '全部行政區',
  '中正區', '大同區', '中山區', '松山區', '大安區',
  '萬華區', '信義區', '士林區', '北投區', '內湖區',
  '南港區', '文山區',
]

export default function DistrictFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = searchParams.get('district') ?? ''
  const q = searchParams.get('q') ?? ''
  const pet = searchParams.get('pet') ?? ''
  const open = searchParams.get('open') ?? ''
  const source = searchParams.get('source') ?? ''

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (pet) params.set('pet', pet)
    if (district) params.set('district', district)
    if (open) params.set('open', open)
    if (source) params.set('source', source)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={handleChange}
        className="appearance-none bg-ink border border-mist/30 text-mist rounded-lg px-3 py-1.5 pr-7 text-xs focus:outline-none focus:border-gold cursor-pointer"
      >
        {DISTRICTS.map((d) => (
          <option
            key={d}
            value={d === '全部行政區' ? '' : d}
            style={{ background: '#001e1d', color: '#fffffe' }}
          >
            {d}
          </option>
        ))}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-mist/60 text-xs">▾</span>
    </div>
  )
}
