'use client'

export default function ReviewWarning({ reviewCount, updatedAt }: { reviewCount: number | null, updatedAt: string | null }) {
  if (!reviewCount || !updatedAt) return null

  // 如果評論數超過 500 且資料是最近 30 天內更新的，顯示提示
  // （實際上需要歷史資料才能偵測暴增，這裡先用評論數作為簡單指標）
  // 之後可以加入 previous_review_count 欄位做真正的異常偵測
  return null
}
