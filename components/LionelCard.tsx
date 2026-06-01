'use client'
import Link from 'next/link'
import { Block } from '@/lib/blocks'
import { BookOpen } from 'lucide-react'

interface Responsibility {
  block_id: string
  title: string
  fixed_start_time?: string
  fixed_end_time?: string
}

interface Props {
  block: Block
  isCurrent: boolean
  responsibilities: Responsibility[]
  logCount: number
  animDelay?: number
}

function formatTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}${m > 0 ? `:${String(m).padStart(2,'0')}` : ''}${suffix}`
}

export default function LionelCard({ block, isCurrent, responsibilities, logCount, animDelay = 0 }: Props) {
  const classes = [
    'lionel-card',
    isCurrent ? 'is-current' : '',
  ].filter(Boolean).join(' ')

  return (
    <Link
      href={`/log?block=${block.id}`}
      className={classes}
      style={{
        '--block-color': block.color,
        animationDelay: `${animDelay}s`,
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span className="card-emoji">{block.emoji}</span>
        {isCurrent && <span className="card-current-badge">Now</span>}
      </div>

      <div className="card-label">
        {block.label.replace(' Lionel', '')}
      </div>

      {responsibilities.length > 0 && (
        <div className="card-responsibilities">
          {responsibilities.slice(0, 2).map((r, i) => (
            <span key={i} className="card-resp-tag">
              {r.fixed_start_time ? `${formatTime(r.fixed_start_time)} ` : ''}{r.title}
            </span>
          ))}
          {responsibilities.length > 2 && (
            <span className="card-resp-tag">+{responsibilities.length - 2} more</span>
          )}
        </div>
      )}

      <div className="card-stats">
        {logCount > 0 ? (
          <span className="card-log-count">
            <BookOpen size={10} />
            {logCount} {logCount === 1 ? 'log' : 'logs'}
          </span>
        ) : (
          <span className="card-log-count" style={{ opacity: 0.5 }}>No logs yet</span>
        )}
      </div>
    </Link>
  )
}
