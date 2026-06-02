'use client'
import { useRouter } from 'next/navigation'
import { Block } from '@/lib/blocks'
import type { BlockReport, ReportStatus } from '@/lib/report'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Zap } from 'lucide-react'

interface Props {
  blocks: Block[]
  byBlock: Record<string, BlockReport>
  totalLogs: number
  totalMinutes: number
  totals: {
    committedMinutes: number
    allocatedMinutes: number
    remainingMinutes: number
  }
  weekStart: string
  thisWeek: string
}

const STATUS_STYLE: Record<ReportStatus, { label: string; background: string; color: string }> = {
  open: { label: 'Open', background: 'var(--green-light)', color: 'var(--green)' },
  balanced: { label: 'Balanced', background: 'var(--teal-100)', color: 'var(--teal-700)' },
  busy: { label: 'Busy', background: 'var(--amber-light)', color: 'var(--amber)' },
  swamped: { label: 'Swamped', background: 'var(--red-light)', color: 'var(--red)' },
}

function getWeekRange(weekStart: string) {
  const d = new Date(weekStart + 'T00:00:00')
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  return `${format(d, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
}

function addWeeks(weekStart: string, n: number): string {
  const d = new Date(weekStart + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

function formatMinutes(total: number) {
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

function StatusPill({ status }: { status: ReportStatus }) {
  const style = STATUS_STYLE[status]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 72,
      padding: '3px 8px',
      borderRadius: 6,
      background: style.background,
      color: style.color,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      {style.label}
    </span>
  )
}

type TooltipRow = {
  block?: Block
  allocated: number
  logged: number
  committed: number
  remaining: number
}

type TooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: TooltipRow }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const block = payload[0]?.payload?.block
    const row = payload[0]?.payload
    if (!row) return null

    return (
      <div style={{
        background: 'white',
        border: '1px solid var(--cream-border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: block?.color }}>
          {block?.emoji} {block?.label}
        </div>
        <div style={{ color: 'var(--ink-muted)' }}>
          {formatMinutes(row.allocated)} allocated
        </div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
          {formatMinutes(row.logged)} logged, {formatMinutes(row.committed)} committed
        </div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
          {formatMinutes(row.remaining)} remaining
        </div>
      </div>
    )
  }
  return null
}

export default function ReportClient({
  blocks,
  byBlock,
  totalLogs,
  totalMinutes,
  totals,
  weekStart,
  thisWeek,
}: Props) {
  const router = useRouter()

  function navigate(week: string) {
    router.push(`/report?week=${week}`)
  }

  const chartData = blocks.map(b => ({
    id: b.id,
    name: b.label.replace(' Lionel', '').replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)day? /, ''),
    shortName: b.id.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1,3)).join(' '),
    allocated: byBlock[b.id]?.allocatedMinutes ?? 0,
    logged: byBlock[b.id]?.loggedMinutes ?? 0,
    committed: byBlock[b.id]?.committedMinutes ?? 0,
    remaining: byBlock[b.id]?.remainingMinutes ?? 0,
    utilization: byBlock[b.id]?.utilization ?? 0,
    status: byBlock[b.id]?.status ?? 'open',
    logs: byBlock[b.id]?.total_logs ?? 0,
    block: b,
  }))

  const sortedByLoad = [...chartData].sort((a, b) => b.allocated - a.allocated)
  const sortedByCapacity = [...chartData].sort((a, b) => b.remaining - a.remaining)
  const topThree = sortedByLoad.slice(0, 3)
  const capacityThree = sortedByCapacity.slice(0, 3)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="week-selector">
          <button className="week-selector-btn" onClick={() => navigate(addWeeks(weekStart, -1))}>
            <ChevronLeft size={15} />
          </button>
          <span className="week-selector-label">{getWeekRange(weekStart)}</span>
          <button
            className="week-selector-btn"
            onClick={() => navigate(addWeeks(weekStart, 1))}
            disabled={weekStart >= thisWeek}
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {totalLogs} activities · {formatMinutes(totalMinutes)} logged · {formatMinutes(totals.committedMinutes)} committed
        </div>
      </div>

      <div className="report-grid">
        <div className="stat-card fade-in fade-in-delay-1">
          <div className="stat-label"><BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />Activities Logged</div>
          <div className="stat-value">{totalLogs}</div>
          <div className="stat-sublabel">across all Lionels this week</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-2">
          <div className="stat-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Total Time Tracked</div>
          <div className="stat-value">{formatMinutes(totalMinutes)}</div>
          <div className="stat-sublabel">of logged activity time</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-3">
          <div className="stat-label"><Zap size={12} style={{ display: 'inline', marginRight: 4 }} />Committed Time</div>
          <div className="stat-value">{formatMinutes(totals.committedMinutes)}</div>
          <div className="stat-sublabel">{formatMinutes(totals.remainingMinutes)} open across the week</div>
        </div>
      </div>

      <div className="card fade-in fade-in-delay-3" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="flex-between">
            <div>
              <div className="section-title">Allocated Minutes by Lionel</div>
              <div className="section-subtitle" style={{ marginBottom: 0 }}>Committed and logged time per block this week</div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 10, fill: 'var(--ink-faint)' }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="allocated" radius={[4,4,0,0]}>
                {chartData.map(entry => (
                  <Cell
                    key={entry.id}
                    fill={entry.allocated > 0 ? entry.block.color : 'var(--cream-border)'}
                    opacity={entry.allocated > 0 ? 0.85 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="section-title">Capacity Status</div>
          <div className="section-subtitle" style={{ marginBottom: 0 }}>
            Four-state load by Lionel
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blocks.map(b => {
              const stats = byBlock[b.id]
              const pct = Math.min((stats?.utilization ?? 0) * 100, 100)
              const allocated = stats?.allocatedMinutes ?? 0

              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{b.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', minWidth: 184, flexShrink: 0 }}>
                    {b.label}
                  </span>
                  <div className="capacity-bar" style={{ flex: '1 1 220px', minWidth: 180 }}>
                    <div className="capacity-bar-track">
                      <div
                        className="capacity-bar-fill"
                        style={{ width: `${Math.max(pct, allocated > 0 ? 3 : 0)}%`, backgroundColor: b.color }}
                      />
                    </div>
                    <span className="capacity-bar-label">
                      {formatMinutes(allocated)}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-faint)', minWidth: 138 }}>
                    {formatMinutes(stats?.loggedMinutes ?? 0)} logged, {formatMinutes(stats?.committedMinutes ?? 0)} fixed
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', minWidth: 86 }}>
                    {formatMinutes(stats?.remainingMinutes ?? 0)} left
                  </span>
                  <StatusPill status={stats?.status ?? 'open'} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="section-title">Highest Load</div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {topThree.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topThree.length - 1 ? '1px solid var(--cream-border)' : 'none' }}>
                <span style={{ fontSize: 18 }}>{d.block.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: d.block.color }}>{d.block.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{formatMinutes(d.allocated)} allocated · {d.logs} activities</div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="section-title">Most Capacity</div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {capacityThree.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < capacityThree.length - 1 ? '1px solid var(--cream-border)' : 'none' }}>
                <span style={{ fontSize: 18 }}>{d.block.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: d.block.color }}>{d.block.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{formatMinutes(d.remaining)} remaining · {formatMinutes(d.allocated)} allocated</div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
