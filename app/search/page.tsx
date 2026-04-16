import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import ClinicList, { type Clinic } from './ClinicList'
import SearchBar from './SearchBar'

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '內科', '24H急診', '復健', '中獸醫',
]

// AI 可能回傳但資料庫沒有的 tag → 對應到實際存在的 tag
const TAG_REMAP: Record<string, string> = {
  // '內科': '外科',  // 已修正：內科 tag 現在在 clinics 表中存在
  '健檢': '外科',
  '行為醫學': '中獸醫',
  '呼吸科': '心臟科',
  '重症加護': '24H急診',
  '一般科': '外科',
  '腸胃科': '外科',
  '感染科': '外科',
}

function remapTags(tags: string[]): string[] {
  return tags.map(t => TAG_REMAP[t] ?? t)
}

// In-memory cache for AI tag results（process 層級，跨 request 共享）
const aiTagCache = new Map<string, string[]>()


async function fetchClinics(q: string, pet: string, district: string): Promise<Clinic[]> {
  // 支援多症狀複合查詢（逗號分隔）
  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)

  if (queryTerms.length === 0) {
    let query = supabase
      .from('clinics')
      .select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })
    if (pet && pet !== 'both') query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) query = query.eq('district', district)
    const { data } = await query
    return (data ?? []) as Clinic[]
  }

  const { data: allSymptoms } = await supabase
    .from('symptoms')
    .select('keyword, specialty_tag')

  // 每個查詢詞各自找出對應的 specialty tags
  const tagSetsPerTerm: Set<string>[] = queryTerms.map((term) => {
    const tLower = term.toLowerCase()
    const bigrams = new Set<string>()
    for (let i = 0; i < tLower.length - 1; i++) bigrams.add(tLower.slice(i, i + 2))

    const tags = new Set<string>()
    for (const { keyword, specialty_tag } of (allSymptoms ?? []) as { keyword: string; specialty_tag: string }[]) {
      const kLower = keyword.toLowerCase()
      const directMatch = kLower.includes(tLower) || tLower.includes(kLower)
      // bigram 需至少 2 個命中，避免單字誤配（口炎的「口」配到不相關 tag）
      const bigramHits = [...bigrams].filter((bg) => kLower.includes(bg)).length
      const bigramMatch = tLower.length >= 4 ? bigramHits >= 2 : bigramHits >= 1
      if (directMatch || bigramMatch) tags.add(specialty_tag)
    }
    for (const tag of KNOWN_TAGS) {
      const tagLower = tag.toLowerCase()
      if (tLower.includes(tagLower) || tagLower.includes(tLower)) tags.add(tag)
    }
    // 別名對照：口語詞 → 正式 tag
    const ALIAS: Record<string, string> = {
      // 急診緊急
      '急診': '24H急診', '半夜': '24H急診', '緊急': '24H急診', '24小時': '24H急診',
      '狂犬病': '24H急診', '傳染': '24H急診', '中毒': '24H急診', '昏迷': '24H急診',
      '休克': '24H急診', '大量出血': '24H急診', '車禍': '24H急診',
      '細小': '24H急診', '犬瘟': '24H急診', '腹膜炎': '24H急診',
      '呼吸困難': '24H急診', '無法排尿': '24H急診',
      // 疫苗/預防/外科
      '疫苗': '外科', '預防針': '外科', '打針': '外科', '驅蟲': '外科',
      '鉤端螺旋體': '外科', '結紮': '外科', '絕育': '外科', '手術': '外科',
      '切除': '外科', '縫合': '外科', '傷口': '外科',
      '嘔吐': '內科', '腹瀉': '內科', '拉肚子': '內科', '腸胃炎': '內科',
      '胰臟': '內科', '胃扭轉': '24H急診', '便秘': '內科', '血便': '內科',
      '糖尿病': '外科', '甲狀腺': '外科', '肥胖': '外科', '體重下降': '外科',
      '肛門': '外科', '摩地板': '外科', '磨地板': '外科', '寄生蟲': '外科',
      // 皮膚
      '掉毛': '皮膚科', '搔癢': '皮膚科', '皮膚': '皮膚科',
      '貓蘚': '皮膚科', '貓癬': '皮膚科', '黴菌': '皮膚科', '癬': '皮膚科', '真菌': '皮膚科',
      '跳蚤': '皮膚科', '蟎蟲': '皮膚科', '壁蝨': '皮膚科', '牛蜱': '皮膚科',
      '過敏': '皮膚科', '濕疹': '皮膚科', '皮屑': '皮膚科', '紅疹': '皮膚科', '一直抓': '皮膚科',
      // 泌尿/腎臟
      '血尿': '泌尿科', '頻尿': '泌尿科', '尿結石': '泌尿科', '膀胱': '泌尿科', '尿': '泌尿科',
      '腎臟': '腎臟科', '腎衰竭': '腎臟科', '腎病': '腎臟科', '多喝水': '腎臟科', '腎': '腎臟科',
      // 口腔牙齒
      '口臭': '牙科', '牙結石': '牙科', '牙周': '牙科', '牙齦': '牙科',
      '掉牙': '牙科', '洗牙': '牙科', '口腔': '牙科', '流口水': '牙科', '牙': '牙科',
      '口炎': '牙科', '口腔潰瘍': '牙科', '口瘡': '牙科', '舌炎': '牙科', '牙痛': '牙科',
      // 各種「X炎」
      '皮膚炎': '皮膚科', '脂漏性皮膚炎': '皮膚科', '異位性皮膚炎': '皮膚科',
      '外耳炎': '皮膚科', '耳炎': '皮膚科', '耳朵': '皮膚科',
      '結膜炎': '眼科', '角膜炎': '眼科',
      '腸炎': '內科', '胃炎': '內科', '胰臟炎': '內科', '肝炎': '內科',
      '膀胱炎': '泌尿科', '腎炎': '腎臟科',
      '關節炎': '骨科', '骨髓炎': '骨科',
      '心肌炎': '心臟科', '心包炎': '心臟科',
      '腦炎': '神經外科', '脊髓炎': '神經外科',
      // 眼睛
      '眼屎': '眼科', '眼睛': '眼科', '白內障': '眼科', '角膜': '眼科', '眼分泌物': '眼科',
      // 心臟呼吸
      '心臟': '心臟科', '咳嗽': '心臟科', '喘': '心臟科', '心雜音': '心臟科',
      '心跳': '心臟科', '肺': '心臟科', '心絲蟲': '心臟科', '呼吸': '心臟科',
      // 骨科/關節
      '跛行': '骨科', '關節': '骨科', '骨骼': '骨科', '椎間盤': '骨科',
      '後肢無力': '骨科', '髖關節': '骨科', '骨折': '骨科',
      // 神經
      '抽搐': '神經外科', '癲癇': '神經外科', '痙攣': '神經外科', '麻痺': '神經外科',
      '神經': '神經外科', '昏厥': '神經外科', '走路歪': '神經外科',
      // 腫瘤
      '腫塊': '腫瘤科', '腫瘤': '腫瘤科', '癌症': '腫瘤科', '化療': '腫瘤科',
      // 復健/中獸醫
      '術後': '復健', '復健': '復健', '老犬': '復健', '老貓': '復健', '關節退化': '復健',
      '針灸': '中獸醫', '中藥': '中獸醫', '中獸醫': '中獸醫',
    }
    for (const [alias, tag] of Object.entries(ALIAS)) {
      if (tLower.includes(alias)) tags.add(tag)
    }
    return tags
  })

  // 單一症狀：用 overlaps（OR 邏輯）
  // 多症狀：先各自查，再取交集（AND 邏輯）
  let tagClinics: Clinic[] = []
  const allFuzzyTags = new Set<string>([...tagSetsPerTerm.flatMap((s) => [...s])])

  // 無論是否已有 tag，都嘗試用 AI 補充（並 remap 不存在的 tag）
  if (queryTerms.length > 0) {
    const cacheKey = queryTerms.join(',')
    if (aiTagCache.has(cacheKey)) {
      aiTagCache.get(cacheKey)!.forEach((t: string) => allFuzzyTags.add(t))
    } else {
      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/api/symptom-explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: queryTerms }),
        })
        const data = await res.json()
        if (data.specialties && Array.isArray(data.specialties)) {
          const remapped = remapTags(data.specialties)
          aiTagCache.set(cacheKey, remapped)
          remapped.forEach((t: string) => allFuzzyTags.add(t))
        }
        // 如果 AI 萃取出關鍵症狀詞，也加進 fuzzy tags 做二次比對
        if (data.extractedSymptoms && Array.isArray(data.extractedSymptoms)) {
          const { data: extraSymptoms } = await supabase
            .from('symptoms')
            .select('specialty_tag')
            .in('keyword', data.extractedSymptoms)
          if (extraSymptoms) {
            remapTags(extraSymptoms.map((s: { specialty_tag: string }) => s.specialty_tag))
              .forEach((t: string) => allFuzzyTags.add(t))
          }
        }
      } catch {
        // silent fail
      }
    }
  }

  if (allFuzzyTags.size > 0) {
    let tagQuery = supabase.from('clinics').select('*').overlaps('specialty_tags', [...allFuzzyTags])
    if (pet && pet !== 'both') tagQuery = tagQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    if (district) tagQuery = tagQuery.eq('district', district)
    const { data } = await tagQuery
    let results = (data ?? []) as Clinic[]

    // 多症狀時，過濾出同時符合所有症狀對應 tag 的診所
    if (queryTerms.length > 1) {
      results = results.filter((clinic) =>
        tagSetsPerTerm.every((tagSet) =>
          tagSet.size === 0 || clinic.specialty_tags.some((t) => tagSet.has(t))
        )
      )
    }
    tagClinics = results
  }

  // 名稱搜尋只用第一個關鍵字
  let nameQuery = supabase.from('clinics').select('*').ilike('name', `%${queryTerms[0]}%`)
  if (pet && pet !== 'both') nameQuery = nameQuery.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  if (district) nameQuery = nameQuery.eq('district', district)
  const { data: nameClinics } = await nameQuery

  const seen = new Set(tagClinics.map((c) => c.id))
  const nameOnly = ((nameClinics ?? []) as Clinic[]).filter((c) => !seen.has(c.id))

  // 計算每間診所的相關性分數
  // 分數 = 診所的 specialty_tags 中有幾個在 allFuzzyTags 裡
  const scoredTagClinics = tagClinics.map((clinic) => {
    const matchCount = clinic.specialty_tags.filter((t) => allFuzzyTags.has(t)).length
    return { clinic, score: matchCount }
  })

  // 先依相關性分數降序，分數相同再依評分降序
  scoredTagClinics.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ratingA = a.clinic.rating ?? 0
    const ratingB = b.clinic.rating ?? 0
    return ratingB - ratingA
  })

  return [...scoredTagClinics.map((s) => s.clinic), ...nameOnly]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pet?: string; district?: string; source?: string }>
}) {
  const { q = '', pet = '', district = '', source = '' } = await searchParams
  const clinics = await fetchClinics(q, pet, district)

  const queryTerms = q.split(',').map((t) => t.trim()).filter(Boolean)
  const subtitle = queryTerms.length === 0
    ? (source === 'nearby' ? '📍 附近的診所' : '瀏覽所有診所')
    : queryTerms.length === 1
      ? `「${queryTerms[0]}」`
      : `「${queryTerms.join('」+「')}」複合搜尋`

  return (
    <main className="min-h-screen bg-brand">
      {/* ── Top bar ── */}
      <div className="bg-ink sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-mist hover:text-snow text-sm font-medium whitespace-nowrap transition-colors shrink-0"
          >
            ← 回首頁
          </Link>
          <span className="text-mist/30 shrink-0">|</span>
          <span className="text-snow text-sm font-medium truncate">{subtitle}</span>
        </div>
      </div>

      {/* ── Inline search bar ── */}
      <div className="bg-ink/60 border-b border-mist/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Suspense fallback={null}>
            <SearchBar initialQ={q} initialPet={pet} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
        <Suspense fallback={
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-32 bg-ink rounded animate-pulse" />
          </div>
        }>
          <ClinicList clinics={clinics} queryTerms={queryTerms} />
        </Suspense>
      </div>
    </main>
  )
}
