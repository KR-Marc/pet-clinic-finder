import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { symptoms } = await req.json()
  if (!symptoms || symptoms.length === 0) {
    return NextResponse.json({ error: 'No symptoms provided' }, { status: 400 })
  }

  const prompt = `你是一位專業獸醫助理。用戶的寵物出現以下症狀：${symptoms.join('、')}。

請用繁體中文簡短回答，以 JSON 格式輸出，不要有任何其他文字：
{
  "summary": "一句話說明這些症狀可能代表什麼（20字以內）",
  "causes": ["可能原因1", "可能原因2", "可能原因3"],
  "advice": "給主人的初步建議（30字以內）",
  "urgency": "low 或 medium 或 high（low=可觀察，medium=近期就診，high=立即就醫）"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
