import Link from 'next/link'
import { ClayNav, ClayFooter } from '@/app/components/clay'
import MobileTopBar from '@/app/components/clay/MobileTopBar'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-clay-bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="hide-on-mobile">
        <ClayNav current="" />
      </div>
      <MobileTopBar title="找不到頁面" back={false} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 72, fontWeight: 800, lineHeight: 1,
          color: 'var(--color-clay-primary)', marginBottom: 8,
          letterSpacing: -2,
        }}>404</div>
        <div style={{
          fontSize: 20, fontWeight: 700,
          color: 'var(--color-clay-text)', marginBottom: 8,
        }}>找不到這個頁面</div>
        <div style={{
          fontSize: 14, color: 'var(--color-clay-text-soft)', marginBottom: 32,
        }}>這個頁面可能已移除或網址輸入錯誤</div>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--color-clay-primary)', color: '#fff',
          padding: '12px 28px', borderRadius: 12,
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
        }}>回到首頁</Link>
      </div>

      <ClayFooter />
    </div>
  )
}
