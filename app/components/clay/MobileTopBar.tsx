'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  back?: boolean
  backHref?: string
  action?: React.ReactNode
}

/**
 * MobileTopBar — H5 sticky top bar shown on mobile only (≤767px).
 *
 * Visibility is controlled by CSS class .hide-on-desktop in globals.css.
 * The component renders itself unconditionally; the wrapper div hides it
 * on desktop via media query.
 */
export default function MobileTopBar({ title, back = true, backHref, action }: Props) {
  const router = useRouter()

  const backButton = back ? (
    backHref ? (
      <Link
        href={backHref}
        aria-label="返回"
        style={{
          width: 36, height: 36, borderRadius: 18,
          display: 'grid', placeItems: 'center',
          background: 'var(--color-clay-surface)',
          border: '1px solid var(--color-clay-border)',
          color: 'var(--color-clay-text)',
          textDecoration: 'none',
        }}
      >
        <ChevronLeft size={18} />
      </Link>
    ) : (
      <button
        onClick={() => router.back()}
        aria-label="返回"
        style={{
          width: 36, height: 36, borderRadius: 18,
          display: 'grid', placeItems: 'center',
          background: 'var(--color-clay-surface)',
          border: '1px solid var(--color-clay-border)',
          color: 'var(--color-clay-text)',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <ChevronLeft size={18} />
      </button>
    )
  ) : (
    <div style={{ width: 36, height: 36 }} />
  )

  return (
    <div
      className="hide-on-desktop"
      data-flex="true"
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        height: 52,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        background: 'rgba(250,247,242,0.85)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        borderBottom: '1px solid var(--color-clay-border)',
      }}
    >
      {backButton}
      <div style={{
        fontSize: 15, fontWeight: 800,
        color: 'var(--color-clay-text)',
        flex: 1, textAlign: 'center',
      }}>
        {title}
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 18,
        display: 'grid', placeItems: 'center',
        color: 'var(--color-clay-text-soft)',
      }}>
        {action ?? null}
      </div>
    </div>
  )
}
