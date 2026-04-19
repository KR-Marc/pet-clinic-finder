// app/components/clay/index.tsx
'use client'

import Link from 'next/link'
import { ReactNode, MouseEvent } from 'react'
import {
  PawPrint, Stethoscope, Siren, Heart, MapPin, Phone, Clock,
  Star, Globe, Map as MapIcon, Share2, ClipboardList, AlertTriangle,
} from 'lucide-react'

// ─────────────── Chip ───────────────
export function Chip({
  children, active, onClick, href,
}: {
  children: ReactNode; active?: boolean
  onClick?: () => void; href?: string
}) {
  const style = {
    padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
    background: active ? 'var(--color-clay-primary)' : 'var(--color-clay-chip-bg)',
    color: active ? '#fff' : 'var(--color-clay-chip-text)',
    border: `1px solid ${active ? 'var(--color-clay-primary)' : 'var(--color-clay-chip-border)'}`,
    cursor: 'pointer', display: 'inline-block', textDecoration: 'none',
    fontFamily: 'inherit',
  }
  if (href) return <Link href={href} style={style}>{children}</Link>
  return <button onClick={onClick} style={style}>{children}</button>
}

// ─────────────── Tag ───────────────
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 6,
      background: 'var(--color-clay-tag-bg)',
      color: 'var(--color-clay-tag-text)',
    }}>{children}</span>
  )
}

// ─────────────── Buttons ───────────────
type BtnProps = {
  children: ReactNode; onClick?: (e: MouseEvent) => void
  wide?: boolean; icon?: ReactNode; href?: string
  target?: string; rel?: string
}

const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, padding: '11px 20px', borderRadius: 10, border: 'none',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit', textDecoration: 'none',
}

export function BtnPrimary({ children, onClick, wide, icon, href, target, rel }: BtnProps) {
  const style = {
    ...btnBase,
    background: 'var(--color-clay-primary)', color: '#fff',
    width: wide ? '100%' : undefined,
  }
  if (href) return <a href={href} target={target} rel={rel} style={style}>{icon}{children}</a>
  return <button onClick={onClick} style={style}>{icon}{children}</button>
}

export function BtnSecondary({ children, onClick, wide, icon, href, target, rel }: BtnProps) {
  const style = {
    ...btnBase, padding: '11px 18px', fontWeight: 600,
    background: 'var(--color-clay-surface)', color: 'var(--color-clay-text)',
    border: '1px solid var(--color-clay-border)',
    width: wide ? '100%' : undefined,
  }
  if (href) return <a href={href} target={target} rel={rel} style={style}>{icon}{children}</a>
  return <button onClick={onClick} style={style}>{icon}{children}</button>
}

export function BtnDanger({ children, onClick, wide, icon, href }: BtnProps) {
  const style = {
    ...btnBase,
    background: 'var(--color-clay-danger)', color: '#fff',
    width: wide ? '100%' : undefined,
  }
  if (href) return <a href={href} style={style}>{icon}{children}</a>
  return <button onClick={onClick} style={style}>{icon}{children}</button>
}

// ─────────────── RatingPill ───────────────
export function RatingPill({ rating, isER }: { rating?: number | string | null; isER?: boolean }) {
  if (isER) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700,
        background: 'var(--color-clay-danger-soft)',
        color: 'var(--color-clay-danger)',
        padding: '3px 8px', borderRadius: 6,
      }}>24H</div>
    )
  }
  if (rating == null) return null
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700,
      background: 'var(--color-clay-sage-soft)',
      color: 'var(--color-clay-sage)',
      padding: '3px 8px', borderRadius: 6,
    }}>
      <Star size={11} className="fill-current" /> {rating}
    </div>
  )
}

// ─────────────── Section Helpers ───────────────
export const sectionStyle = {
  background: 'var(--color-clay-surface)',
  border: '1px solid var(--color-clay-border)',
  borderRadius: 14, padding: 20,
}

export const sectionTitleStyle = {
  fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  color: 'var(--color-clay-text-mute)',
  paddingBottom: 12, marginBottom: 10,
  borderBottom: '1px solid var(--color-clay-border)',
}

export function InfoRow({ label, value, link }: {
  label: string; value: ReactNode; link?: boolean
}) {
  return (
    <div style={{
      display: 'flex', padding: '9px 0', fontSize: 13,
      borderBottom: '1px dashed var(--color-clay-border)',
    }}>
      <div style={{ width: 64, color: 'var(--color-clay-text-mute)', fontWeight: 600 }}>{label}</div>
      <div style={{
        color: link ? 'var(--color-clay-primary)' : 'var(--color-clay-text)',
        flex: 1, wordBreak: 'break-all',
      }}>{value}</div>
    </div>
  )
}

