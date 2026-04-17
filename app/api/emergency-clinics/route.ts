import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // 用 rpc 呼叫原始 SQL，避免 JS client 陣列查詢問題
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, specialty_tags, lat, lng')
    .order('rating', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // server side filter
  const filtered = (data ?? []).filter((c: { specialty_tags: string[] }) =>
    c.specialty_tags?.includes('24H急診')
  )

  return NextResponse.json(filtered)
}
