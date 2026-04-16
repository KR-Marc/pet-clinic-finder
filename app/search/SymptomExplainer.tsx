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

export default function SymptomExplainer({ symptoms }: { symptoms: string[] }) {
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
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [symptoms.join(',')])

  if (symptoms.length === 0) return null

  const urgencyColor = {
    low: '#4ade80',
    medium: '#f9bc60',
    high: '#e16162',
  }
  const urgencyLabel = {
    low: '可先觀察',
    medium: '建議近期就診',
    high: '建議立即就醫',
  }

  return (
    <div
      className="rounded-xl p-4 mb-5 border border-mist/20"
      style={{ background: 'rgba(0,30,29,0.6)' }}
    >
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
        <p className="text-sm text-mist/50">暫時無法分析，請直接參考下方診所列表。</p>
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
            <div className="mt-2 pt-2 border-t border-mist/10">
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
        </div>
      )}
    </div>
  )
}
