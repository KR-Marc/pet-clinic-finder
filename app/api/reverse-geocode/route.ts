import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  const debug = req.nextUrl.searchParams.get('debug') === '1'
  if (!lat || !lng) return NextResponse.json({ error: 'missing lat/lng' }, { status: 400 })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=zh-TW&key=${key}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK' || !data.results?.length) {
      return NextResponse.json({ district: null, status: data.status })
    }

    if (debug) {
      return NextResponse.json({ components: data.results[0]?.address_components ?? [] })
    }

    // 台灣的行政區「區」在 administrative_area_level_2
    for (const result of data.results) {
      for (const component of result.address_components as { long_name: string; types: string[] }[]) {
        if (
          component.types.includes('administrative_area_level_2') ||
          component.types.includes('administrative_area_level_3') ||
          component.types.includes('sublocality_level_1')
        ) {
          if (component.long_name.endsWith('區')) {
            return NextResponse.json({ district: component.long_name })
          }
        }
      }
    }

    return NextResponse.json({ district: null })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
