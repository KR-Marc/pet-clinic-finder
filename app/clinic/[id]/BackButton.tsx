'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-mist hover:text-snow text-sm font-medium transition-colors"
    >
      ← 回搜尋結果
    </button>
  )
}
