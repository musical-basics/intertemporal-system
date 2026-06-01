'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Block, getBlockById } from '@/lib/blocks'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Zap } from 'lucide-react'

interface BlockStats {
  total_logs: number
  total_minutes: number
  activities: string[]
}

interface Props {
  blocks: Block[]
  byBlock: Record<string, BlockStats>
  totalLogs: number
  totalMinutes: number
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const block = payload[0]?.payload?.block as Block | undefined
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
          {payload[0].value} minutes logged
        </div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
          {payload[0]?.payload?.logs} activities
        </div>
      </div>
    )
  }
  return null
}

export default function ReportClient({ blocks, byBlock, totalLogs, totalMinutes, weekStart, thisWeek }: Props) {
  const router = useRouter()

  function navigate(week: string) {
    router.push(`/report?week=${week}`)
  }

  // Build chart data
  const chartData = blocks.map(b => ({
    id: b.id,
    name: b.label.replace(' Lionel', '').replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)day? /, ''),
    shortName: b.id.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1,3)).join(' '),
    minutes: byBlock[b.id]?.total_minutes ?? 0,
    logs: byBlock[b.id]?.total_logs ?? 0,
    block: b,
  }))

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 1)

  // Sort for top/bottom
  const sorted = [...chartData].sort((a, b) => b.minutes - a.minutes)
  const topThree = sorted.slice(0, 3).filter(d => d.minutes > 0)
  const bottomThree = sorted.slice(-3).filter(d => d.minutes === 0 || true).filter(d => d.minutes < sorted[0].minutes)

  const hasData = totalLogs > 0

  return (
    <>
      {/* Week Selector */}
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
          {hasData ? `${totalLogs} activities · ${totalMinutes} minutes tracked` : 'No data for this week yet'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="report-grid">
        <div className="stat-card fade-in fade-in-delay-1">
          <div className="stat-label"><BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />Activities Logged</div>
          <div className="stat-value">{totalLogs}</div>
          <div className="stat-sublabel">across all Lionels this week</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-2">
          <div className="stat-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Total Time Tracked</div>
          <div className="stat-value">{totalMinutes >= 60 ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : `${totalMinutes}m`}</div>
          <div className="stat-sublabel">of logged activity time</div>
        </div>
      </div>

      {!hasData ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No data yet for this week</div>
              <div className="empty-state-text">
                Start logging activities via the Log tab or your AI agent, and this page will fill up with insights.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="card fade-in fade-in-delay-3" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="flex-between">
                <div>
                  <div className="section-title">Minutes by Lionel</div>
                  <div className="section-subtitle" style={{ marginBottom: 0 }}>Total tracked time per block this week</div>
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
                  <Bar dataKey="minutes" radius={[4,4,0,0]}>
                    {chartData.map(entry => (
                      <Cell
                        key={entry.id}
                        fill={entry.minutes > 0 ? entry.block.color : 'var(--cream-border)'}
                        opacity={entry.minutes > 0 ? 0.85 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Capacity Grid */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="section-title">Capacity Heatmap</div>
              <div className="section-subtitle" style={{ marginBottom: 0 }}>
                Which Lionels are swamped vs. free?
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blocks.map(b => {
                  const stats = byBlock[b.id]
                  const mins = stats?.total_minutes ?? 0
                  const pct = Math.min((mins / maxMinutes) * 100, 100)
                  const level = pct > 70 ? 'high' : pct > 30 ? 'medium' : 'low'
                  return (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{b.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', minWidth: 180, flexShrink: 0 }}>
                        {b.label}
                      </span>
                      <div className="capacity-bar" style={{ flex: 1 }}>
                        <div className="capacity-bar-track">
                          <div
                            className={`capacity-bar-fill ${level}`}
                            style={{ width: `${Math.max(pct, mins > 0 ? 3 : 0)}%`, backgroundColor: b.color }}
                          />
                        </div>
                        <span className="capacity-bar-label">
                          {mins > 0 ? `${mins}m` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Busiest Lionels */}
          {topThree.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div className="card-header">
                  <div className="section-title">🔥 Most Productive</div>
                </div>
                <div className="card-body" style={{ paddingTop: 12 }}>
                  {topThree.map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topThree.length - 1 ? '1px solid var(--cream-border)' : 'none' }}>
                      <span style={{ fontSize: 18 }}>{d.block.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: d.block.color }}>{d.block.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{d.logs} activities · {d.minutes} min</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="section-title">💤 Most Capacity</div>
                </div>
                <div className="card-body" style={{ paddingTop: 12 }}>
                  {bottomThree.slice(0, 3).map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--cream-border)' : 'none' }}>
                      <span style={{ fontSize: 18 }}>{d.block.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: d.block.color }}>{d.block.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{d.logs > 0 ? `${d.logs} activities · ${d.minutes} min` : 'Nothing logged yet'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
