import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'

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

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  rating: number | null
  specialty_tags: string[]
}

export default async function EmergencyPage() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, specialty_tags')
    .eq('is_24h', true)
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

      {/* 診所列表 */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex flex-col gap-4">
          {(clinics as Clinic[])?.map((clinic) => (
            <Link
              key={clinic.id}
              href={`/clinic/${clinic.id}`}
              className="bg-sand rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base text-ink">{clinic.name}</h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#e16162', color: '#fff' }}
                  >
                    24H急診
                  </span>
                </div>
                {clinic.rating != null && (
                  <span className="text-sm font-bold shrink-0" style={{ color: '#f9bc60' }}>
                    ⭐ {clinic.rating}
                  </span>
                )}
              </div>

              <p className="text-xs mb-1" style={{ color: 'rgba(0,30,29,0.5)' }}>
                📍 {clinic.district}・{clinic.address}
              </p>

              <a
                href={`tel:${clinic.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 mt-2 mb-3 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#001e1d' }}
              >
                📞 {clinic.phone}
              </a>

              {clinic.specialty_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {clinic.specialty_tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-snow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
