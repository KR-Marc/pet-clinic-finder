'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BackButton() {
  const router = useRouter()
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.back()}
        className="text-mist hover:text-snow text-sm font-medium transition-colors"
      >
        ← 回上頁
      </button>
      <Link
        href="/search"
        className="text-mist/40 hover:text-mist text-xs transition-colors"
      >
        搜尋頁
      </Link>
    </div>
  )
}
