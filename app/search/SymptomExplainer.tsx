'use client'

import Link from 'next/link'
import { Activity, AlertTriangle, Bone, Building2, Droplets, Leaf, Search, Stethoscope } from 'lucide-react'
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
export default function SymptomExplainer({ symptoms, onSpecialties }: { symptoms: string[], onSpecialties?: (tags: string[]) => void }) {
  const [data, setData] = useState<ExplainerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    if (symptoms.length === 0) return
    setLoading(true)
    setError(false)
    setData(null)
    setLoadingStep(0)
    const t1 = setTimeout(() => setLoadingStep(1), 800)
    const t2 = setTimeout(() => setLoadingStep(2), 2500)
    fetch('/api/symptom-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error)
        setData(res)
        // 把 AI 分析的 specialties 回傳給父元件
        if (res.specialties && res.specialties.length > 0 && onSpecialties) {
          onSpecialties(res.specialties)
        }
      })
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false)
        clearTimeout(t1)
        clearTimeout(t2)
      })
  }, [symptoms.join(',')])

  if (symptoms.length === 0) return null

  const urgencyColor = {
    low: 'var(--color-clay-sage)',
    medium: 'var(--color-clay-primary)',
    high: 'var(--color-clay-danger)',
  }
  const urgencyBg = {
    low: 'var(--color-clay-sage-soft)',
    medium: 'var(--color-clay-primary-soft)',
    high: 'var(--color-clay-danger-soft)',
  }
  const urgencyLabel = { low: '可先觀察', medium: '建議近期就診', high: '建議立即就醫' }

  return (
    <div style={{
      background: 'var(--color-clay-surface)',
      border: '1px solid var(--color-clay-border)',
      borderRadius: 14, padding: 16, marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{ fontSize: 16 }}>🩺</span>
        <p style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--color-clay-text-mute)',
          textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
        }}>AI 症狀分析</p>
        <span style={{
          fontSize: 11, color: 'var(--color-clay-text-mute)',
          marginLeft: 'auto',
        }}>僅供參考，請以獸醫診斷為準</span>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--color-clay-primary)',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <p style={{ fontSize: 13, color: 'var(--color-clay-text-soft)', margin: 0 }}>
            {loadingStep === 0 && '正在理解症狀描述…'}
            {loadingStep === 1 && '正在比對可能病因…'}
            {loadingStep === 2 && '正在尋找適合的專科…'}
          </p>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={14} style={{ color: 'var(--color-clay-text-mute)' }} />
          <p style={{ fontSize: 13, color: 'var(--color-clay-text-mute)', margin: 0 }}>
            AI 分析暫時無法使用，請直接參考下方診所列表，或稍後重新整理頁面再試。
          </p>
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary + urgency */}
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
            <p style={{
              fontSize: 14, fontWeight: 500,
              color: 'var(--color-clay-text)',
              lineHeight: 1.6, margin: 0,
            }}>{data.summary}</p>
            <span style={{
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: urgencyBg[data.urgency],
              color: urgencyColor[data.urgency],
            }}>
              {urgencyLabel[data.urgency]}
            </span>
          </div>

          {/* Causes */}
          <div>
            <p style={{
              fontSize: 11, color: 'var(--color-clay-text-mute)',
              marginBottom: 6, marginTop: 0, fontWeight: 700, letterSpacing: 1,
            }}>可能原因</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.causes.map((c) => (
                <span key={c} style={{
                  padding: '4px 10px', borderRadius: 999,
                  fontSize: 12, fontWeight: 500,
                  background: 'var(--color-clay-section)',
                  color: 'var(--color-clay-text-soft)',
                  border: '1px solid var(--color-clay-border)',
                }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Advice */}
          <p style={{
            fontSize: 12, lineHeight: 1.6,
            color: 'var(--color-clay-text-soft)',
            margin: 0,
          }}>
            💡 {data.advice}
          </p>

          {/* Specialties */}
          {data.specialties && data.specialties.length > 0 && (
            <div style={{
              paddingTop: 12,
              borderTop: '1px solid var(--color-clay-border)',
            }}>
              <p style={{
                fontSize: 11, color: 'var(--color-clay-text-mute)',
                marginBottom: 8, marginTop: 0, fontWeight: 700, letterSpacing: 1,
              }}>建議就診專科</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.specialties.map((s: string) => (
                  <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} style={{
                    padding: '5px 12px', borderRadius: 999,
                    fontSize: 12, fontWeight: 700,
                    background: 'var(--color-clay-primary)',
                    color: '#fff', textDecoration: 'none',
                  }}>
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
              <div style={{
                paddingTop: 12,
                borderTop: '1px solid var(--color-clay-border)',
              }}>
                <p style={{
                  fontSize: 11, color: 'var(--color-clay-text-mute)',
                  marginBottom: 8, marginTop: 0, fontWeight: 700, letterSpacing: 1,
                }}>🛒 居家保養建議</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {supplements.map((s) => (
                    <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <a
                        href={`https://shopee.tw/search?keyword=${encodeURIComponent(s.keyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '5px 10px', borderRadius: 999,
                          fontSize: 11, fontWeight: 500,
                          background: 'var(--color-clay-tag-bg)',
                          color: 'var(--color-clay-tag-text)',
                          border: '1px solid var(--color-clay-border)',
                          textDecoration: 'none',
                        }}
                      >
                        {s.label} 蝦皮↗
                      </a>
                      <a
                        href={`https://ecshweb.pchome.com.tw/search/v3.3/?q=${encodeURIComponent(s.keyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '4px 8px', borderRadius: 999,
                          fontSize: 11, fontWeight: 500,
                          background: 'var(--color-clay-chip-bg)',
                          color: 'var(--color-clay-chip-text)',
                          border: '1px solid var(--color-clay-chip-border)',
                          textDecoration: 'none',
                        }}
                      >
                        PC↗
                      </a>
                    </span>
                  ))}
                </div>
                <p style={{
                  fontSize: 11, color: 'var(--color-clay-text-mute)',
                  margin: 0, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <AlertTriangle size={12} /> 保養品為輔助參考，無法取代獸醫診斷
                </p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
