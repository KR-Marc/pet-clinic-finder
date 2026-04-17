import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, district, address, phone, rating, specialty_tags, lat, lng')
    .overlaps('specialty_tags', ['24H急診'])
    .order('rating', { ascending: false })

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
