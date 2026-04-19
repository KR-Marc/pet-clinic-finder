import type { NextConfig } from "next";

const securityHeaders = [
  // 防止 clickjacking：禁止被嵌入 iframe
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // 防止 MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 強制 HTTPS（1 年）
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // 控制 referrer 資訊，避免洩漏內部 URL
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 限制瀏覽器功能，降低攻擊面
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // XSS 防護（現代瀏覽器靠 CSP，但舊瀏覽器靠這個）
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // CSP：限制資源來源
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 需要 unsafe-inline/eval
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com https://streetviewpixels-pa.googleapis.com",
      "frame-src https://www.google.com",
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://maps.googleapis.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
