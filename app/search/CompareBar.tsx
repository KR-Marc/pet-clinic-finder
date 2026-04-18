'use client'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { Clinic } from './ClinicList'

export default function CompareBar({
  selected,
  onRemove,
  onClear,
}: {
  selected: Clinic[]
  onRemove: (id: string) => void
  onClear: () => void
}) {
  if (selected.length === 0) return null

  const compareUrl = `/compare?ids=${selected.map((c) => c.id).join(',')}`

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100, width: 'calc(100% - 32px)', maxWidth: 720,
      background: 'var(--color-clay-surface)',
      border: '1px solid var(--color-clay-border)',
      borderRadius: 14,
      boxShadow: '0 10px 32px rgb(79 56 28 / 0.18)',
      padding: 14,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: 'var(--color-clay-primary)',
        letterSpacing: 0.5, flexShrink: 0,
      }}>
        比較清單（{selected.length}/3）
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
        {selected.map((c) => (
          <span key={c.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 8px 5px 10px',
            borderRadius: 999, fontSize: 12,
            background: 'var(--color-clay-primary-soft)',
            color: 'var(--color-clay-primary)',
            fontWeight: 600,
          }}>
            {c.name}
            <button
              onClick={() => onRemove(c.id)}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--color-clay-primary)',
                cursor: 'pointer', padding: 0, lineHeight: 0,
                display: 'inline-flex',
              }}
            ><X size={12} /></button>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onClear}
          style={{
            padding: '8px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            background: 'transparent',
            color: 'var(--color-clay-text-mute)',
            border: '1px solid var(--color-clay-border)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >清空</button>
        <Link
          href={compareUrl}
          style={{
            padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 700,
            background: 'var(--color-clay-primary)',
            color: '#fff', textDecoration: 'none',
            pointerEvents: selected.length < 2 ? 'none' : 'auto',
            opacity: selected.length < 2 ? 0.4 : 1,
          }}
        >開始比較 →</Link>
      </div>
    </div>
  )
}