// ─────────────── Nav ───────────────
export function ClayNav({ current }: { current?: string }) {
  const items = [
    { href: '/search', label: '瀏覽診所', key: 'search' },
    { href: '/guide', label: '症狀對照', key: 'guide', icon: <Stethoscope size={14} /> },
    { href: '/emergency', label: '急診', key: 'emergency', danger: true, icon: <Siren size={14} /> },
    { href: '/favorites', label: '收藏', key: 'favorites', icon: <Heart size={14} /> },
  ]
  return (
    <div style={{
      height: 64, padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,253,250,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--color-clay-border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--color-clay-primary)',
          display: 'grid', placeItems: 'center',
          color: '#fff',
        }}><PawPrint size={18} /></div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-clay-text)' }}>
          寵物專科診所搜尋
        </div>
        <div style={{
          fontSize: 11, color: 'var(--color-clay-text-mute)',
          padding: '2px 8px', background: 'var(--color-clay-section)',
          borderRadius: 999,
        }}>台北</div>
      </Link>
      <div style={{ display: 'flex', gap: 6 }}>
        {items.map(i => {
          const active = current === i.key
          return (
            <Link key={i.key} href={i.href} style={{
              padding: '8px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: active ? 700 : 500,
              background: active
                ? (i.danger ? 'var(--color-clay-danger-soft)' : 'var(--color-clay-primary-soft)')
                : 'transparent',
              color: i.danger
                ? 'var(--color-clay-danger)'
                : (active ? 'var(--color-clay-primary)' : 'var(--color-clay-text-soft)'),
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              {i.icon}{i.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────── Footer ───────────────
export function ClayFooter() {
  return (
    <footer style={{
      padding: '28px 32px',
      background: 'var(--color-clay-footer)',
      borderTop: '1px solid var(--color-clay-border)',
      fontSize: 12, color: 'var(--color-clay-text-soft)',
      marginTop: 'auto',
    }}>
      <div style={{
        fontWeight: 700, marginBottom: 4,
        color: 'var(--color-clay-text)',
      }}>寵物專科診所搜尋</div>
      <div>台北市最完整的動物醫院專科查詢平台　·　© 2026</div>
      <div style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: '1px solid var(--color-clay-border)',
        fontSize: 11,
        color: 'var(--color-clay-text-mute)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>Made with 🐾 by</span>
        <span style={{ fontWeight: 700, color: 'var(--color-clay-text-soft)' }}>Marc</span>
        <span style={{ color: 'var(--color-clay-border)' }}>×</span>
        <span style={{ fontWeight: 700, color: 'var(--color-clay-text-soft)' }}>Clio</span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          padding: '2px 5px', borderRadius: 4,
          background: 'var(--color-clay-primary-soft)',
          color: 'var(--color-clay-primary)',
          letterSpacing: 0.5,
        }}>AI</span>
      </div>
    </footer>
  )
}

// ─────────────── ClinicCard ───────────────
export type ClinicCardData = {
  id: string; name: string; district: string
  address?: string; phone?: string | null
  rating?: number | null; review_count?: number | null
  specialty_tags?: string[]; is_24h?: boolean
  todayHours?: string | null; isOpenToday?: boolean
}

export function ClinicCard({ c }: { c: ClinicCardData }) {
  return (
    <Link href={`/clinic/${c.id}`} style={{
      background: 'var(--color-clay-surface)',
      border: '1px solid var(--color-clay-border)',
      borderRadius: 14, padding: 18,
      boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
      textDecoration: 'none', display: 'block',
      transition: 'all 0.15s ease',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'start', marginBottom: 6, gap: 8,
      }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: 'var(--color-clay-text)',
        }}>{c.name}</div>
        <RatingPill rating={c.rating} isER={c.is_24h} />
      </div>
      {c.review_count != null && c.rating != null && !c.is_24h && (
        <div style={{
          fontSize: 12, color: 'var(--color-clay-text-mute)',
          marginBottom: 6,
        }}>
          {c.rating}・{c.review_count.toLocaleString()} 則評論
        </div>
      )}
      <div style={{
        fontSize: 12.5, color: 'var(--color-clay-text-soft)',
        marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <MapPin size={12} />{c.district}{c.address ? `・${c.address}` : ''}
      </div>
      {c.todayHours && (
        <div style={{
          fontSize: 12, marginBottom: 10, fontWeight: 500,
          color: c.isOpenToday
            ? 'var(--color-clay-sage)'
            : 'var(--color-clay-text-mute)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Clock size={12} /> 今日 {c.todayHours}
        </div>
      )}
      {c.specialty_tags && c.specialty_tags.length > 0 && (
        <div style={{
          display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12,
        }}>
          {c.specialty_tags.slice(0, 4).map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderTop: '1px dashed var(--color-clay-border)',
        paddingTop: 12,
      }}>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 12, color: 'var(--color-clay-primary)', fontWeight: 700,
        }}>查看詳情 →</span>
      </div>
    </Link>
  )
}

export { PawPrint, Stethoscope, Siren, Heart, MapPin, Phone, Clock, Star,
  Globe, MapIcon, Share2, ClipboardList, AlertTriangle }
