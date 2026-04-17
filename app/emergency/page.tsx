import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import ClinicList from './ClinicList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '台北寵物24H急診動物醫院 | 寵物專科診所搜尋',
  description: '台北市24小時寵物急診動物醫院完整清單，提供即時電話與地址，緊急時快速找到最近的急診動物醫院。',
  openGraph: {
    title: '台北寵物24H急診動物醫院',
    description: '台北市24小時寵物急診動物醫院完整清單，緊急時快速找到最近的急診動物醫院。',
    url: 'https://pet-clinic-finder.vercel.app/emergency',
    siteName: '台北寵物專科診所搜尋',
    locale: 'zh_TW',
    type: 'website',
  },
}

export default async function EmergencyPage() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, specialty_tags, lat, lng')
    .overlaps('specialty_tags', ['24H急診'])
    .order('rating', { ascending: false })

  return (
    <main className="min-h-screen bg-brand">

      {/* Nav */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm transition-colors">
            🐾 首頁
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-ink border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#e16162', color: '#fff' }}
          >
            🚨 緊急資訊
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">
            台北市 24H 急診動物醫院
          </h1>
          <p className="text-mist/70 text-sm leading-relaxed mb-2">
            以下診所提供 24 小時急診服務，遇到寵物緊急狀況時請直接撥打電話確認。
          </p>
          <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
            共 {clinics?.length ?? 0} 間全天候急診院所
          </p>
        </div>
      </div>

      {/* 急診提示 */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div
          className="rounded-xl p-4 mb-6 border border-mist/20"
          style={{ background: 'rgba(225,97,98,0.1)' }}
        >
          <p className="text-sm text-snow font-semibold mb-1">⚠️ 前往前請先來電確認</p>
          <p className="text-xs text-mist/70 leading-relaxed">
            急診服務可能因醫師排班而有所調整，建議出發前先致電確認是否有急診醫師值班。
          </p>
        </div>
      </div>

      {/* 診所列表（客戶端依距離重排） */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <ClinicList clinics={(clinics ?? []) as any} />
      </div>
    </main>
  )
}
