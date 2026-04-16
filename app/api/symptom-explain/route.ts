import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { symptoms } = await req.json()
  if (!symptoms || symptoms.length === 0) {
    return NextResponse.json({ error: 'No symptoms provided' }, { status: 400 })
  }

  const KNOWN_TAGS = ['牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科', '神經外科', '泌尿科', '腎臟科', '外科', '復健', '中獸醫', '24H急診', '重症加護', '內科', '呼吸科', '健檢', '行為醫學']

  const prompt = `你是一位專業獸醫助理。用戶的寵物出現以下症狀：${symptoms.join('、')}。

請用繁體中文回答，以 JSON 格式輸出，不要有任何其他文字，不要加 markdown 代碼塊：
{
  "summary": "一句話說明這些症狀可能代表什麼（20字以內）",
  "causes": ["可能原因1", "可能原因2", "可能原因3"],
  "advice": "給主人的初步建議（30字以內）",
  "urgency": "low 或 medium 或 high（low=可觀察，medium=近期就診，high=立即就醫）",
  "specialties": ["從以下清單選出最相關的1-3個專科：${KNOWN_TAGS.join('、')}"]
}`

  const apiKey = process.env.GEMINI_API_KEY
  async function callGemini(retries = 2): Promise<Response> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
        }),
      }
    )
    const data = await res.json()
    if (data.error && retries > 0) {
      await new Promise(r => setTimeout(r, 1000))
      return callGemini(retries - 1)
    }
    return data
  }

  const data = await callGemini()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 500 })
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    if (parsed.specialties) {
      parsed.specialties = parsed.specialties.filter((t: string) => KNOWN_TAGS.includes(t))
    }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
