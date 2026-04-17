import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'missing address' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=zh-TW&key=${key}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.[0]) {
    return NextResponse.json({ error: 'geocode failed', status: data.status }, { status: 400 })
  }

  const { lat, lng } = data.results[0].geometry.location
  return NextResponse.json({ lat, lng })
}
