import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')
  const pet = searchParams.get('pet')
  const district = searchParams.get('district')

  if (!q) {
    return NextResponse.json([])
  }

  // Step 1: Look up specialty_tags from symptoms table using keyword
  const { data: symptoms, error: symptomError } = await supabase
    .from('symptoms')
    .select('specialty_tag')
    .eq('keyword', q)

  if (symptomError) {
    return NextResponse.json({ error: symptomError.message }, { status: 500 })
  }

  // Collect unique specialty tags
  const tags = [...new Set(symptoms?.map((s) => s.specialty_tag) ?? [])]

  if (tags.length === 0) {
    // If no symptom match, try direct keyword match against specialty_tags
    let query = supabase
      .from('clinics')
      .select('*')
      .contains('specialty_tags', [q])

    if (pet && pet !== 'both') {
      query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
    }
    if (district) {
      query = query.eq('district', district)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  // Step 2: Query clinics with overlapping specialty_tags (GIN array overlap)
  let query = supabase
    .from('clinics')
    .select('*')
    .overlaps('specialty_tags', tags)

  // Step 3: Filter by pet type
  if (pet && pet !== 'both') {
    query = query.or(`pet_types.cs.{${pet}},pet_types.cs.{both}`)
  }

  // Step 4: Filter by district
  if (district) {
    query = query.eq('district', district)
  }

  const { data: clinics, error: clinicError } = await query

  if (clinicError) {
    return NextResponse.json({ error: clinicError.message }, { status: 500 })
  }

  return NextResponse.json(clinics)
}
