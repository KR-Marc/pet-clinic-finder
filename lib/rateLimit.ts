// Shared in-memory rate limiter
// Note: resets on cold start — sufficient for current traffic scale
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  ip: string,
  limit = 30,
  windowMs = 60 * 1000
): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export function getIp(req: Request): string {
  const forwarded = (req as { headers: Headers }).headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim()
    ?? (req as { headers: Headers }).headers.get('x-real-ip')
    ?? 'unknown'
}
