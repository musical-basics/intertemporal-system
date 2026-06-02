export default function Loading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ height: 13, width: 180, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 40, width: 340, background: 'var(--cream-dark)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: 500, background: 'var(--cream-dark)', borderRadius: 4 }} />
      </div>

      {/* Stat cards skeleton */}
      <div className="report-grid" style={{ marginBottom: 24 }}>
        {[1,2].map(i => (
          <div key={i} className="stat-card" style={{ animation: 'shimmer 1.4s ease infinite', animationDelay: `${i * 0.1}s` }}>
            <div style={{ height: 11, width: 140, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 40, width: 80, background: 'var(--cream-border)', borderRadius: 6, marginBottom: 6 }} />
            <div style={{ height: 12, width: 180, background: 'var(--cream-dark)', borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--cream-border)' }}>
          <div style={{ height: 20, width: 180, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 13, width: 260, background: 'var(--cream-dark)', borderRadius: 4 }} />
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ height: 280, background: 'var(--cream-dark)', borderRadius: 8, animation: 'shimmer 1.4s ease infinite' }} />
        </div>
      </div>

      {/* Capacity skeleton */}
      <div className="card">
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--cream-border)' }}>
          <div style={{ height: 20, width: 160, background: 'var(--cream-dark)', borderRadius: 4 }} />
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', animation: 'shimmer 1.4s ease infinite', animationDelay: `${i * 0.07}s` }}>
              <div style={{ width: 24, height: 20, background: 'var(--cream-dark)', borderRadius: 4 }} />
              <div style={{ width: 180, height: 12, background: 'var(--cream-dark)', borderRadius: 4 }} />
              <div style={{ flex: 1, height: 6, background: 'var(--cream-dark)', borderRadius: 3 }} />
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
