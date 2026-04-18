'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="回到頂部"
      style={{
        position: 'fixed', bottom: 24, right: 20, zIndex: 50,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--color-clay-primary)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 4px 16px rgb(79 56 28 / 0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <ArrowUp size={18} />
    </button>
  )
}
