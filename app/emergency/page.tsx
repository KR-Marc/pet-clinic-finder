'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  rating: number | null
  review_count: number | null
  specialty_tags: string[]
  opening_hours: string[] | null
  is_24h: boolean
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getTodayHours(hours: string[] | null): string | null {
  if (!hours?.length) return null
  const today = WEEKDAYS[new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).getDay()]
  const entry = hours.find(h => h.startsWith(today))
  if (!entry) return null
  const idx = entry.indexOf(': ')
  return idx >= 0 ? entry.slice(idx + 2) : null
}

// 與 clinic detail 頁相同規則：評論數 > 2000 且評分 >= 4.0
function hasReviewWarning(c: Clinic): boolean {
  return (c.review_count ?? 0) > 2000 && (c.rating ?? 0) >= 4.0
}

export default function EmergencyPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/emergency-clinics')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        // 有警示語的排最後，同層按評分排
        const sorted = [...data].sort((a: Clinic, b: Clinic) => {
          const aWarn = hasReviewWarning(a) ? 1 : 0
          const bWarn = hasReviewWarning(b) ? 1 : 0
          if (aWarn !== bWarn) return aWarn - bWarn
          return (b.rating ?? 0) - (a.rating ?? 0)
        })
        setClinics(sorted)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <main className="min-h-screen bg-brand">
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm">🐾 首頁</Link>
        </div>
      </div>

      <div className="bg-ink border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#e16162', color: '#fff' }}>🚨 緊急資訊</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">台北市 24H 急診動物醫院</h1>
          <p className="text-mist/70 text-sm mb-2">遇到寵物緊急狀況時請直接撥打電話確認。</p>
          <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
            {loading ? '載入中...' : `共 ${clinics.length} 間全天候急診院所`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="rounded-xl p-4 mb-6 border border-mist/20"
          style={{ background: 'rgba(225,97,98,0.1)' }}>
          <p className="text-sm text-snow font-semibold mb-1">⚠️ 前往前請先來電確認</p>
          <p className="text-xs text-mist/70">急診服務可能因醫師排班而有所調整，建議出發前先致電確認。</p>
        </div>

        {loading && <div className="text-center py-16 text-mist/50">載入中...</div>}
        {error && <div className="text-center py-8 text-red-400">錯誤：{error}</div>}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {clinics.map(c => {
              const hours = getTodayHours(c.opening_hours)
              const warn = hasReviewWarning(c)
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.district + c.address)}&travelmode=driving`
              const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent('台北市' + c.district + c.address)}&dropoff[nickname]=${encodeURIComponent(c.name)}`

              return (
                <div key={c.id} className="bg-sand rounded-xl p-5 shadow-sm">
                  {/* 警示語 */}
                  {warn && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3"
                      style={{ background: 'rgba(249,188,96,0.1)', color: '#f9bc60', border: '1px solid rgba(249,188,96,0.2)' }}>
                      <span>⚠️</span>
                      <span>此診所評論數量較多，建議參考多方資訊後再決定就診</span>
                    </div>
                  )}

                  {/* 名稱 + 評分 + 評論數 */}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/clinic/${c.id}`} className="font-bold text-base text-ink hover:underline">{c.name}</Link>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: '#e16162', color: '#fff' }}>24H急診</span>
                    </div>
                    {c.rating != null && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>⭐ {c.rating}</span>
                        {c.review_count != null && (
                          <span className="text-xs" style={{ color: 'rgba(249,188,96,0.5)' }}>
                            {c.review_count.toLocaleString()} 則
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 地址 */}
                  <p className="text-xs mb-1" style={{ color: 'rgba(0,30,29,0.5)' }}>
                    📍 {c.district}・{c.address}
                  </p>

                  {/* 今日營業時間 */}
                  {hours && (
                    <p className="text-xs mb-3 font-medium"
                      style={{ color: hours === '休息' ? '#e16162' : '#16a34a' }}>
                      🕐 今日 {hours}
                    </p>
                  )}

                  {/* 電話 + 導航 */}
                  <div className="flex gap-2 mb-2">
                    <a href={`tel:${c.phone}`}
                      className="flex-1 py-3 rounded-xl text-center font-bold text-sm"
                      style={{ background: '#27ae60', color: 'white' }}>
                      📞 立即撥打
                    </a>
                    <a href={navUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl text-center font-bold text-sm"
                      style={{ background: '#2980b9', color: 'white' }}>
                      🗺️ 導航前往
                    </a>
                  </div>

                  {/* Uber */}
                  <a href={uberUrl}
                    className="block py-2.5 rounded-xl text-center font-semibold text-sm"
                    style={{ background: '#1a1a1a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                    🚗 Uber 叫車前往
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
