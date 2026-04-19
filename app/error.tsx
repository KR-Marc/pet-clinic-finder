'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-clay-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: 48, fontWeight: 800, lineHeight: 1,
        color: 'var(--color-clay-danger)', marginBottom: 8,
      }}>🐾</div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: 'var(--color-clay-text)', marginBottom: 8,
      }}>發生了一些問題</div>
      <div style={{
        fontSize: 14, color: 'var(--color-clay-text-soft)', marginBottom: 32,
      }}>請重新整理，或回到首頁繼續使用</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            background: 'var(--color-clay-primary)', color: '#fff',
            padding: '12px 24px', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            border: 'none', fontFamily: 'inherit',
          }}
        >重新整理</button>
        <a href="/" style={{
          background: 'var(--color-clay-surface)',
          border: '1px solid var(--color-clay-border)',
          color: 'var(--color-clay-text)',
          padding: '12px 24px', borderRadius: 12,
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center',
        }}>回到首頁</a>
      </div>
    </div>
  )
}
