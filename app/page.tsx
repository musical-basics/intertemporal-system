import { BLOCKS, getCurrentBlock, getWeekStart, formatWeekStart } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'
import WeekGrid from '@/components/WeekGrid'
import StatusBanner from '@/components/StatusBanner'
import { Fragment, Suspense } from 'react'
import { format, addDays } from 'date-fns'
import { connection } from 'next/server'

export default function DashboardPage() {
  const now = new Date()
  const currentBlock = getCurrentBlock()
  const weekStart = formatWeekStart(getWeekStart(now))
  const weekStartDate = new Date(weekStart + 'T00:00:00')
  const weekEndDate = addDays(weekStartDate, 6)
  const weekLabel = `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`

  return (
    <>
      <div className="page-header">
        <p className="page-header-eyebrow">Week of {weekLabel}</p>
        <h1 className="page-title">Your 14 Lionels</h1>
        <p className="page-subtitle">
          Every morning and evening is a distinct version of you - each with their own responsibilities, energy, and capacity.
        </p>
      </div>

      <StatusBanner currentBlock={currentBlock} now={now.toISOString()} />

      <Suspense fallback={<WeekGridSkeleton />}>
        <WeekDataLoader weekStart={weekStart} currentBlock={currentBlock} weekLabel={weekLabel} />
      </Suspense>
    </>
  )
}

async function WeekDataLoader({
  weekStart,
  currentBlock,
  weekLabel,
}: {
  weekStart: string
  currentBlock: ReturnType<typeof getCurrentBlock>
  weekLabel: string
}) {
  await connection()

  const [{ data: responsibilities }, { data: logs }] = await Promise.all([
    supabase
      .from('responsibilities')
      .select('id, block_id, title, fixed_start_time, fixed_end_time')
      .eq('is_recurring', true),
    supabase
      .from('activity_logs')
      .select('block_id')
      .eq('week_start', weekStart),
  ])

  const logCounts: Record<string, number> = {}
  for (const log of logs ?? []) {
    logCounts[log.block_id] = (logCounts[log.block_id] ?? 0) + 1
  }

  return (
    <WeekGrid
      blocks={BLOCKS}
      currentBlockId={currentBlock?.id ?? null}
      responsibilities={responsibilities ?? []}
      logCounts={logCounts}
      weekLabel={weekLabel}
    />
  )
}

function WeekGridSkeleton() {
  return (
    <div className="week-grid">
      <div />
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
        <div key={d} className="week-grid-day-label" style={{ color: 'var(--cream-border)' }}>{d}</div>
      ))}
      {[0, 1].map(row => (
        <Fragment key={row}>
          <div key={`lbl-${row}`} />
          {[0,1,2,3,4,5,6].map(col => (
            <div key={`${row}-${col}`} style={{
              background: 'var(--cream-dark)',
              borderRadius: 12,
              minHeight: 120,
              animation: 'shimmer 1.4s ease infinite',
              animationDelay: `${(row * 7 + col) * 0.04}s`,
              opacity: 0.7,
            }} />
          ))}
        </Fragment>
      ))}
    </div>
  )
}
