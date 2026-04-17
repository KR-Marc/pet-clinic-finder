import type { Metadata } from 'next'
import { MapPin, Siren } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DistrictMap from './DistrictMap'
import ClinicCard from './ClinicCard'

// ── Static district data ─────────────────────────────────────────────────────
export const DISTRICTS: Record<
  string,
  {
    label: string
    description: string
    commonSymptoms: string[]
    features: string[]
    lat: number
    lng: number
  }
> = {
  大安區: {
    label: '大安區',
    description: '大安區是台北市寵物診所最密集的行政區之一，匯集多家專科動物醫院，提供犬貓牙科、腫瘤科、眼科等高階醫療服務。',
    commonSymptoms: ['皮膚搔癢', '牙結石', '眼睛分泌物', '腫瘤檢查', '骨折外傷'],
    features: ['多家專科診所', '鄰近信義商圈', '交通便利'],
    lat: 25.026, lng: 121.543,
  },
  信義區: {
    label: '信義區',
    description: '信義區商業繁榮，診所多提供24H急診服務，適合緊急就診。部分診所具備高階影像設備。',
    commonSymptoms: ['急診外傷', '嘔吐腹瀉', '呼吸困難', '中毒緊急'],
    features: ['24H急診選擇多', '捷運直達', '影像設備完善'],
    lat: 25.033, lng: 121.564,
  },
  中山區: {
    label: '中山區',
    description: '中山區診所分布均勻，以綜合型動物醫院為主，同時有部分眼科與牙科專科診所。',
    commonSymptoms: ['預防接種', '結紮絕育', '定期健檢', '眼睛問題'],
    features: ['交通便利', '診所分布廣', '預約彈性高'],
    lat: 25.063, lng: 121.524,
  },
  內湖區: {
    label: '內湖區',
    description: '內湖區是科技重鎮，診所服務品質穩定，部分具備先進的腫瘤科與骨科設備。',
    commonSymptoms: ['骨科問題', '腫瘤篩查', '心臟檢查', '關節退化'],
    features: ['骨科腫瘤強項', '停車方便', '服務品質穩定'],
    lat: 25.063, lng: 121.588,
  },
  士林區: {
    label: '士林區',
    description: '士林區地廣人多，診所涵蓋從夜市周邊到天母豪宅區，服務層次多元，天母一帶有多家高端動物醫院。',
    commonSymptoms: ['腸胃問題', '皮膚疾病', '外傷處理', '高齡照護'],
    features: ['天母高端診所', '地域廣闊', '服務多元'],
    lat: 25.094, lng: 121.527,
  },
  文山區: {
    label: '文山區',
    description: '文山區以木柵、景美為主，診所多為社區型綜合動物醫院，親切便民，費用相對親民。',
    commonSymptoms: ['預防保健', '絕育手術', '耳朵感染', '寄生蟲'],
    features: ['社區型診所', '費用親民', '熟客關係佳'],
    lat: 24.990, lng: 121.567,
  },
  松山區: {
    label: '松山區',
    description: '松山區緊鄰南港、信義，診所集中在復興北路沿線，以全科動物醫院為主。',
    commonSymptoms: ['定期健檢', '疫苗接種', '牙齒問題', '皮膚炎'],
    features: ['捷運沿線分布', '全科診所為主', '預約方便'],
    lat: 25.050, lng: 121.577,
  },
  中正區: {
    label: '中正區',
    description: '中正區位居台北市心臟地帶，診所數量適中，部分具備中獸醫服務，適合重視傳統調理的飼主。',
    commonSymptoms: ['中獸醫調理', '慢性病管理', '老年保健', '針灸復健'],
    features: ['中獸醫特色', '市中心位置', '老字號診所'],
    lat: 25.032, lng: 121.520,
  },
  萬華區: {
    label: '萬華區',
    description: '萬華區歷史悠久，診所多為老字號社區動物醫院，服務在地飼主多年，費用實惠。',
    commonSymptoms: ['基礎看診', '緊急外傷', '發燒感冒', '寄生蟲防治'],
    features: ['老字號診所', '費用實惠', '社區口碑佳'],
    lat: 25.035, lng: 121.498,
  },
  北投區: {
    label: '北投區',
    description: '北投區涵蓋溫泉鄉與關渡平原，診所分布較稀疏但各具特色，服務在地長期飼主。',
    commonSymptoms: ['基礎健診', '疫苗', '驅蟲', '一般外科'],
    features: ['在地特色診所', '交通需自備', '口碑型服務'],
    lat: 25.132, lng: 121.501,
  },
  南港區: {
    label: '南港區',
    description: '南港區近年快速發展，診所設備新穎，部分具備高階影像診斷及腫瘤科服務。',
    commonSymptoms: ['腫瘤篩查', '高階影像', '內科診療', '手術治療'],
    features: ['設備新穎', '近南港展覽館', '高階診療'],
    lat: 25.055, lng: 121.607,
  },
  大同區: {
    label: '大同區',
    description: '大同區鄰近大稻埕、迪化街，社區型診所為主，服務親切，適合日常保健與一般診療。',
    commonSymptoms: ['日常保健', '疫苗接種', '輕微外傷', '腸胃照護'],
    features: ['社區型診所', '親切服務', '日常保健便利'],
    lat: 25.063, lng: 121.512,
  },
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Clinic {
  id: string
  name: string
  district: string
  address: string
  phone: string
  specialty_tags: string[]
  is_24h: boolean
  pet_types: string[]
  rating: number | null
  review_count: number | null
}

// ── Static params ────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return Object.keys(DISTRICTS).map((name) => ({ name }))
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  const info = DISTRICTS[decoded]

  if (!info) return { title: '行政區未找到 | 台北寵物專科診所搜尋' }

  const title = `${decoded}寵物診所推薦 | 台北寵物專科診所搜尋`
  const description = info.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://pet-clinic-finder.vercel.app/district/${name}`,
      siteName: '台北寵物專科診所搜尋',
      locale: 'zh_TW',
      type: 'website',
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DistrictPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  const info = DISTRICTS[decoded]

  if (!info) notFound()

  const { data } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, specialty_tags, is_24h, pet_types, rating, review_count')
    .eq('district', decoded)
    .order('rating', { ascending: false, nullsFirst: false })

  const clinics = (data ?? []) as Clinic[]
  const clinics24h = clinics.filter((c) => c.is_24h)
  const allTags = [...new Set(clinics.flatMap((c) => c.specialty_tags))].sort()

  return (
    <main className="min-h-screen bg-brand">
      {/* ── Nav ── */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-mist hover:text-snow text-sm font-medium whitespace-nowrap transition-colors shrink-0"
          >
            ← 回首頁
          </Link>
          <span className="text-mist/30 shrink-0">|</span>
          <span className="text-snow text-sm font-medium truncate">
            <MapPin size={14} className="inline mr-1" /> {decoded} 診所
          </span>
          <span className="text-mist/30 shrink-0 hidden sm:inline">|</span>
          <Link
            href="/emergency"
            className="text-xs font-bold transition-colors shrink-0 hover:opacity-80 hidden sm:inline"
            style={{ color: '#e16162' }}
          >
            <Siren size={14} className="inline mr-1" /> 急診
          </Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="bg-brand border-b border-mist/10">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(249,188,96,0.15)', color: '#f9bc60', border: '1px solid rgba(249,188,96,0.25)' }}
            >
              台北市
            </span>
            {clinics24h.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-coral text-snow">
                {clinics24h.length} 家 24H 急診
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3 leading-snug">
            {decoded}寵物診所
          </h1>
          <p className="text-sm text-mist/70 leading-relaxed max-w-2xl mb-5">
            {info.description}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-snow">{clinics.length}</span>
              <span className="text-sm text-mist/60">家診所</span>
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-snow">{allTags.length}</span>
                <span className="text-sm text-mist/60">種專科</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── Map + Features ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
            <DistrictMap
              districtName={decoded}
              lat={info.lat}
              lng={info.lng}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-sand rounded-xl p-5">
              <h2 className="text-sm font-bold text-ink mb-3">🩺 本區常見就診原因</h2>
              <div className="flex flex-wrap gap-2">
                {info.commonSymptoms.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}&district=${encodeURIComponent(decoded)}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand text-snow hover:bg-mist/20 transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-sand rounded-xl p-5">
              <h2 className="text-sm font-bold text-ink mb-3">✨ 本區特色</h2>
              <ul className="space-y-2">
                {info.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/80">
                    <span style={{ color: '#f9bc60' }}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={`/search?district=${encodeURIComponent(decoded)}`}
              className="block w-full py-3 rounded-xl text-center font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#f9bc60', color: '#001e1d' }}
            >
              搜尋{decoded}所有診所 →
            </Link>
          </div>
        </div>

        {/* ── Specialty tags ── */}
        {allTags.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-snow mb-3">本區診所專科科別</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}&district=${encodeURIComponent(decoded)}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-ink text-mist hover:bg-mist/20 transition-colors border border-mist/10"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Clinic list ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-snow">
              {decoded}診所列表
              <span className="ml-2 text-sm font-normal text-mist/50">
                （共 {clinics.length} 家）
              </span>
            </h2>
          </div>

          {clinics.length === 0 ? (
            <div className="rounded-xl border border-mist/20 px-6 py-8 text-center">
              <p className="text-sm text-mist/60 mb-4">此區域暫無診所資料</p>
              <Link
                href="/search"
                className="inline-block px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#f9bc60', color: '#001e1d' }}
              >
                搜尋全台北診所 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>

        {/* ── Other districts ── */}
        <div>
          <h2 className="text-base font-bold text-snow mb-4">其他行政區</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(DISTRICTS)
              .filter((d) => d !== decoded)
              .map((d) => (
                <Link
                  key={d}
                  href={`/district/${encodeURIComponent(d)}`}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-ink text-mist hover:bg-mist/20 transition-colors border border-mist/10"
                >
                  {d}
                </Link>
              ))}
          </div>
        </div>

      </div>
    </main>
  )
}
