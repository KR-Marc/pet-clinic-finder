'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUICK_TAGS = ['口臭', '牙齦紅腫', '眼屎多', '一直抓', '咳嗽不停', '跛行', '腫塊', '抽搐', '血尿', '半夜急診']

const PET_OPTIONS = [
  { label: '全部', value: '' },
  { label: '貓', value: 'cat' },
  { label: '狗', value: 'dog' },
]

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pet, setPet] = useState('')

  const handleSubmit = (q: string = query) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const params = new URLSearchParams({ q: trimmed })
    if (pet) params.set('pet', pet)
    router.push(`/search?${params.toString()}`)
  }

  const handleBrowseAll = () => {
    const params = new URLSearchParams()
    if (pet) params.set('pet', pet)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-2xl mb-4">
          <span className="text-3xl">🐾</span>
        </div>
        <h1 className="text-3xl font-bold text-teal-700 mb-2">寵物專科診所搜尋</h1>
        <p className="text-gray-500 text-base">描述症狀，找到台北最合適的專科動物醫院</p>
      </div>

      {/* Search area */}
      <div className="w-full max-w-xl">
        {/* Input + button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="描述你的寵物症狀，例如：口臭、掉毛、一直抓"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
          />
          <button
            onClick={() => handleSubmit()}
            className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            搜尋
          </button>
        </div>

        {/* Pet type toggle */}
        <div className="flex gap-2 mt-4 justify-center">
          {PET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPet(opt.value)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border ${
                pet === opt.value
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Quick symptom tags */}
        <div className="mt-8">
          <p className="text-sm text-gray-400 mb-3 font-medium">熱門症狀搜尋</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag)
                  handleSubmit(tag)
                }}
                className="px-3 py-1.5 rounded-full text-sm bg-white text-teal-700 hover:bg-teal-50 border border-teal-200 hover:border-teal-400 transition-colors shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Browse all clinics */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={handleBrowseAll}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors"
          >
            <span>🏥</span>
            <span>瀏覽所有診所</span>
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">272 間</span>
          </button>
        </div>
      </div>
    </main>
  )
}
