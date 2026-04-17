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

// 目標 URL 清單
const URLS = [
  // Moreson 木入森
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
  // Daktari 獸醫
  'https://daktari.blog/%E8%B2%93%E8%A1%80%E5%B0%BF%E8%A9%B2%E6%80%8E%E9%BA%BC%E8%BE%A6%EF%BC%9F%E7%8D%B8%E9%86%AB%E8%A7%A3%E8%AA%AA6%E5%A4%A7%E5%8E%9F%E5%9B%A0%E8%88%87%E7%85%A7%E8%AD%B7%E6%96%B9%E5%BC%8F/',
  // N2pet
  'https://www.n2pet.com.tw/zh-TW/blogs/%E5%AF%B5%E7%89%A9%E6%96%B0%E7%9F%A5/139029',
  // Lifebox
  'https://lifebox.blog/%E8%B2%93%E6%B5%81%E6%B7%9A%E5%A4%A7%E5%A4%9A%E6%98%AF%E9%80%992%E5%A4%A7%E5%8E%9F%E5%9B%A0%E5%BC%95%E8%B5%B7/',
  'https://lifebox.blog/%E4%BA%86%E8%A7%A3%E8%B2%93%E8%A1%80%E6%A0%93/',
]

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; symptom-crawler/1.0)' },
      signal: AbortSignal.timeout(15000)
    })
    const html = await res.text()
    // 簡單去除 HTML tags
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000) // 限制長度
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
    return parsed.filter(item =>
      item.keyword && item.tag && KNOWN_TAGS.includes(item.tag)
    )
  } catch (e) {
    console.error(`Gemini error for ${url}: ${e.message}`)
    return []
  }
}

async function main() {
  // 先讀取現有的 keywords 避免重複
  const { data: existing } = await supabase.from('symptoms').select('keyword')
  const existingSet = new Set(existing?.map(r => r.keyword) ?? [])
  console.log(`現有 ${existingSet.size} 筆症狀詞`)

  const allNew = []

  for (const url of URLS) {
    console.log(`\n爬取: ${url}`)
    const text = await fetchText(url)
    if (!text) continue

    console.log(`  文字長度: ${text.length}`)
    const symptoms = await extractSymptoms(text, url)
    console.log(`  萃取到 ${symptoms.length} 個症狀詞`)

    // 過濾掉已存在的
    const newOnes = symptoms.filter(s => !existingSet.has(s.keyword))
    console.log(`  新增 ${newOnes.length} 個（去重後）`)

    for (const s of newOnes) {
      existingSet.add(s.keyword) // 防止同一輪重複
      allNew.push(s)
    }

    // 避免 rate limit
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n總計新增 ${allNew.length} 筆症狀詞`)

  if (allNew.length > 0) {
    // 批次寫入（欄位名 tag → specialty_tag）
    const rows = allNew.map(s => ({ keyword: s.keyword, specialty_tag: s.tag }))
    const { error } = await supabase.from('symptoms').insert(rows)
    if (error) {
      console.error('寫入失敗:', error)
    } else {
      console.log('✅ 寫入 Supabase 成功！')
      console.log('\n新增的症狀詞：')
      allNew.forEach(s => console.log(`  ${s.keyword} → ${s.tag}`))
    }
  }
}

main().catch(console.error)
