import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SPECIALTIES = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科',
  '神經外科', '泌尿科', '腎臟科', '外科', '復健', '中獸醫',
  '24H急診', '重症加護', '內科', '呼吸科', '健檢', '行為醫學',
]

async function generateKeywords(specialty: string): Promise<string[]> {
  const prompt = `你是一位專業獸醫。請列出寵物主人在描述需要「${specialty}」的症狀時，可能使用的繁體中文關鍵字。

嚴格要求：
- 列出 60 個關鍵字
- 每個關鍵字必須在 8 個字以內
- 包含：症狀詞、病名、身體部位、口語描述、相關疾病名稱
- 每個關鍵字獨立一行，不加編號、不加標點、不加解釋
- 直接輸出關鍵字清單，不要有任何其他文字`

  const apiKey = process.env.GEMINI_API_KEY
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
      }),
    }
  )
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return text.split('\n')
    .map((k: string) => k.trim().replace(/^\d+[\.\、\s]+/, '').trim())
    .filter((k: string) => k.length > 0 && k.length <= 12)
}

async function main() {
  console.log('開始生成症狀關鍵字...\n')

  for (const specialty of SPECIALTIES) {
    console.log(`處理 ${specialty}...`)
    try {
      const keywords = await generateKeywords(specialty)
      console.log(`  生成 ${keywords.length} 個關鍵字`)

      await supabase.from('symptoms').delete().eq('specialty_tag', specialty)

      const rows = keywords.map(keyword => ({ keyword, specialty_tag: specialty }))
      const { error } = await supabase.from('symptoms').insert(rows)

      if (error) {
        console.error(`  插入失敗:`, error.message)
      } else {
        console.log(`  ✓ 已寫入 ${rows.length} 筆`)
      }

      await new Promise(r => setTimeout(r, 1500))
    } catch (e) {
      console.error(`  錯誤:`, e)
    }
  }

  console.log('\n✅ 完成！')
}

main()
