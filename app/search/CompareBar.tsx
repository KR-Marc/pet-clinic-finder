'use client'

import Link from 'next/link'
import { type Clinic } from './ClinicList'

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

  const query = selected.map((c) => c.id).join(',')

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t border-mist/20"
      style={{ background: 'rgba(0,30,29,0.97)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <p className="text-xs font-semibold text-mist/60 shrink-0">
          比較 {selected.length}/3
        </p>
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {selected.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
              style={{ background: 'rgba(249,188,96,0.15)', color: '#f9bc60', border: '1px solid rgba(249,188,96,0.3)' }}
            >
              <span className="max-w-[80px] truncate">{c.name}</span>
              <button
                onClick={() => onRemove(c.id)}
                className="hover:opacity-60 transition-opacity leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClear}
          className="text-xs text-mist/40 hover:text-mist transition-colors shrink-0"
        >
          清除
        </button>
        {selected.length >= 2 && (
          <Link
            href={`/compare?ids=${query}`}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 shrink-0"
            style={{ background: '#f9bc60', color: '#001e1d' }}
          >
            開始比較 →
          </Link>
        )}
      </div>
    </div>
  )
}
