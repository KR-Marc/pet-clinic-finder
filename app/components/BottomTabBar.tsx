'use client'
import { Building2, Heart, Home, Siren } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomTabBar() {
  const pathname = usePathname()
  const tabs = [
    { href: '/', icon: Home, label: '首頁' },
    { href: '/search', icon: Building2, label: '診所' },
    { href: '/emergency', icon: Siren, label: '急診', color: '#e16162' },
    { href: '/favorites', icon: Heart, label: '收藏' },
  ]
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-mist/10"
      style={{ background: '#001e1d' }}>
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, icon: Icon, label, color }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
              style={{ color: active ? (color ?? '#f9bc60') : 'rgba(171,209,198,0.45)' }}>
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
