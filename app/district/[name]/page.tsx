import type { Metadata } from 'next'
import { MapPin, Siren } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ClayNav, ClayFooter } from '@/app/components/clay'
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
    <main style={{ minHeight: '100vh', background: 'var(--color-clay-bg)', color: 'var(--color-clay-text)' }}>
      <ClayNav />

      {/* Hero */}
      <div style={{
        background: 'var(--color-clay-hero)',
        borderBottom: '1px solid var(--color-clay-border)',
        padding: '48px 24px 36px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -100, top: -80, width: 380, height: 380,
          borderRadius: '50%', background: 'var(--color-clay-hero-accent)',
          filter: 'blur(50px)', opacity: 0.55, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, marginBottom: 20,
            color: 'var(--color-clay-text-soft)',
          }}>
            <Link href="/" style={{ color: 'var(--color-clay-primary)', textDecoration: 'none', fontWeight: 600 }}>
              首頁
            </Link>
            <span style={{ color: 'var(--color-clay-text-mute)' }}>/</span>
            <span>行政區</span>
            <span style={{ color: 'var(--color-clay-text-mute)' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--color-clay-text)' }}>{decoded}</span>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700,
              background: 'var(--color-clay-primary-soft)',
              color: 'var(--color-clay-primary)',
              padding: '5px 12px', borderRadius: 999,
            }}>
              <MapPin size={12} /> 台北市
            </span>
            {clinics24h.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700,
                background: 'var(--color-clay-danger-soft)',
                color: 'var(--color-clay-danger)',
                padding: '5px 12px', borderRadius: 999,
              }}>
                {clinics24h.length} 家 24H 急診
              </span>
            )}
          </div>

          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800,
            letterSpacing: -0.8, margin: '0 0 10px',
            color: 'var(--color-clay-text)',
          }}>
            {decoded}寵物診所
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--color-clay-text-soft)',
            margin: '0 0 20px', lineHeight: 1.7, maxWidth: 600,
          }}>
            {info.description}
          </p>

          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-clay-text)' }}>{clinics.length}</span>
              <span style={{ fontSize: 13, color: 'var(--color-clay-text-mute)' }}>家診所</span>
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-clay-text)' }}>{allTags.length}</span>
                <span style={{ fontSize: 13, color: 'var(--color-clay-text-mute)' }}>種專科</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 56px' }}>

        {/* Map + Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20, marginBottom: 32,
        }}>
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            border: '1px solid var(--color-clay-border)',
            minHeight: 280,
          }}>
            <DistrictMap
              districtName={decoded}
              lat={info.lat}
              lng={info.lng}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Common symptoms */}
            <div style={{
              background: 'var(--color-clay-surface)',
              border: '1px solid var(--color-clay-border)',
              borderRadius: 14, padding: 20,
            }}>
              <h2 style={{
                fontSize: 13, fontWeight: 700, margin: '0 0 12px',
                color: 'var(--color-clay-text)',
              }}>
                🩺 本區常見就診原因
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {info.commonSymptoms.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}&district=${encodeURIComponent(decoded)}`}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '5px 12px', borderRadius: 999,
                      background: 'var(--color-clay-section)',
                      color: 'var(--color-clay-text-soft)',
                      textDecoration: 'none',
                      border: '1px solid var(--color-clay-border)',
                    }}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{
              background: 'var(--color-clay-surface)',
              border: '1px solid var(--color-clay-border)',
              borderRadius: 14, padding: 20,
            }}>
              <h2 style={{
                fontSize: 13, fontWeight: 700, margin: '0 0 12px',
                color: 'var(--color-clay-text)',
              }}>
                ✨ 本區特色
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {info.features.map((f) => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'var(--color-clay-text-soft)',
                  }}>
                    <span style={{ color: 'var(--color-clay-primary)', fontWeight: 700 }}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={`/search?district=${encodeURIComponent(decoded)}`}
              style={{
                display: 'block', textAlign: 'center',
                padding: '13px 0', borderRadius: 12,
                background: 'var(--color-clay-primary)', color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}
            >
              搜尋{decoded}所有診所 →
            </Link>
          </div>
        </div>

        {/* Specialty tags */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 15, fontWeight: 700, margin: '0 0 12px',
              color: 'var(--color-clay-text)',
            }}>
              本區診所專科科別
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}&district=${encodeURIComponent(decoded)}`}
                  style={{
                    fontSize: 12, fontWeight: 600,
                    padding: '5px 12px', borderRadius: 999,
                    background: 'var(--color-clay-tag-bg)',
                    color: 'var(--color-clay-tag-text)',
                    textDecoration: 'none',
                    border: '1px solid var(--color-clay-border)',
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Clinic list */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--color-clay-text)' }}>
              {decoded}診所列表
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--color-clay-text-mute)' }}>
                （共 {clinics.length} 家）
              </span>
            </h2>
          </div>

          {clinics.length === 0 ? (
            <div style={{
              border: '1px dashed var(--color-clay-border)',
              borderRadius: 14, padding: '32px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: 'var(--color-clay-text-mute)', margin: '0 0 16px' }}>
                此區域暫無診所資料
              </p>
              <Link
                href="/search"
                style={{
                  display: 'inline-block', padding: '10px 22px', borderRadius: 999,
                  background: 'var(--color-clay-primary)', color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                搜尋全台北診所 →
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>

        {/* Emergency link */}
        <div style={{
          background: 'var(--color-clay-danger-soft)',
          border: '1px solid var(--color-clay-danger)',
          borderRadius: 14, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Siren size={18} style={{ color: 'var(--color-clay-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-clay-danger)' }}>
              需要緊急看診？
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-clay-text-soft)' }}>
              查看台北市所有 24H 急診動物醫院
            </span>
          </div>
          <Link
            href="/emergency"
            style={{
              display: 'inline-block', padding: '9px 18px', borderRadius: 10,
              background: 'var(--color-clay-danger)', color: '#fff',
              fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0,
            }}
          >
            前往急診頁面 →
          </Link>
        </div>

        {/* Other districts */}
        <div>
          <h2 style={{
            fontSize: 15, fontWeight: 700, margin: '0 0 12px',
            color: 'var(--color-clay-text)',
          }}>
            其他行政區
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {Object.keys(DISTRICTS)
              .filter((d) => d !== decoded)
              .map((d) => (
                <Link
                  key={d}
                  href={`/district/${encodeURIComponent(d)}`}
                  style={{
                    fontSize: 13, fontWeight: 600,
                    padding: '6px 14px', borderRadius: 999,
                    background: 'var(--color-clay-surface)',
                    color: 'var(--color-clay-text-soft)',
                    textDecoration: 'none',
                    border: '1px solid var(--color-clay-border)',
                  }}
                >
                  {d}
                </Link>
              ))}
          </div>
        </div>

      </div>

      <ClayFooter />
    </main>
  )
}
