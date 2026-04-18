export default function Loading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-clay-bg)' }}>
      {/* Skeleton top bar（手機）*/}
      <div style={{
        height: 52, borderBottom: '1px solid var(--color-clay-border)',
        background: 'rgba(250,247,242,0.85)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* Skeleton search bar */}
        <div style={{
          height: 52, borderRadius: 12, marginBottom: 16,
          background: 'var(--color-clay-border)',
          opacity: 0.5, animation: 'clay-pulse 1.4s ease-in-out infinite',
        }} />

        {/* Skeleton filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[60, 44, 44].map((w, i) => (
            <div key={i} style={{
              height: 32, width: w, borderRadius: 999,
              background: 'var(--color-clay-border)',
              opacity: 0.4, animation: 'clay-pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>

        {/* Skeleton result count */}
        <div style={{
          height: 20, width: 120, borderRadius: 6, marginBottom: 20,
          background: 'var(--color-clay-border)',
          opacity: 0.4, animation: 'clay-pulse 1.4s ease-in-out infinite',
        }} />

        {/* Skeleton cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              background: 'var(--color-clay-surface)',
              border: '1px solid var(--color-clay-border)',
              borderRadius: 14, padding: 18,
              animation: 'clay-pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }}>
              <div style={{
                height: 18, width: '60%', borderRadius: 6, marginBottom: 10,
                background: 'var(--color-clay-border)', opacity: 0.6,
              }} />
              <div style={{
                height: 13, width: '40%', borderRadius: 6, marginBottom: 8,
                background: 'var(--color-clay-border)', opacity: 0.4,
              }} />
              <div style={{
                height: 13, width: '80%', borderRadius: 6, marginBottom: 14,
                background: 'var(--color-clay-border)', opacity: 0.4,
              }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[50, 50, 60].map((w, j) => (
                  <div key={j} style={{
                    height: 22, width: w, borderRadius: 6,
                    background: 'var(--color-clay-border)', opacity: 0.35,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes clay-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </main>
  )
}
