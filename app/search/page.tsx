import { Suspense } from 'react'
import { MapPin } from 'lucide-react'
import ClinicListServer from './ClinicListServer'
import SearchBar from './SearchBar'
import { ClayNav, ClayFooter } from '@/app/components/clay'
import MobileTopBar from '@/app/components/clay/MobileTopBar'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string; source?: string; open?: string }>
}) {
  const { q = '', district = '', source = '', open = '' } = await searchParams

  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)
  const subtitleText = queryTerms.length === 0
    ? (source === 'nearby' ? '附近的診所' : '瀏覽所有診所')
    : queryTerms.length === 1
      ? `搜尋「${queryTerms[0]}」`
      : `複合搜尋「${queryTerms.join('」+「')}」`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      <div className="hide-on-mobile">
        <ClayNav current="search" />
      </div>
      <MobileTopBar title="瀏覽診所" backHref="/" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* Subtitle */}
        <div style={{
          fontSize: 13, color: 'var(--color-clay-text-mute)',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {source === 'nearby' && <MapPin size={13} />}
          {subtitleText}
        </div>

        {/* Search bar (tags input) */}
        <Suspense fallback={null}>
          <SearchBar initialQ={q} />
        </Suspense>

        {/* Results */}
        <Suspense fallback={
          <div style={{
            padding: 24, marginTop: 16,
            background: 'var(--color-clay-surface)',
            border: '1px solid var(--color-clay-border)',
            borderRadius: 14, fontSize: 13,
            color: 'var(--color-clay-text-mute)',
          }}>載入中⋯</div>
        }>
          <ClinicListServer
            q={q} district={district}
            queryTerms={queryTerms} source={source}
            open={open}
          />
        </Suspense>
      </div>

      <ClayFooter />
    </div>
  )
}
