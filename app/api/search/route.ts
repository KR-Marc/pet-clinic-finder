import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q') ?? ''
  const pet = searchParams.get('pet') ?? ''
  const district = searchParams.get('district') ?? ''

  // ── Browse mode: empty query → return all clinics sorted by district ──
  if (!q.trim()) {
    let query = supabase
      .from('clinics')
      .select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })

    if (pet && pet !== 'both') {
      query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    }
    if (district) {
      query = query.eq('district', district)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // ── Search mode: resolve symptom keyword → specialty_tags ──
  const { data: symptoms, error: symptomError } = await supabase
    .from('symptoms')
    .select('specialty_tag')
    .eq('keyword', q)

  if (symptomError) {
    return NextResponse.json({ error: symptomError.message }, { status: 500 })
  }

  const tags = [...new Set(symptoms?.map((s) => s.specialty_tag) ?? [])]

  let query = tags.length > 0
    ? supabase.from('clinics').select('*').overlaps('specialty_tags', tags)
    : supabase.from('clinics').select('*').contains('specialty_tags', [q])

  if (pet && pet !== 'both') {
    query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  }
  if (district) {
    query = query.eq('district', district)
  }

  const { data: clinics, error: clinicError } = await query
  if (clinicError) {
    return NextResponse.json({ error: clinicError.message }, { status: 500 })
  }

  return NextResponse.json(clinics)
}
