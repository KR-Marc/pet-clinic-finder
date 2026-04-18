'use client'
import { useState } from 'react'
import { Cat, Dog } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Chip } from '@/app/components/clay'

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat' },
  { label: '狗', value: 'dog' },
]

export default function SearchBar({
  initialQ, initialPet,
}: { initialQ: string; initialPet: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tags, setTags] = useState<string[]>(
    initialQ ? initialQ.split(',').map((t) => t.trim()).filter(Boolean) : []
  )
  const [input, setInput] = useState('')
  const [pet, setPet] = useState(initialPet)

  const addTag = (val: string) => {
    const trimmed = val.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags((prev) => [...prev, trimmed])
    setInput('')
  }
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      if (input.trim()) addTag(input)
      else handleSubmit()
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleSubmit = () => {
    const allTags = input.trim() ? [...tags, input.trim()] : tags
    if (input.trim()) setInput('')
    const params = new URLSearchParams()
    if (allTags.length > 0) params.set('q', allTags.join(','))
    if (pet) params.set('pet', pet)
    const district = searchParams.get('district') ?? ''
    if (district) params.set('district', district)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {/* Tag input bar */}
      <div
        onClick={() => document.getElementById('search-input')?.focus()}
        style={{
          background: 'var(--color-clay-surface)',
          padding: 8, borderRadius: 12,
          display: 'flex', gap: 8, alignItems: 'center',
          boxShadow: '0 1px 3px rgb(79 56 28 / 0.06)',
          border: '1px solid var(--color-clay-border)',
          cursor: 'text', minHeight: 48, flexWrap: 'wrap',
        }}
      >
        {tags.map((tag) => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            background: 'var(--color-clay-primary)',
            color: '#fff',
          }}>
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              style={{
                border: 'none', background: 'transparent', color: '#fff',
                cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1,
                opacity: 0.8,
              }}
            >✕</button>
          </span>
        ))}
        <input
          id="search-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0
            ? '輸入症狀、診所名稱⋯'
            : '再新增症狀⋯'}
          style={{
            flex: 1, minWidth: 120, padding: '8px 10px',
            fontSize: 14, border: 'none', outline: 'none',
            background: 'transparent', fontFamily: 'inherit',
            color: 'var(--color-clay-text)',
          }}
        />
        <button onClick={handleSubmit} style={{
          padding: '10px 22px', borderRadius: 10, border: 'none',
          background: 'var(--color-clay-primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>搜尋</button>
      </div>

      {/* Hint */}
      <p style={{
        margin: 0, fontSize: 12,
        color: 'var(--color-clay-text-mute)',
      }}>
        {tags.length === 0
          ? '💡 可輸入多個症狀，例如：口臭 → Enter → 貓蘚 → 搜尋'
          : `搜尋同時符合以上 ${tags.length} 個症狀的診所`}
      </p>

      {/* Pet filter */}
      <div style={{ display: 'flex', gap: 7 }}>
        {PET_OPTIONS.map((opt) => (
          <Chip key={opt.value} active={pet === opt.value} onClick={() => setPet(opt.value)}>
            {opt.value === 'cat' ? <><Cat size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />貓</>
              : opt.value === 'dog' ? <><Dog size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />狗</>
              : opt.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
