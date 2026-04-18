'use client'
import { Flag } from 'lucide-react'
import { useState } from 'react'

export default function ReportButton({
  clinicId, clinicName,
}: { clinicId: string; clinicName: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReport = async () => {
    if (loading || submitted) return
    const reason = window.prompt(`回報「${clinicName}」的資料問題：`)
    if (!reason?.trim()) return
    setLoading(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_id: clinicId, reason: reason.trim() }),
      })
      setSubmitted(true)
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReport}
      disabled={loading || submitted}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '11px 18px', borderRadius: 10, width: '100%',
        background: 'var(--color-clay-surface)',
        color: submitted
          ? 'var(--color-clay-sage)'
          : 'var(--color-clay-text-soft)',
        border: `1px solid ${submitted ? 'var(--color-clay-sage)' : 'var(--color-clay-border)'}`,
        fontSize: 13, fontWeight: 600, cursor: loading || submitted ? 'default' : 'pointer',
        fontFamily: 'inherit',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <Flag size={14} />
      {submitted ? '已收到回報，謝謝' : loading ? '送出中...' : '回報資料有誤'}
    </button>
  )
}
