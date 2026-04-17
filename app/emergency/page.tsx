import { AlertTriangle, Car, Clock, Map, MapPin, PawPrint, Phone, Star } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import UberButtonClient from './UberButtonClient'

interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  rating: number | null
  review_count: number | null
  specialty_tags: string[]
  opening_hours: string[] | null
  is_24h: boolean
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getTodayHours(hours: string[] | null): string | null {
  if (!hours?.length) return null
  const today = WEEKDAYS[new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).getDay()]
  const entry = hours.find(h => h.startsWith(today))
  if (!entry) return null
  const idx = entry.indexOf(': ')
  return idx >= 0 ? entry.slice(idx + 2) : null
}

function hasReviewWarning(c: Clinic): boolean {
  return (c.review_count ?? 0) > 2000 && (c.rating ?? 0) >= 4.0
}

async function fetchEmergencyClinics(): Promise<Clinic[]> {
  const { data } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, review_count, specialty_tags, opening_hours, is_24h')
    .contains('specialty_tags', ['24H急診'])
    .order('rating', { ascending: false })

  const clinics = (data ?? []) as Clinic[]
  return clinics.sort((a, b) => {
    const aWarn = hasReviewWarning(a) ? 1 : 0
    const bWarn = hasReviewWarning(b) ? 1 : 0
    if (aWarn !== bWarn) return aWarn - bWarn
    return (b.rating ?? 0) - (a.rating ?? 0)
  })
}

export default async function EmergencyPage() {
  const clinics = await fetchEmergencyClinics()

  return (
    <main className="min-h-screen bg-brand">
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-mist/50 hover:text-snow text-sm">
            <PawPrint size={14} className="inline mr-1" />首頁
          </Link>
        </div>
      </div>

      <div className="border-b border-mist/10" style={{ background: 'linear-gradient(180deg, #1a0000 0%, #001e1d 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: '#e16162', color: '#fff' }}>🚨 緊急資訊</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">台北市 24H 急診動物醫院</h1>
          <p className="text-mist/70 text-sm mb-2">遇到寵物緊急狀況時請直接撥打電話確認。</p>
          <p className="text-xs font-semibold" style={{ color: '#f9bc60' }}>
            共 {clinics.length} 間全天候急診院所
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="rounded-xl p-4 mb-6 border border-mist/20"
          style={{ background: 'rgba(225,97,98,0.1)' }}>
          <p className="text-sm text-snow font-semibold mb-1">⚠️ 前往前請先來電確認</p>
          <p className="text-xs text-mist/70">急診服務可能因醫師排班而有所調整，建議出發前先致電確認。</p>
        </div>

        <div className="flex flex-col gap-4">
          {clinics.map(c => {
            const hours = getTodayHours(c.opening_hours)
            const warn = hasReviewWarning(c)
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.district + c.address)}&travelmode=driving`

            return (
              <div key={c.id} className="bg-sand rounded-xl p-5 shadow-sm">
                {warn && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3"
                    style={{ background: 'rgba(249,188,96,0.18)', color: '#7a5a00', border: '1px solid rgba(249,188,96,0.4)' }}>
                    <AlertTriangle size={14} />
                    <span>此診所評論數量較多，建議參考多方資訊後再決定就診</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/clinic/${c.id}`} className="font-bold text-base text-ink hover:underline">{c.name}</Link>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: '#e16162', color: '#fff' }}>24H急診</span>
                  </div>
                  {c.rating != null && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-sm font-bold" style={{ color: '#f9bc60' }}>
                        <Star size={13} className="inline mr-0.5 fill-gold text-gold" />{c.rating}
                      </span>
                      {c.review_count != null && (
                        <span className="text-xs" style={{ color: 'rgba(0,30,29,0.45)' }}>
                          {c.review_count.toLocaleString()} 則
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs mb-1" style={{ color: 'rgba(0,30,29,0.5)' }}>
                  <MapPin size={13} className="inline mr-0.5" />{c.district}・{c.address}
                </p>
                {hours && (
                  <p className="text-xs mb-3 font-medium"
                    style={{ color: hours === '休息' ? '#e16162' : '#16a34a' }}>
                    <Clock size={13} className="inline mr-0.5" />今日 {hours}
                  </p>
                )}
                <div className="flex gap-2 mb-2">
                  <a href={`tel:${c.phone}`}
                    className="flex-1 py-3 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #e16162 0%, #c0392b 100%)', color: 'white' }}>
                    <Phone size={16} />立即撥打
                  </a>
                  <a href={navUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-1.5"
                    style={{ background: '#2980b9', color: 'white' }}>
                    <Map size={16} />導航前往
                  </a>
                </div>
                <UberButtonClient
                  clinicName={c.name}
                  district={c.district}
                  address={c.address}
                />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
