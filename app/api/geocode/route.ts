import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  if (!checkRateLimit(getIp(req), 30)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'missing address' }, { status: 400 })
  if (address.length > 200) return NextResponse.json({ error: 'address too long' }, { status: 400 })

  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=zh-TW&key=${key}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.[0]) {
    return NextResponse.json({ error: 'geocode failed', status: data.status }, { status: 400 })
  }

  const { lat, lng } = data.results[0].geometry.location
  return NextResponse.json({ lat, lng })
}
