'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFavorites, type FavoriteClinic } from '@/hooks/useFavorites'

export default function FavoritesPage() {
  const { favorites, toggle } = useFavorites()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <main className="min-h-screen bg-brand">
      {/* Nav */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm transition-colors">
            🐾 首頁
          </Link>
          <span className="text-mist/30">|</span>
          <span className="text-snow text-sm font-medium">我的收藏</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-snow">我的收藏</h1>
          {mounted && favorites.length > 0 && (
            <span className="text-xs text-mist/50">{favorites.length} 間診所</span>
          )}
        </div>

        {!mounted ? null : favorites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🤍</p>
            <p className="text-lg font-medium text-snow mb-2">尚無收藏診所</p>
            <p className="text-sm text-mist/60 mb-6">在診所詳細頁點擊「收藏」即可加入</p>
            <Link
              href="/"
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#f9bc60', color: '#001e1d' }}
            >
              開始搜尋診所
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {favorites.map((clinic: FavoriteClinic) => (
              <div key={clinic.id} className="bg-sand rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="font-semibold text-ink hover:opacity-70 transition-opacity"
                  >
                    {clinic.name}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {clinic.rating != null && (
                      <span className="text-xs font-bold" style={{ color: '#f9bc60' }}>
                        ⭐ {clinic.rating}
                      </span>
                    )}
                    <button
                      onClick={() => toggle(clinic)}
                      className="text-xs text-mist/40 hover:text-coral transition-colors"
                    >
                      移除
                    </button>
                  </div>
                </div>
                <p className="text-xs mb-2" style={{ color: 'rgba(0,30,29,0.5)' }}>
                  📍 {clinic.district}
                </p>
                {clinic.specialty_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clinic.specialty_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/clinic/${clinic.id}`}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#f9bc60' }}
                  >
                    查看詳情 →
                  </Link>
                  <Link
                    href="/search"
                    title="前往搜尋頁，從診所卡片勾選加入比較"
                    className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors hover:text-snow"
                    style={{ color: 'rgba(171,209,198,0.5)', borderColor: 'rgba(171,209,198,0.2)' }}
                  >
                    ⇄ 比較
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
