import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { keyword, clinic_count, is_ai_fallback } = await req.json()
  if (!keyword) return NextResponse.json({ ok: false })

  await supabase.from('search_logs').insert({
    keyword: keyword.slice(0, 200),
    clinic_count: clinic_count ?? 0,
    is_ai_fallback: is_ai_fallback ?? false,
  })

  return NextResponse.json({ ok: true })
}
