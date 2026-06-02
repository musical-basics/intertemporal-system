import { Fragment } from 'react'

export default function Loading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ height: 13, width: 160, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 40, width: 280, background: 'var(--cream-dark)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: 440, background: 'var(--cream-dark)', borderRadius: 4 }} />
      </div>

      {/* Status banner skeleton */}
      <div className="status-banner" style={{ marginBottom: 28, background: 'var(--cream-dark)', border: 'none' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cream-border)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 11, width: 120, background: 'var(--cream-border)', borderRadius: 4 }} />
          <div style={{ height: 22, width: 260, background: 'var(--cream-border)', borderRadius: 4 }} />
          <div style={{ height: 13, width: 340, background: 'var(--cream-border)', borderRadius: 4 }} />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="week-grid">
        <div />
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="week-grid-day-label" style={{ color: 'var(--cream-border)' }}>{d}</div>
        ))}
        {[0,1].map(row => (
          <Fragment key={row}>
            <div key={`label-${row}`} />
            {[0,1,2,3,4,5,6].map(col => (
              <div key={`${row}-${col}`} style={{
                background: 'var(--cream-dark)',
                borderRadius: 12,
                minHeight: 120,
                animation: 'shimmer 1.4s ease infinite',
                opacity: 0.6 + col * 0.04,
              }} />
            ))}
          </Fragment>
        ))}
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
