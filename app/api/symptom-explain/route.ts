import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { symptoms } = await req.json()
  if (!symptoms || symptoms.length === 0) {
    return NextResponse.json({ error: 'No symptoms provided' }, { status: 400 })
  }

  const prompt = `你是一位專業獸醫助理。用戶的寵物出現以下症狀：${symptoms.join('、')}。

請用繁體中文簡短回答，以 JSON 格式輸出，不要有任何其他文字，不要加 markdown 代碼塊：
{
  "summary": "一句話說明這些症狀可能代表什麼（20字以內）",
  "causes": ["可能原因1", "可能原因2", "可能原因3"],
  "advice": "給主人的初步建議（30字以內）",
  "urgency": "low 或 medium 或 high（low=可觀察，medium=近期就診，high=立即就醫）"
}`

  const apiKey = process.env.GEMINI_API_KEY

  // 使用 v1 而非 v1beta，並使用正確的 model ID
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.3,
        },
      }),
    }
  )

  const data = await response.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 500 })
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
