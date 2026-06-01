'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Block, getBlockById } from '@/lib/blocks'
import { format, parseISO } from 'date-fns'
import { Send, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react'

interface Log {
  id: string
  block_id: string
  logged_at: string
  activity: string
  duration_minutes?: number
  source: 'agent' | 'gui'
  notes?: string
  week_start: string
}

interface Props {
  initialLogs: Log[]
  blocks: Block[]
  currentBlockId: string | null
  selectedBlockId: string
  weekStart: string
  thisWeek: string
}

function getWeekRange(weekStart: string) {
  const d = new Date(weekStart + 'T00:00:00')
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  return `${format(d, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

function addWeeks(weekStart: string, n: number): string {
  const d = new Date(weekStart + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

export default function LogClient({
  initialLogs, blocks, currentBlockId, selectedBlockId, weekStart, thisWeek
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logs, setLogs] = useState<Log[]>(initialLogs)

  // Quick-log form state
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [logBlockId, setLogBlockId] = useState(currentBlockId ?? 'mon_morning')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(params)
    startTransition(() => router.push(`/log?${sp.toString()}`))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activity.trim()) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/gui/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: activity.trim(),
          duration_minutes: duration ? parseInt(duration) : undefined,
          block_id: logBlockId,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.log) {
        setLogs(prev => [data.log, ...prev])
        setSuccessMsg(`Logged under ${data.resolved_block?.label ?? 'your block'} ✓`)
        setActivity('')
        setDuration('')
        setNotes('')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const block = logBlockId ? getBlockById(logBlockId) : null

  return (
    <>
      {/* Quick Log Form */}
      <form className="quick-log-form" onSubmit={handleSubmit}>
        <div className="quick-log-title">
          {block ? `${block.emoji} Quick Log — ${block.label}` : '⚡ Quick Log'}
        </div>
        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field grow">
            <label className="form-label">What did you do?</label>
            <input
              className="form-input"
              value={activity}
              onChange={e => setActivity(e.target.value)}
              placeholder="e.g. Cleaned the car, prepared lesson plan, called mom…"
              required
            />
          </div>
          <div className="form-field sm">
            <label className="form-label">Minutes</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field md">
            <label className="form-label">Which Lionel?</label>
            <select
              className="form-select"
              value={logBlockId}
              onChange={e => setLogBlockId(e.target.value)}
            >
              {blocks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field grow">
            <label className="form-label">Notes (optional)</label>
            <input
              className="form-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any context…"
            />
          </div>
          <div className="form-field" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-primary" type="submit" disabled={submitting || !activity.trim()}>
              <Send size={14} />
              {submitting ? 'Logging…' : 'Log it'}
            </button>
          </div>
        </div>
        {successMsg && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
            ✓ {successMsg}
          </div>
        )}
      </form>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <button
            className={`filter-chip${selectedBlockId === 'all' ? ' active' : ''}`}
            onClick={() => navigate({ block: 'all', week: weekStart })}
          >
            All Lionels
          </button>
          {blocks.map(b => (
            <button
              key={b.id}
              className={`filter-chip${selectedBlockId === b.id ? ' active' : ''}`}
              onClick={() => navigate({ block: b.id, week: weekStart })}
            >
              {b.emoji} {b.label.replace(' Lionel', '')}
            </button>
          ))}
        </div>

        {/* Week selector */}
        <div className="week-selector">
          <button
            className="week-selector-btn"
            onClick={() => navigate({ block: selectedBlockId, week: addWeeks(weekStart, -1) })}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="week-selector-label">{getWeekRange(weekStart)}</span>
          <button
            className="week-selector-btn"
            onClick={() => navigate({ block: selectedBlockId, week: addWeeks(weekStart, 1) })}
            disabled={weekStart >= thisWeek}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="card-body">
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No logs yet</div>
              <div className="empty-state-text">
                Use the Quick Log above or message your AI agent to start tracking what the Lionels are up to.
              </div>
            </div>
          ) : (
            <div className="activity-feed">
              {logs.map((log, i) => {
                const blk = getBlockById(log.block_id)
                const time = new Date(log.logged_at).toLocaleTimeString('en-US', {
                  timeZone: 'America/New_York',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
                const date = new Date(log.logged_at).toLocaleDateString('en-US', {
                  timeZone: 'America/New_York',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <div key={log.id} className="activity-item fade-in" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                    <div className="activity-avatar" style={{ borderColor: blk?.color + '50' }}>
                      {blk?.emoji ?? '🕐'}
                    </div>
                    <div className="activity-body">
                      <div className="activity-header">
                        <span className="activity-who" style={{ color: blk?.color }}>
                          {blk?.label ?? log.block_id}
                        </span>
                        <span className="source-badge" style={{ background: log.source === 'agent' ? 'var(--purple-light)' : 'var(--green-light)', color: log.source === 'agent' ? 'var(--purple)' : 'var(--green)' }}>
                          {log.source}
                        </span>
                      </div>
                      <div className="activity-text">{log.activity}</div>
                      {log.notes && (
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, fontStyle: 'italic' }}>
                          "{log.notes}"
                        </div>
                      )}
                      <div className="activity-meta">
                        <span className="meta-tag"><Clock size={10} /> {date} at {time}</span>
                        {log.duration_minutes && (
                          <span className="duration-tag">⏱ {log.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
