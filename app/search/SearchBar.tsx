'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '🐱 貓', value: 'cat' },
  { label: '🐶 狗', value: 'dog' },
]

export default function SearchBar({
  initialQ,
  initialPet,
}: {
  initialQ: string
  initialPet: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 支援多症狀：initialQ 可能是逗號分隔的字串
  const [tags, setTags] = useState<string[]>(
    initialQ ? initialQ.split(',').map((t) => t.trim()).filter(Boolean) : []
  )
  const [input, setInput] = useState('')
  const [pet, setPet] = useState(initialPet)

  const addTag = (val: string) => {
    const trimmed = val.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) return
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
    <div className="flex flex-col gap-2">
      {/* Tag input box */}
      <div
        className="flex flex-wrap items-center gap-1.5 bg-ink border border-mist/30 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-gold focus-within:border-transparent cursor-text min-h-[40px]"
        onClick={() => document.getElementById('search-input')?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold text-ink"
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:opacity-60 transition-opacity leading-none"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id="search-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? '描述症狀或搜尋診所名稱，按 Enter 新增多個症狀…' : '再新增症狀…'}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-snow placeholder:text-mist/40 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          className="bg-gold hover:opacity-90 text-ink px-3 py-1 rounded-md font-bold text-sm transition-opacity whitespace-nowrap shrink-0"
        >
          搜尋
        </button>
      </div>

      {/* 提示文字 */}
      {tags.length === 0 && (
        <p className="text-xs text-mist/40 px-1">
          💡 可輸入多個症狀，例如：口臭 → Enter → 貓蘚 → 搜尋
        </p>
      )}
      {tags.length > 0 && (
        <p className="text-xs text-mist/40 px-1">
          搜尋同時符合以上 {tags.length} 個症狀的診所
        </p>
      )}

      {/* Pet filter */}
      <div className="flex gap-1.5">
        {PET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPet(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              pet === opt.value
                ? 'bg-gold text-ink border-gold'
                : 'bg-transparent text-mist border-mist/40 hover:border-gold hover:text-gold'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
