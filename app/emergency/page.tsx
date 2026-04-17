import type { Metadata } from 'next'
import EmergencyClient from './EmergencyClient'

export const metadata: Metadata = {
  title: '台北寵物24H急診動物醫院 | 寵物專科診所搜尋',
  description: '台北市24小時寵物急診動物醫院完整清單，提供即時電話與地址，緊急時快速找到最近的急診動物醫院。',
}

export default function EmergencyPage() {
  return <EmergencyClient />
}
