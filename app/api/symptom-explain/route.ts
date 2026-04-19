import { NextRequest, NextResponse } from 'next/server'

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
// Limits each IP to 10 requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const KNOWN_TAGS = [
  '牙科', '眼科', '心臟科', '骨科', '腫瘤科', '皮膚科', '神經外科',
  '泌尿科', '腎臟科', '外科', '內科', '復健', '中獸醫', '24H急診', '重症加護',
]

const apiKey = process.env.GEMINI_API_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callGemini(prompt: string, retries = 2): Promise<any> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  )
  const data = await res.json()
  if (data.error && retries > 0) {
    await new Promise(r => setTimeout(r, 1000))
    return callGemini(prompt, retries - 1)
  }
  return data
}

function extractText(data: { candidates?: { content?: { parts?: { text?: string }[] } }[] }): string {
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── 步驟一：自然語言萃取關鍵症狀詞 ──────────────────────────────────────────
// 當輸入超過 10 個字時，先讓 AI 從描述中萃取 1-3 個精煉的醫療症狀關鍵詞
async function extractKeySymptoms(input: string): Promise<string[]> {
  const prompt = `你是一位專業獸醫助理。以下是寵物飼主描述的狀況：
「${input}」

請從這段描述中萃取出 1-3 個最重要的「醫療症狀關鍵詞」，用於搜尋動物醫院。
要求：
- 輸出精簡的醫療術語或症狀詞（如：嘔吐、食慾不振、跛行）
- 不要輸出原句，只輸出關鍵詞
- 以 JSON 陣列格式輸出，不要加任何其他文字或 markdown
範例輸出：["嘔吐", "食慾不振"]`

  const data = await callGemini(prompt)
  const text = extractText(data).replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch { /* fallback */ }
  return [input] // 萃取失敗時直接用原始輸入
}

// ── 步驟二：分析症狀並回傳完整資訊 ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    )
  }

  const { symptoms } = await req.json()

  if (!symptoms || symptoms.length === 0) {
    return NextResponse.json({ error: 'No symptoms provided' }, { status: 400 })
  }

  // Input length validation
  const rawInput = symptoms[0] as string
  if (!rawInput || rawInput.length > 200) {
    return NextResponse.json({ error: 'Invalid input length' }, { status: 400 })
  }

  // 判斷是否為自然語言長句（超過 10 個字）
  let processedSymptoms: string[] = symptoms

  if (rawInput.length > 10) {
    processedSymptoms = await extractKeySymptoms(rawInput)
  }

  const prompt = `你是一位專業獸醫助理。寵物（貓或狗）出現以下症狀：${processedSymptoms.join('、')}。
請以「貓或狗等寵物」為主體來回答，不要預設只有狗狗。
請站在「幫助用戶找到合適診所」的角度回答。
請用繁體中文回答，以 JSON 格式輸出，不要有任何其他文字，不要加 markdown 代碼塊：
{
  "summary": "一句話說明這些症狀可能代表什麼（20字以內）",
  "causes": ["可能原因1", "可能原因2", "可能原因3"],
  "advice": "給主人的初步建議（30字以內）",
  "urgency": "low 或 medium 或 high（low=可觀察，medium=近期就診，high=立即就醫）",
  "specialties": ["從以下清單選出最相關的1-3個專科：${KNOWN_TAGS.join('、')}"],
  "extractedSymptoms": ["萃取後的關鍵症狀詞，供搜尋使用"]
}`

  const data = await callGemini(prompt)

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 500 })
  }

  const text = extractText(data)
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    if (parsed.specialties) {
      parsed.specialties = parsed.specialties.filter((t: string) => KNOWN_TAGS.includes(t))
    }
    // 回傳萃取後的症狀詞，讓前端可以用來更新搜尋
    if (!parsed.extractedSymptoms) {
      parsed.extractedSymptoms = processedSymptoms
    }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
