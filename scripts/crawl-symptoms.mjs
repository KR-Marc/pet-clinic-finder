import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const GEMINI_KEY = process.env.GEMINI_API_KEY

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科', '神經外科',
  '泌尿科', '腎臟科', '外科', '內科', '復健', '中獸醫', '24H急診'
]

// ── 持續擴充 URL 清單 ──────────────────────────────────────────────────────
// 每次要新增來源，直接在這裡加 URL 即可，重複的詞會自動去重
const URLS = [
  // ── Moreson 木入森（已爬過的保留，確保去重）
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cat-skin-disease/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cat-flu/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/ringworm/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-food-and-health/cat-vomit-determine/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/dog-cat-pancreatitis/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cat-sick-no-appetite/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/dog-gastroenteritis/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/dog-hot-spot/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/canine-skin-disease/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cat-periodontal-disease/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/pet-vision/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cat-subcutaneous-water-injection/',
  // ── Moreson 新增
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/feline-infectious-peritonitis-fip/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-Illness-and-medical/cats-vaccines/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-knowledge/cat-poop/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-knowledge/cat-skin-disease-symptoms-care/',
  'https://www.moreson.com.tw/moreson/blog-detail/furkid-knowledge/pet-food-and-health/pet-changing-seasons/',
  // ── Daktari 獸醫部落格
  'https://daktari.blog/%E8%B2%93%E8%A1%80%E5%B0%BF%E8%A9%B2%E6%80%8E%E9%BA%BC%E8%BE%A6%EF%BC%9F%E7%8D%B8%E9%86%AB%E8%A7%A3%E8%AA%AA6%E5%A4%A7%E5%8E%9F%E5%9B%A0%E8%88%87%E7%85%A7%E8%AD%B7%E6%96%B9%E5%BC%8F/',
  // ── CatZoo 臭貓動物園
  'https://www.catzoo.tw/blog/14483',
  // ── SofyDog
  'https://www.sofydog.com/tw/SofyDOG/blog-detail/common_cat_disease/',
  // ── InMotion 貓皮膚病
  'https://www.inmotion.com.tw/blog/posts/symptoms-of-cat-skin-disease',
  // ── N2pet
  'https://www.n2pet.com.tw/zh-TW/blogs/%E5%AF%B5%E7%89%A9%E6%96%B0%E7%9F%A5/139029',
  // ── Lifebox
  'https://lifebox.blog/%E8%B2%93%E6%B5%81%E6%B7%9A%E5%A4%A7%E5%A4%9A%E6%98%AF%E9%80%992%E5%A4%A7%E5%8E%9F%E5%9B%A0%E5%BC%95%E8%B5%B7/',
  'https://lifebox.blog/%E4%BA%86%E8%A7%A3%E8%B2%93%E8%A1%80%E6%A0%93/',
  'https://lifebox.blog/%E8%B2%93%E7%98%9F%E7%9A%84%E7%97%87%E7%8B%80%E6%9C%89%E5%93%AA%E4%BA%9B-5%E5%80%8B%E9%9A%8E%E6%AE%B5%E7%9A%84%E7%97%87%E7%8B%80%E4%B9%9F%E4%B8%8D%E5%90%8C/',
]

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; symptom-crawler/1.0)' },
      signal: AbortSignal.timeout(15000)
    })
    const html = await res.text()
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000)
  } catch (e) {
    console.error(`Failed to fetch ${url}: ${e.message}`)
    return null
  }
}

