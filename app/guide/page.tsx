import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '寵物症狀對照表 | 台北寵物專科診所搜尋',
  description: '貓狗常見症狀與對應專科對照表，口臭找牙科、眼屎多找眼科、抽搐找神經科，快速找到台北市最適合的動物醫院。',
  openGraph: {
    title: '寵物症狀對照表',
    description: '貓狗常見症狀與對應專科對照表，快速找到最適合的動物醫院。',
    url: 'https://pet-clinic-finder.vercel.app/guide',
    siteName: '台北寵物專科診所搜尋',
    locale: 'zh_TW',
    type: 'website',
  },
}

const GUIDES = [
  {
    specialty: '牙科',
    icon: '🦷',
    symptoms: ['口臭', '流口水', '牙齦紅腫', '掉牙', '不肯吃東西', '嘴巴有味道'],
    description: '寵物牙齒問題常被忽略，口臭是最常見的早期訊號。建議每年定期洗牙檢查。',
    q: '牙科',
  },
  {
    specialty: '眼科',
    icon: '👁️',
    symptoms: ['眼屎多', '眼睛紅', '白內障', '眼睛混濁', '一直眨眼', '眼睛腫'],
    description: '眼部問題若未及時處理可能影響視力，發現異常應盡早就診。',
    q: '眼科',
  },
  {
    specialty: '心臟科',
    icon: '❤️',
    symptoms: ['咳嗽', '容易喘', '心雜音', '運動不耐', '昏厥', '肚子變大'],
    description: '心臟病在老年犬貓中很常見，定期心臟超音波可早期發現。',
    q: '心臟科',
  },
  {
    specialty: '骨科',
    icon: '🦴',
    symptoms: ['跛行', '骨折', '不肯走路', '關節腫大', '爬樓梯困難', '腳腳無力'],
    description: '骨關節問題影響生活品質，及早診斷可避免病情惡化。',
    q: '骨科',
  },
  {
    specialty: '腫瘤科',
    icon: '🎗️',
    symptoms: ['身上有腫塊', '腫塊快速增大', '體重下降', '食慾不振', '化療追蹤'],
    description: '腫塊不一定是惡性，但發現後應盡快請獸醫評估，早期治療效果最好。',
    q: '腫瘤科',
  },
  {
    specialty: '皮膚科',
    icon: '🌿',
    symptoms: ['一直抓', '掉毛', '皮膚紅疹', '皮膚乾燥', '有皮屑', '皮膚有異味'],
    description: '皮膚問題原因多樣，可能是過敏、感染或荷爾蒙異常，需專科鑑別診斷。',
    q: '皮膚科',
  },
  {
    specialty: '神經科',
    icon: '🧠',
    symptoms: ['抽搐', '癲癇', '走路歪斜', '突然倒下', '頭歪一邊', '後腳無力'],
    description: '神經症狀出現時應盡快就醫，部分症狀可能危及生命。',
    q: '抽搐',
  },
  {
    specialty: '外科',
    icon: '🔪',
    symptoms: ['腫塊切除', '外傷縫合', '結紮絕育', '腸胃異物', '膀胱結石', '腫瘤切除'],
    description: '外科手術是許多疾病的根本治療方式，術前評估與術後照護同樣重要。',
    q: '外科',
  },
  {
    specialty: '泌尿科',
    icon: '💧',
    symptoms: ['血尿', '頻尿', '排尿困難', '尿結石', '膀胱炎', '腎臟病'],
    description: '泌尿道問題在貓咪中尤其常見，公貓尿道阻塞是緊急狀況需立即就醫。',
    q: '泌尿科',
  },
  {
    specialty: '腎臟科',
    icon: '🫘',
    symptoms: ['多喝多尿', '食慾下降', '嘔吐', '體重減輕', '慢性腎病', '腎衰竭'],
    description: '慢性腎病是老年貓最常見的疾病之一，早期診斷可大幅延緩病程進展。',
    q: '腎臟科',
  },
  {
    specialty: '中獸醫',
    icon: '🌿',
    symptoms: ['慢性疼痛', '術後復健', '免疫調節', '老年保健', '食慾調理', '針灸治療'],
    description: '中獸醫結合針灸、中藥等傳統療法，常用於慢性病輔助治療與術後復健。',
    q: '中獸醫',
  },
  {
    specialty: '復健',
    icon: '🏃',
    symptoms: ['骨折術後', '關節退化', '神經損傷', '肌肉萎縮', '行動不便', '術後恢復'],
    description: '寵物復健透過水療、電療等方式加速恢復，改善慢性疼痛與行動能力。',
    q: '復健',
  },
]

export default function GuidePage() {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-3">
            🩺 寵物症狀對照表
          </h1>
          <p className="text-mist/70 text-sm leading-relaxed">
            不知道該掛哪科？對照症狀，找到最適合的專科動物醫院。
          </p>
        </div>
      </div>

      {/* Guide cards */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {GUIDES.map((g) => (
            <div key={g.specialty} className="bg-sand rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{g.icon}</span>
                <h2 className="font-bold text-lg text-ink">{g.specialty}</h2>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(0,30,29,0.6)' }}>
                {g.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {g.symptoms.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand text-snow"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(g.q)}`}
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#f9bc60', color: '#001e1d' }}
              >
                找{g.specialty}診所 →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-12 text-center">
        <p className="text-sm text-mist/60 mb-3">找不到對應症狀？直接搜尋描述也可以</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#f9bc60', color: '#001e1d' }}
        >
          回首頁搜尋 →
        </Link>
      </div>
    </main>
  )
}
