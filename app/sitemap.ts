import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pet-clinic-finder.vercel.app'

  // 靜態頁面
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/emergency`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ]

  // 動態診所頁面
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id')

  const clinicRoutes: MetadataRoute.Sitemap = (clinics ?? []).map((c) => ({
    url: `${baseUrl}/clinic/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...clinicRoutes]
}
