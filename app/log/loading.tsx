export default function Loading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ height: 13, width: 120, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 40, width: 380, background: 'var(--cream-dark)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: 460, background: 'var(--cream-dark)', borderRadius: 4 }} />
      </div>

      {/* Quick log form skeleton */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ height: 18, width: 200, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, height: 38, background: 'var(--cream-dark)', borderRadius: 8 }} />
          <div style={{ width: 100, height: 38, background: 'var(--cream-dark)', borderRadius: 8 }} />
          <div style={{ width: 90, height: 38, background: 'var(--cream-border)', borderRadius: 8 }} />
        </div>
      </div>

      {/* Activity items skeleton */}
      <div className="card">
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '16px 0',
              borderBottom: i < 5 ? '1px solid var(--cream-border)' : 'none',
              animation: 'shimmer 1.4s ease infinite',
              animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-dark)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 12, width: 180, background: 'var(--cream-dark)', borderRadius: 4 }} />
                <div style={{ height: 14, width: `${60 + i * 8}%`, background: 'var(--cream-border)', borderRadius: 4 }} />
                <div style={{ height: 11, width: 140, background: 'var(--cream-dark)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
