import Link from 'next/link'
import { Activity, AlertTriangle, Bone, Brain, Cat, Dog, Droplets, Eye, Heart, Leaf, PawPrint, Ribbon, Scissors, Siren, Stethoscope } from 'lucide-react'
import type { Metadata } from 'next'
import { ClayNav, ClayFooter } from '@/app/components/clay'

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
    icon: 'tooth',
    description: '寵物牙齒問題常被忽略，口臭是最常見的早期訊號。建議每年定期洗牙檢查。',
    symptoms: ['口臭', '流口水', '牙齦紅腫', '掉牙', '不肯吃東西', '嘴巴有味道'],
    diseases: ['牙周病', '牙結石', '牙齦炎', '口腔腫瘤'],
    when_to_visit: '口臭超過 2 週、牙齦出血、拒絕進食、流口水異常增多',
    cost: '洗牙約 3,000–6,000 元，拔牙視狀況另計',
    q: '牙科',
    breeds: { cat: ['波斯貓', '異國短毛貓', '布偶貓（扁臉易積牙垢）'], dog: ['玩具貴賓', '約克夏', '吉娃娃', '臘腸犬（小型犬牙周病高風險）'] },
    food: { royal: ['Dental DD25 口腔護理'], hills: ['t/d 口腔護理'] },
  },
  {
    specialty: '眼科',
    icon: 'eye',
    description: '眼部問題若未及時處理可能影響視力，發現異常應盡早就診。',
    symptoms: ['眼屎多', '眼睛紅', '白內障', '眼睛混濁', '一直眨眼', '眼睛腫'],
    diseases: ['白內障', '青光眼', '角膜潰瘍', '乾眼症'],
    when_to_visit: '眼睛持續紅腫、分泌物增多、眼球混濁、不斷用爪子抓眼睛',
    cost: '眼科初診約 500–1,500 元，手術費用依病症差異較大',
    q: '眼科',
    breeds: { cat: ['波斯貓', '喜馬拉雅貓', '異國短毛貓（淚腺問題）'], dog: ['北京犬', '西施犬', '鬥牛犬', '巴哥犬（眼球外突易受傷）'] },
  },
  {
    specialty: '心臟科',
    icon: 'heart',
    description: '心臟病在老年犬貓中很常見，定期心臟超音波可早期發現。',
    symptoms: ['咳嗽', '容易喘', '心雜音', '運動不耐', '昏厥', '肚子變大'],
    diseases: ['二尖瓣疾病', '擴張型心肌病', '心包積液', '先天性心臟病'],
    when_to_visit: '持續咳嗽、運動後喘不停、突然暈倒、腹部異常膨大',
    cost: '心臟超音波約 2,000–4,000 元，長期用藥每月約 1,000–3,000 元',
    q: '心臟科',
    breeds: { cat: ['緬因貓', '布偶貓', '英國短毛貓（肥厚性心肌病）'], dog: ['騎士查理王獵犬', '博美犬', '玩具貴賓', '臘腸犬（二尖瓣疾病）'] },
    food: { royal: ['Cardiac EC26 心臟處方'], hills: ['h/d 心臟護理'] },
  },
  {
    specialty: '骨科',
    icon: 'bone',
    description: '骨關節問題影響生活品質，及早診斷可避免病情惡化。',
    symptoms: ['跛行', '骨折', '不肯走路', '關節腫大', '爬樓梯困難', '腳腳無力'],
    diseases: ['十字韌帶斷裂', '髖關節發育不良', '椎間盤疾病', '骨折'],
    when_to_visit: '突然跛行、無法承重、關節明顯腫脹、行走姿勢異常',
    cost: '骨科手術約 15,000–60,000 元，復健療程每次約 1,500–3,000 元',
    q: '骨科',
    breeds: { cat: ['緬因貓', '蘇格蘭摺耳貓（關節病變高風險）'], dog: ['拉布拉多', '黃金獵犬', '德國牧羊犬', '臘腸犬（椎間盤疾病）'] },
    food: { royal: ['Mobility 關節活動力'], hills: ['j/d 關節活動力'] },
  },
  {
    specialty: '腫瘤科',
    icon: 'ribbon',
    description: '腫塊不一定是惡性，但發現後應盡快請獸醫評估。早期治療效果最好。',
    symptoms: ['腫塊', '腫瘤快速增大', '體重下降', '食慾廢絕', '異常出血'],
    diseases: ['肥大細胞瘤', '淋巴瘤', '乳腺腫瘤', '骨肉瘤'],
    when_to_visit: '發現新腫塊、腫塊快速增大、體重急速下降、持續出血',
    cost: '切片檢查約 3,000–8,000 元，化療療程每次約 5,000–15,000 元',
    q: '腫瘤科',
    breeds: { cat: ['暹羅貓', '東方短毛貓（淋巴瘤）', '未絕育母貓（乳腺腫瘤）'], dog: ['黃金獵犬', '拳師犬', '羅威那犬', '波士頓梗（肥大細胞瘤）'] },
    food: { royal: [], hills: ['n/d 腫瘤支持配方'] },
  },
  {
    specialty: '皮膚科',
    icon: 'leaf',
    description: '皮膚問題原因多樣，可能是過敏、感染或荷爾蒙異常，需專科鑑別診斷。',
    symptoms: ['一直抓', '掉毛', '皮膚紅疹', '皮屑多', '皮膚有異味', '反覆舔腳'],
    diseases: ['異位性皮膚炎', '真菌感染', '食物過敏', '疥癬'],
    when_to_visit: '持續搔抓超過 1 週、皮膚出現紅腫或潰瘍、大量掉毛',
    cost: '皮膚科初診含刮毛檢查約 800–2,000 元，藥浴療程每次約 500–1,500 元',
    q: '皮膚科',
    breeds: { cat: ['緬甸貓', '孟加拉貓', '斯芬克斯貓（無毛貓皮膚易感染）'], dog: ['西高地白梗', '法國鬥牛犬', '沙皮犬', '拉布拉多（異位性皮膚炎）'] },
    food: { royal: ['Skin & Food Sensitivity 皮膚食物敏感'], hills: ['d/d 食物敏感', 'z/d 極度低敏'] },
  },
  {
    specialty: '神經外科',
    icon: 'brain',
    description: '神經症狀需緊急評估，延誤治療可能造成永久損傷。',
    symptoms: ['抽搐', '癲癇', '走路歪斜', '突然癱瘓', '頭部傾斜', '眼球震顫'],
    diseases: ['椎間盤突出', '癲癇', '腦瘤', '前庭疾病'],
    when_to_visit: '首次抽搐發作、持續抽搐超過 5 分鐘、突然無法站立或行走',
    cost: 'MRI 檢查約 15,000–25,000 元，脊椎手術約 40,000–100,000 元',
    q: '抽搐',
    breeds: { cat: ['布偶貓', '波斯貓（前庭疾病）'], dog: ['臘腸犬', '柯基', '米格魯', '博美犬（椎間盤突出高風險）'] },
  },
  {
    specialty: '泌尿科',
    icon: 'droplets',
    description: '泌尿道問題在貓咪中非常常見，公貓尤其容易發生尿道阻塞需緊急處理。',
    symptoms: ['血尿', '頻尿', '尿結石', '膀胱炎', '排尿困難', '一直舔下體'],
    diseases: ['膀胱炎', '尿道結石', '腎盂腎炎', '尿道阻塞'],
    when_to_visit: '超過 12 小時無法排尿、血尿、排尿時嚎叫、頻繁進出廁所',
    cost: '尿液檢查約 500–1,000 元，結石手術約 15,000–40,000 元',
    q: '泌尿科',
    breeds: { cat: ['公貓通用（尿道細易阻塞）', '波斯貓', '喜馬拉雅貓（草酸鈣結石）'], dog: ['迷你雪納瑞', '比熊犬', '約克夏（結石高風險）'] },
    food: { royal: ['Urinary S/O LP34 泌尿道'], hills: ['c/d 全效泌尿道', 'c/d 紓解緊迫'] },
  },
  {
    specialty: '腎臟科',
    icon: 'droplets',
    description: '腎臟疾病是老年貓咪最常見的死因之一，早期篩檢非常重要。',
    symptoms: ['多喝水', '多尿', '食慾下降', '嘔吐', '體重減輕', '口臭有尿味'],
    diseases: ['慢性腎臟病', '急性腎損傷', '腎盂腎炎', '多囊腎'],
    when_to_visit: '突然大量飲水、尿量異常增多或減少、嘔吐合併食慾不振',
    cost: '血液腎功能檢查約 800–1,500 元，皮下輸液每次約 300–600 元',
    q: '腎臟科',
    breeds: { cat: ['波斯貓', '英國短毛貓', '阿比西尼亞貓（慢性腎臟病高風險）'], dog: ['英國古代牧羊犬', '薩摩耶犬', '西伯利亞哈士奇（遺傳性腎病）'] },
    food: { royal: ['Renal RF23 腎臟處方', 'Early Renal ER28 早期腎臟'], hills: ['k/d 腎臟護理', 'k/d+j/d 腎臟+關節'] },
  },
  {
    specialty: '外科',
    icon: 'scissors',
    description: '外科手術涵蓋範圍廣，從結紮到複雜的腹腔手術都屬外科範疇。',
    symptoms: ['腫塊切除', '結紮', '外傷縫合', '腸阻塞', '腹部異常', '吞入異物'],
    diseases: ['腸梗阻', '胃扭轉', '疝氣', '腹膜炎'],
    when_to_visit: '腹部急速膨脹、持續嘔吐、疑似吞入異物、外傷出血不止',
    cost: '結紮手術約 3,000–8,000 元，腹腔手術約 10,000–50,000 元',
    q: '外科',
    food: { royal: ['GastroIntestinal GI25 腸胃道'], hills: ['i/d 消化系統護理'] },
  },
  {
    specialty: '復健',
    icon: 'activity',
    description: '術後復健可加速恢復，水療和物理治療對關節退化的老年寵物特別有幫助。',
    symptoms: ['術後恢復', '關節退化', '水療', '肌肉萎縮', '行動不便', '老年照護'],
    diseases: ['術後復健', '關節炎', '椎間盤術後', '中風後復健'],
    when_to_visit: '骨科或神經手術後、老年關節退化、肌肉萎縮、中風後行動不便',
    cost: '復健初評約 1,500–2,500 元，水療每次約 800–1,500 元',
    food: { royal: ['Mobility 關節活動力'], hills: ['j/d 關節活動力', 'k/d+j/d 腎臟+關節'] },
    q: '復健',
  },
  {
    specialty: '中獸醫',
    icon: 'leaf',
    description: '中獸醫結合針灸、中藥等療法，適合慢性病調理和術後輔助治療。',
    symptoms: ['針灸', '中藥', '慢性病調理', '食慾不振', '免疫調節', '老年保健'],
    diseases: ['慢性疼痛', '免疫系統疾病', '腫瘤輔助治療', '老年退化'],
    when_to_visit: '慢性疾病長期調養、術後輔助恢復、老年保健、西醫治療效果有限時',
    cost: '中獸醫初診含針灸約 1,500–3,000 元，中藥處方每週約 500–1,500 元',
    q: '中獸醫',
  },
  {
    specialty: '24H急診',
    icon: 'siren',
    description: '深夜或假日緊急狀況不用慌，台北市有多家 24 小時急診動物醫院。',
    symptoms: ['昏倒', '呼吸困難', '大量出血', '中毒', '骨折', '意識不清'],
    diseases: ['外傷', '中毒', '休克', '急性器官衰竭'],
    when_to_visit: '任何危及生命的緊急狀況，包含：無法呼吸、大量出血、昏迷、中毒',
    cost: '急診掛號費約 500–1,500 元，後續費用依病情而定',
    q: '24H急診',
  },
]

