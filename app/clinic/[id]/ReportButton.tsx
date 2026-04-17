'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const REASONS = ['電話有誤', '地址有誤', '已停業', '營業時間有誤', '缺少專科資料', '其他']

export default function ReportButton({
  clinicId,
  clinicName,
}: {
  clinicId: string
  clinicName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!reason) return
    setStatus('sending')
    const { error } = await supabase.from('reports').insert({
      clinic_id: clinicId,
      clinic_name: clinicName,
      reason,
      description: description.trim() || null,
    })
    setStatus(error ? 'error' : 'done')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs transition-colors hover:opacity-70"
        style={{ color: 'rgba(171,209,198,0.4)' }}
      >
        ⚑ 回報資料有誤
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-mist/20 p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-snow">回報資料有誤</p>
        <button
          onClick={() => { setOpen(false); setStatus('idle'); setReason(''); setDescription('') }}
          className="text-mist/40 hover:text-mist transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {status === 'done' ? (
        <p className="text-sm text-center py-3" style={{ color: '#4ade80' }}>
          ✓ 感謝回報，我們會盡快確認！
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={
                  reason === r
                    ? { background: '#f9bc60', color: '#001e1d' }
                    : { background: 'rgba(171,209,198,0.1)', color: '#abd1c6' }
                }
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="補充說明（選填）"
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-xs resize-none focus:outline-none mb-3"
            style={{
              background: 'rgba(171,209,198,0.08)',
              color: '#abd1c6',
              border: '1px solid rgba(171,209,198,0.2)',
            }}
          />
          <div className="flex items-center justify-between">
            {status === 'error' && (
              <p className="text-xs" style={{ color: '#e16162' }}>送出失敗，請稍後再試</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!reason || status === 'sending'}
              className="ml-auto px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: '#f9bc60', color: '#001e1d' }}
            >
              {status === 'sending' ? '送出中...' : '送出'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
