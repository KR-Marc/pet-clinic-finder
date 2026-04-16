/**
 * 從 Google Maps Place Details 抓取每間診所的評論數，寫入 review_count 欄位
 * 執行方式：npx tsx --env-file=.env.local scripts/update-review-count.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DELAY_MS = 300

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function getReviewCount(name: string, address: string): Promise<number | null> {
  const query = encodeURIComponent(`${name} ${address} 台北`)
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`

  const searchRes = await fetch(searchUrl)
  const searchData = await searchRes.json()
  const placeId = searchData.results?.[0]?.place_id
  if (!placeId) return null

  const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=user_ratings_total&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`
  const detailRes = await fetch(detailUrl)
  const detailData = await detailRes.json()
  return detailData.result?.user_ratings_total ?? null
}

async function main() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, address')
    .is('review_count', null)
    .order('name')

  if (!clinics?.length) {
    console.log('沒有需要更新的診所')
    return
  }

  console.log(`共 ${clinics.length} 間診所需要更新評論數\n`)
  let success = 0, fail = 0

  for (const clinic of clinics) {
    try {
      const count = await getReviewCount(clinic.name, clinic.address ?? '')
      if (count !== null) {
        await supabase
          .from('clinics')
          .update({ review_count: count, updated_at: new Date().toISOString() })
          .eq('id', clinic.id)
        console.log(`✓ ${clinic.name}: ${count} 則評論`)
        success++
      } else {
        console.log(`- ${clinic.name}: 找不到`)
        fail++
      }
    } catch (e) {
      console.log(`✗ ${clinic.name}: 錯誤`)
      fail++
    }
    await sleep(DELAY_MS)
  }

  console.log(`\n完成！成功: ${success}，失敗: ${fail}`)
}

main()
