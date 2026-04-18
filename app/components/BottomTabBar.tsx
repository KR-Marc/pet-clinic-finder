'use client'
import { Building2, Heart, Home, Siren } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomTabBar() {
  const pathname = usePathname()
  const tabs = [
    { href: '/', icon: Home, label: '首頁' },
    { href: '/search', icon: Building2, label: '診所' },
    { href: '/emergency', icon: Siren, label: '急診', activeColor: 'var(--color-clay-danger)' },
    { href: '/favorites', icon: Heart, label: '收藏' },
  ]
  return (
    <nav
      style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--color-clay-surface)',
        borderTop: '1px solid var(--color-clay-border)',
      }}
      className="bottom-tab-bar"
    >
      <div style={{ display: 'flex', alignItems: 'stretch', height: 64 }}>
        {tabs.map(({ href, icon: Icon, label, activeColor }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          const color = active ? (activeColor ?? 'var(--color-clay-primary)') : 'var(--color-clay-text-mute)'
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                color, textDecoration: 'none', fontSize: 11, fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
