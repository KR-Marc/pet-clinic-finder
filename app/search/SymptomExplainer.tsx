'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ExplainerData {
  summary: string
  causes: string[]
  advice: string
  urgency: 'low' | 'medium' | 'high'
  specialties?: string[]
}

// ── 保養品建議對照表 ──────────────────────────────────────────────────────────
interface Supplement {
  label: string
  keyword: string // 蝦皮搜尋關鍵字
}

const SUPPLEMENT_MAP: Record<string, Supplement[]> = {
  牙科: [
    { label: '🦷 潔牙零食', keyword: '寵物潔牙零食' },
    { label: '🧴 酵素牙膏', keyword: '寵物酵素牙膏' },
    { label: '💧 漱口水添加劑', keyword: '寵物漱口水' },
  ],
  眼科: [
    { label: '🌿 葉黃素保健品', keyword: '寵物葉黃素' },
    { label: '🫐 藍莓萃取保健品', keyword: '寵物眼睛保健' },
  ],
  皮膚科: [
    { label: '🐟 Omega-3 魚油', keyword: '寵物魚油 Omega-3' },
    { label: '🦠 益生菌', keyword: '寵物益生菌 皮膚' },
    { label: '🍖 低敏飼料', keyword: '寵物低敏飼料' },
  ],
  腸胃: [
    { label: '🦠 益生菌', keyword: '寵物益生菌腸胃' },
    { label: '🥫 腸胃保健濕糧', keyword: '寵物腸胃保健罐頭' },
    { label: '🌾 低敏主食罐', keyword: '寵物低敏主食罐' },
  ],
  泌尿科: [
    { label: '💧 泌尿道保健零食', keyword: '寵物泌尿道保健' },
    { label: '🥣 增加飲水濕糧', keyword: '寵物濕食 泌尿' },
  ],
  腎臟科: [
    { label: '🏥 低磷飼料', keyword: '寵物低磷飼料 腎臟' },
    { label: '🍽️ 腎臟處方食品', keyword: '寵物腎臟處方飼料' },
  ],
  骨科: [
    { label: '🦴 葡萄糖胺', keyword: '寵物葡萄糖胺' },
    { label: '💊 軟骨素保健品', keyword: '寵物軟骨素' },
    { label: '🏃 關節保健品', keyword: '寵物關節保健' },
  ],
  心臟科: [
    { label: '🧂 低鈉飼料', keyword: '寵物低鈉飼料 心臟' },
    { label: '💊 牛磺酸補充品', keyword: '寵物牛磺酸' },
  ],
  腫瘤科: [
    { label: '🥩 高蛋白低碳水飼料', keyword: '寵物高蛋白飼料' },
    { label: '🛡️ 抗氧化保健品', keyword: '寵物抗氧化保健' },
  ],
  復健: [
    { label: '🦴 葡萄糖胺', keyword: '寵物葡萄糖胺' },
    { label: '🐟 魚油', keyword: '寵物魚油關節' },
  ],
  中獸醫: [
    { label: '🌿 中草藥保健品', keyword: '寵物中草藥保健' },
    { label: '🍵 調理保健食品', keyword: '寵物調理保健' },
  ],
}

// urgency high 的專科不顯示保養建議
const HIGH_URGENCY_SKIP = new Set(['24H急診', '神經外科', '重症加護'])

function getSupplements(specialties: string[], urgency: string): Supplement[] {
  if (urgency === 'high') return []
  const seen = new Set<string>()
  const result: Supplement[] = []
  for (const s of specialties) {
    if (HIGH_URGENCY_SKIP.has(s)) continue
    for (const item of SUPPLEMENT_MAP[s] ?? []) {
      if (!seen.has(item.label)) {
        seen.add(item.label)
        result.push(item)
      }
    }
  }
  return result.slice(0, 5) // 最多顯示 5 個
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SymptomExplainer({ symptoms, clinicCount = -1 }: { symptoms: string[], clinicCount?: number }) {
  const [data, setData] = useState<ExplainerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (symptoms.length === 0) return
    setLoading(true)
    setError(false)
    setData(null)
    fetch('/api/symptom-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error)
        setData(res)
        // 如果目前診所為 0 且 AI 有回傳 specialties，自動用 specialties 重新搜尋
        if (clinicCount === 0 && res.specialties && res.specialties.length > 0) {
          const params = new URLSearchParams(window.location.search)
          params.set('q', res.specialties[0])
          window.location.href = `/search?${params.toString()}`
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [symptoms.join(',')])

  if (symptoms.length === 0) return null

  const urgencyColor = { low: '#4ade80', medium: '#f9bc60', high: '#e16162' }
  const urgencyLabel = { low: '可先觀察', medium: '建議近期就診', high: '建議立即就醫' }

  return (
    <div
      className="rounded-xl p-4 mb-5 border border-mist/20"
      style={{ background: 'rgba(0,30,29,0.6)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🩺</span>
        <p className="text-xs font-semibold text-mist/70 uppercase tracking-wide">AI 症狀分析</p>
        <span className="text-xs text-mist/30 ml-auto">僅供參考，請以獸醫診斷為準</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
          <p className="text-sm text-mist/60">正在分析症狀…</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <span>🔍</span>
          <p className="text-sm" style={{ color: 'rgba(171,209,198,0.6)' }}>
            AI 分析暫時無法使用，請直接參考下方診所列表，或稍後重新整理頁面再試。
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-2.5">
          {/* Summary + urgency */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-snow leading-relaxed">{data.summary}</p>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
              style={{
                background: `${urgencyColor[data.urgency]}20`,
                color: urgencyColor[data.urgency],
              }}
            >
              {urgencyLabel[data.urgency]}
            </span>
          </div>

          {/* Causes */}
          <div>
            <p className="text-xs text-mist/50 mb-1.5">可能原因</p>
            <div className="flex flex-wrap gap-1.5">
              {data.causes.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(171,209,198,0.12)', color: '#abd1c6' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Advice */}
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(171,209,198,0.7)' }}>
            💡 {data.advice}
          </p>

          {/* Specialties */}
          {data.specialties && data.specialties.length > 0 && (
            <div className="pt-2 border-t border-mist/10">
              <p className="text-xs text-mist/50 mb-1.5">建議就診專科</p>
              <div className="flex flex-wrap gap-1.5">
                {data.specialties.map((s: string) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: '#f9bc60', color: '#001e1d' }}
                  >
                    {s} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── 保養建議 ── */}
          {(() => {
            const supplements = getSupplements(data.specialties ?? [], data.urgency)
            if (supplements.length === 0) return null
            return (
              <div className="pt-2 border-t border-mist/10">
                <p className="text-xs text-mist/50 mb-1.5">🛒 居家保養建議</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {supplements.map((s) => (
                    <span key={s.label} className="inline-flex items-center gap-1">
                      <a
                        href={`https://shopee.tw/search?keyword=${encodeURIComponent(s.keyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(249,188,96,0.12)',
                          color: '#f9bc60',
                          border: '1px solid rgba(249,188,96,0.25)',
                        }}
                      >
                        {s.label} 蝦皮↗
                      </a>
                      <a
                        href={`https://ecshweb.pchome.com.tw/search/v3.3/?q=${encodeURIComponent(s.keyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(171,209,198,0.1)',
                          color: '#abd1c6',
                          border: '1px solid rgba(171,209,198,0.2)',
                        }}
                      >
                        PC↗
                      </a>
                    </span>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'rgba(171,209,198,0.35)' }}>
                  ⚠️ 保養品為輔助參考，無法取代獸醫診斷
                </p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