function getIcon(name: string, size = 22) {
  switch (name) {
    case 'tooth': return <Stethoscope size={size} />
    case 'eye': return <Eye size={size} />
    case 'heart': return <Heart size={size} />
    case 'bone': return <Bone size={size} />
    case 'ribbon': return <Ribbon size={size} />
    case 'leaf': return <Leaf size={size} />
    case 'brain': return <Brain size={size} />
    case 'scissors': return <Scissors size={size} />
    case 'droplets': return <Droplets size={size} />
    case 'activity': return <Activity size={size} />
    case 'siren': return <Siren size={size} />
    default: return <Stethoscope size={size} />
  }
}

export default function GuidePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-clay-bg)', color: 'var(--color-clay-text)' }}>
      <ClayNav current="guide" />

      {/* Hero */}
      <div style={{
        background: 'var(--color-clay-hero)',
        borderBottom: '1px solid var(--color-clay-border)',
        padding: '56px 24px 44px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -100, top: -80, width: 380, height: 380,
          borderRadius: '50%', background: 'var(--color-clay-hero-accent)',
          filter: 'blur(50px)', opacity: 0.55, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--color-clay-sage)',
            background: 'var(--color-clay-sage-soft)',
            padding: '6px 12px', borderRadius: 999, fontWeight: 700, marginBottom: 18,
          }}>
            <Stethoscope size={13} /> 症狀對照指南
          </div>
          <h1 style={{
            fontSize: 36, fontWeight: 800, letterSpacing: -1,
            lineHeight: 1.15, color: 'var(--color-clay-text)', margin: 0, marginBottom: 12,
          }}>
            不知道掛哪科？<br />
            <span style={{ color: 'var(--color-clay-primary)' }}>對照症狀</span>找到專科
          </h1>
          <p style={{
            fontSize: 15, color: 'var(--color-clay-text-soft)',
            margin: 0, maxWidth: 560, lineHeight: 1.7,
          }}>
            13 個常見專科 × 症狀、疾病、就診時機、費用、易感品種、處方飼料一次看懂。
          </p>
        </div>
      </div>

      {/* Guide cards */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 24px 24px', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {GUIDES.map((g) => (
            <article key={g.specialty} style={{
              background: 'var(--color-clay-surface)',
              border: '1px solid var(--color-clay-border)',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 1px 2px rgb(79 56 28 / 0.04)',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-clay-primary)', flexShrink: 0,
                }} />
                <span style={{ color: 'var(--color-clay-primary)', display: 'inline-flex', alignItems: 'center' }}>
                  {getIcon(g.icon, 20)}
                </span>
                <h2 style={{
                  fontSize: 18, fontWeight: 800,
                  color: 'var(--color-clay-text)', margin: 0,
                }}>{g.specialty}</h2>
              </div>

              {/* Description */}
              <p style={{
                fontSize: 13, lineHeight: 1.7,
                color: 'var(--color-clay-text-soft)',
                margin: 0, marginBottom: 14,
              }}>
                {g.description}
              </p>

              {/* Symptom chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {g.symptoms.map((s) => (
                  <span key={s} style={{
                    fontSize: 11.5, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 999,
                    background: 'var(--color-clay-tag-bg)',
                    color: 'var(--color-clay-tag-text)',
                  }}>{s}</span>
                ))}
              </div>

              {/* Fact rows */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                paddingTop: 14, borderTop: '1px solid var(--color-clay-border)',
              }}>
                <FactRow label="常見疾病" value={g.diseases.join('、')} />
                <FactRow label="何時就診" value={g.when_to_visit} />
                <FactRow label="費用參考" value={g.cost} />
              </div>

              {/* Breeds */}
              {'breeds' in g && g.breeds && (
                <div style={{
                  marginTop: 14, paddingTop: 14,
                  borderTop: '1px dashed var(--color-clay-border)',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    color: 'var(--color-clay-text-mute)', marginBottom: 8,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <PawPrint size={12} /> 易感品種
                  </div>
                  {(g.breeds as { cat?: string[]; dog?: string[] }).cat && (
                    <div style={{ fontSize: 12, color: 'var(--color-clay-text-soft)', lineHeight: 1.6, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontWeight: 700, color: 'var(--color-clay-text)', marginRight: 6,
                      }}>
                        <Cat size={12} />貓
                      </span>
                      {(g.breeds as { cat: string[] }).cat.join('、')}
                    </div>
                  )}
                  {(g.breeds as { cat?: string[]; dog?: string[] }).dog && (
                    <div style={{ fontSize: 12, color: 'var(--color-clay-text-soft)', lineHeight: 1.6 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontWeight: 700, color: 'var(--color-clay-text)', marginRight: 6,
                      }}>
                        <Dog size={12} />狗
                      </span>
                      {(g.breeds as { dog: string[] }).dog.join('、')}
                    </div>
                  )}
                </div>
              )}

              {/* Prescription food */}
              {'food' in g && g.food && (
                <div style={{
                  marginTop: 14, paddingTop: 14,
                  borderTop: '1px dashed var(--color-clay-border)',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    color: 'var(--color-clay-text-mute)', marginBottom: 6,
                  }}>
                    🍽️ 獸醫處方飼料參考
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--color-clay-text-mute)',
                    marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <AlertTriangle size={12} /> 需憑獸醫師指示購買，請勿自行使用
                  </div>
                  {(g.food as { royal?: string[] }).royal && (g.food as { royal: string[] }).royal.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--color-clay-text-soft)', lineHeight: 1.6, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-clay-text)', marginRight: 6 }}>皇家</span>
                      {(g.food as { royal: string[] }).royal.join('、')}
                    </div>
                  )}
                  {(g.food as { hills?: string[] }).hills && (g.food as { hills: string[] }).hills.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--color-clay-text-soft)', lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-clay-text)', marginRight: 6 }}>希爾思</span>
                      {(g.food as { hills: string[] }).hills.join('、')}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <Link
                  href={`/search?q=${encodeURIComponent(g.q)}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '8px 16px', borderRadius: 999,
                    background: 'var(--color-clay-primary)', color: '#fff',
                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  找{g.specialty}診所 →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 56px', textAlign: 'center' }}>
        <p style={{
          fontSize: 14, color: 'var(--color-clay-text-soft)',
          marginBottom: 14, marginTop: 0,
        }}>
          找不到對應症狀？直接搜尋描述也可以
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '12px 24px', borderRadius: 999,
            background: 'var(--color-clay-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}
        >
          回首頁搜尋 →
        </Link>
      </div>

      <ClayFooter />
    </main>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        color: 'var(--color-clay-text-mute)',
        marginBottom: 3, textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.6,
        color: 'var(--color-clay-text-soft)',
      }}>
        {value}
      </div>
    </div>
  )
}