async function extractSymptoms(text, url) {
  const prompt = `你是一位專業獸醫助理。以下是一篇關於貓狗疾病的文章內容：

${text}

請從這篇文章中萃取出「飼主會用來搜尋的症狀詞」，要求：
1. 只萃取「症狀描述詞」（飼主的口語表達方式），不要提取疾病名稱
2. 每個症狀詞要對應到最適合的專科 tag，只能從以下選擇：${KNOWN_TAGS.join('、')}
3. 優先選擇口語化、飼主會自然使用的詞（例如「一直抓耳朵」而非「外耳炎」）
4. 輸出 JSON 陣列，每筆格式為 {"keyword": "症狀詞", "tag": "對應專科"}
5. 每篇文章萃取 15-30 個症狀詞
6. 只輸出 JSON，不要其他文字或 markdown

範例：[{"keyword":"一直抓耳朵","tag":"皮膚科"},{"keyword":"耳朵有黑色分泌物","tag":"皮膚科"}]`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    )
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.filter(item => item.keyword && item.tag && KNOWN_TAGS.includes(item.tag))
  } catch (e) {
    console.error(`Gemini error for ${url}: ${e.message}`)
    return []
  }
}

// ── 第三層：從 search_logs 學習 ────────────────────────────────────────────
async function learnFromSearchLogs() {
  const { data } = await supabase
    .from('search_logs')
    .select('keyword')
    .eq('clinic_count', 0)

  if (!data || data.length === 0) return []

  // 計算頻率
  const freq = {}
  for (const { keyword } of data) {
    freq[keyword] = (freq[keyword] || 0) + 1
  }
  const candidates = Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([keyword]) => keyword)

  if (candidates.length === 0) {
    console.log('\n📊 search_logs 中無找不到結果的高頻詞')
    return []
  }

  console.log(`\n📊 從 search_logs 找到 ${candidates.length} 個高頻失敗詞:`)
  console.log(candidates.join('、'))

  const prompt = `你是一位專業獸醫助理。以下是飼主搜尋寵物診所時輸入的關鍵字，但目前系統找不到對應的診所：

${candidates.join('\n')}

請為每個關鍵字判斷最適合的動物醫院專科，只能從以下選擇：${KNOWN_TAGS.join('、')}
如果某個詞無法判斷醫療相關（例如診所名稱、無意義詞），請跳過不輸出。

輸出 JSON 陣列，格式：[{"keyword": "症狀詞", "tag": "對應專科"}]
只輸出 JSON，不要其他文字。`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    )
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.filter(item => item.keyword && item.tag && KNOWN_TAGS.includes(item.tag))
  } catch (e) {
    console.error(`Gemini search_logs error: ${e.message}`)
    return []
  }
}

async function main() {
  const { data: existing } = await supabase.from('symptoms').select('keyword')
  const existingSet = new Set(existing?.map(r => r.keyword) ?? [])
  console.log(`現有 ${existingSet.size} 筆症狀詞`)

  const allNew = []

  // ── 第二層：爬蟲 ──
  console.log('\n=== 第二層：爬蟲萃取 ===')
  for (const url of URLS) {
    console.log(`\n爬取: ${url}`)
    const text = await fetchText(url)
    if (!text) continue

    const symptoms = await extractSymptoms(text, url)
    const newOnes = symptoms.filter(s => !existingSet.has(s.keyword))
    console.log(`  萃取 ${symptoms.length} 個，新增 ${newOnes.length} 個`)

    for (const s of newOnes) {
      existingSet.add(s.keyword)
      allNew.push(s)
    }

    await new Promise(r => setTimeout(r, 1500))
  }

  // ── 第三層：從 search_logs 學習 ──
  console.log('\n=== 第三層：search_logs 學習 ===')
  const logSymptoms = await learnFromSearchLogs()
  const newFromLogs = logSymptoms.filter(s => !existingSet.has(s.keyword))
  console.log(`  從 search_logs 新增 ${newFromLogs.length} 個`)
  allNew.push(...newFromLogs)

  // ── 寫入 Supabase（欄位名 tag → specialty_tag）──
  console.log(`\n總計新增 ${allNew.length} 筆症狀詞`)
  if (allNew.length > 0) {
    const rows = allNew.map(s => ({ keyword: s.keyword, specialty_tag: s.tag }))
    const { error } = await supabase.from('symptoms').insert(rows)
    if (error) console.error('寫入失敗:', error)
    else {
      console.log('✅ 寫入成功！')
      allNew.forEach(s => console.log(`  ${s.keyword} → ${s.tag}`))
    }
  }
}

main().catch(console.error)
