'use client'

import { useEffect, useState } from 'react'
import { Clock, Heart, MapPin, Star, Trash2, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { useFavorites, type FavoriteClinic } from '@/hooks/useFavorites'
import { ClayNav, ClayFooter } from '@/app/components/clay'

function EmptyFavoritesWithRecent() {
  const [recent, setRecent] = useState<{ id: string; name: string; district: string; rating: number | null; specialty_tags: string[] }[]>([])
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentlyViewed')
      if (stored) setRecent(JSON.parse(stored).slice(0, 3))
    } catch {}
  }, [])

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Empty illustration / message */}
      <div style={{
        textAlign: 'center',
        background: 'var(--color-clay-surface)',
        border: '1px dashed var(--color-clay-border)',
        borderRadius: 14,
        padding: '48px 24px',
        marginBottom: recent.length > 0 ? 32 : 0,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--color-clay-primary-soft)',
          color: 'var(--color-clay-primary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Heart size={28} />
        </div>
        <p style={{
          fontSize: 17, fontWeight: 700,
          color: 'var(--color-clay-text)',
          marginTop: 0, marginBottom: 6,
        }}>
          尚無收藏診所
        </p>
        <p style={{
          fontSize: 14, color: 'var(--color-clay-text-soft)',
          marginTop: 0, marginBottom: 20, lineHeight: 1.6,
        }}>
          在診所詳細頁點擊「♡ 收藏」即可加入這裡
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '11px 22px', borderRadius: 999,
            background: 'var(--color-clay-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}
        >
          開始搜尋診所 →
        </Link>
      </div>

      {recent.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            color: 'var(--color-clay-text-mute)',
            marginBottom: 12, textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <Clock size={12} /> 最近瀏覽
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/clinic/${c.id}`}
                style={{
                  background: 'var(--color-clay-surface)',
                  border: '1px solid var(--color-clay-border)',
                  borderRadius: 14, padding: 16,
                  textDecoration: 'none',
                  display: 'block',
                  boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 8, marginBottom: 4,
                }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: 'var(--color-clay-text)',
                  }}>
                    {c.name}
                  </div>
                  {c.rating != null && (
                    <span style={{
                      flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 11, fontWeight: 700,
                      background: 'var(--color-clay-sage-soft)',
                      color: 'var(--color-clay-sage)',
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      <Star size={11} style={{ fill: 'currentColor' }} />
                      {c.rating}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--color-clay-text-soft)',
                  marginBottom: c.specialty_tags.length > 0 ? 8 : 0,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  <MapPin size={11} /> {c.district}
                </div>
                {c.specialty_tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {c.specialty_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 9px', borderRadius: 6,
                          background: 'var(--color-clay-tag-bg)',
                          color: 'var(--color-clay-tag-text)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  const { favorites, toggle } = useFavorites()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-clay-bg)', color: 'var(--color-clay-text)' }}>
      <ClayNav current="favorites" />

      {/* Hero */}
      <div style={{
        background: 'var(--color-clay-hero)',
        borderBottom: '1px solid var(--color-clay-border)',
        padding: '48px 24px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -100, top: -80, width: 380, height: 380,
          borderRadius: '50%', background: 'var(--color-clay-hero-accent)',
          filter: 'blur(50px)', opacity: 0.55, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--color-clay-primary)',
            background: 'var(--color-clay-primary-soft)',
            padding: '6px 12px', borderRadius: 999, fontWeight: 700, marginBottom: 16,
          }}>
            <Heart size={13} style={{ fill: 'currentColor' }} /> 我的收藏
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, letterSpacing: -1,
            lineHeight: 1.2, color: 'var(--color-clay-text)',
            margin: 0, marginBottom: 8,
            display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
          }}>
            <span>收藏的診所</span>
            {mounted && favorites.length > 0 && (
              <span style={{
                fontSize: 16, fontWeight: 600,
                color: 'var(--color-clay-text-mute)',
              }}>
                {favorites.length} 間
              </span>
            )}
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--color-clay-text-soft)',
            margin: 0, lineHeight: 1.7,
          }}>
            把信任的診所收進來，緊急時刻一鍵就能找到。
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 56px', width: '100%' }}>
        {!mounted ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-clay-text-mute)', fontSize: 14 }}>
            載入中⋯
          </div>
        ) : favorites.length === 0 ? (
          <EmptyFavoritesWithRecent />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 24 }}>
            {favorites.map((clinic: FavoriteClinic) => (
              <article
                key={clinic.id}
                style={{
                  background: 'var(--color-clay-surface)',
                  border: '1px solid var(--color-clay-border)',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
                }}
              >
                {/* Header: name + rating */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 10, marginBottom: 8,
                }}>
                  <Link
                    href={`/clinic/${clinic.id}`}
                    style={{
                      fontSize: 16, fontWeight: 800,
                      color: 'var(--color-clay-text)',
                      textDecoration: 'none', flex: 1,
                    }}
                  >
                    {clinic.name}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {clinic.rating != null && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 11, fontWeight: 700,
                        background: 'var(--color-clay-sage-soft)',
                        color: 'var(--color-clay-sage)',
                        padding: '3px 8px', borderRadius: 6,
                      }}>
                        <Star size={11} style={{ fill: 'currentColor' }} />
                        {clinic.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* District */}
                <div style={{
                  fontSize: 12.5, color: 'var(--color-clay-text-soft)',
                  marginBottom: clinic.specialty_tags.length > 0 ? 10 : 14,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <MapPin size={12} /> {clinic.district}
                </div>

                {/* Tags */}
                {clinic.specialty_tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {clinic.specialty_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 9px', borderRadius: 6,
                          background: 'var(--color-clay-tag-bg)',
                          color: 'var(--color-clay-tag-text)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--color-clay-border)',
                  flexWrap: 'wrap',
                }}>
                  <Link
                    href={`/clinic/${clinic.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '7px 14px', borderRadius: 8,
                      background: 'var(--color-clay-primary)', color: '#fff',
                      fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    查看詳情 →
                  </Link>
                  <Link
                    href="/search"
                    title="前往搜尋頁，從診所卡片勾選加入比較"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '7px 12px', borderRadius: 8,
                      background: 'var(--color-clay-surface)',
                      color: 'var(--color-clay-text-soft)',
                      border: '1px solid var(--color-clay-border)',
                      fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <ArrowLeftRight size={12} /> 比較
                  </Link>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => toggle(clinic)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '7px 12px', borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--color-clay-text-mute)',
                      border: '1px solid var(--color-clay-border)',
                      fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-clay-danger-soft)'
                      e.currentTarget.style.color = 'var(--color-clay-danger)'
                      e.currentTarget.style.borderColor = 'var(--color-clay-danger-soft)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--color-clay-text-mute)'
                      e.currentTarget.style.borderColor = 'var(--color-clay-border)'
                    }}
                  >
                    <Trash2 size={12} /> 移除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ClayFooter />
    </main>
  )
}
