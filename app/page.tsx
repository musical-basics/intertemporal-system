import { BLOCKS, getCurrentBlock, getWeekStart, formatWeekStart } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'
import WeekGrid from '@/components/WeekGrid'
import StatusBanner from '@/components/StatusBanner'
import { format, addDays } from 'date-fns'

// Types
interface Responsibility {
  id: string
  block_id: string
  title: string
  fixed_start_time?: string
  fixed_end_time?: string
}

interface LogCount {
  block_id: string
  count: number
}

async function getPageData() {
  const now = new Date()
  const currentBlock = getCurrentBlock()
  const weekStart = formatWeekStart(getWeekStart(now))

  // Fetch responsibilities for all blocks
  const { data: responsibilities } = await supabase
    .from('responsibilities')
    .select('id, block_id, title, fixed_start_time, fixed_end_time')
    .eq('is_recurring', true)

  // Fetch log counts per block for this week
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('block_id')
    .eq('week_start', weekStart)

  // Aggregate counts
  const logCounts: Record<string, number> = {}
  for (const log of logs ?? []) {
    logCounts[log.block_id] = (logCounts[log.block_id] ?? 0) + 1
  }

  return { currentBlock, responsibilities: responsibilities ?? [], logCounts, weekStart, now }
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { currentBlock, responsibilities, logCounts, weekStart, now } = await getPageData()

  // Build week label (Mon Jun 2 – Sun Jun 8)
  const weekStartDate = new Date(weekStart + 'T00:00:00')
  const weekEndDate = addDays(weekStartDate, 6)
  const weekLabel = `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d, yyyy')}`

  return (
    <>
      <div className="page-header">
        <p className="page-header-eyebrow">Week of {weekLabel}</p>
        <h1 className="page-title">Your 14 Lionels</h1>
        <p className="page-subtitle">
          Every morning and evening is a distinct version of you — each with their own responsibilities, energy, and capacity.
        </p>
      </div>

      <StatusBanner currentBlock={currentBlock} now={now.toISOString()} />

      <WeekGrid
        blocks={BLOCKS}
        currentBlockId={currentBlock?.id ?? null}
        responsibilities={responsibilities}
        logCounts={logCounts}
        weekLabel={weekLabel}
      />
    </>
  )
}
