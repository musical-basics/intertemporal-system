import { supabase } from '@/lib/supabase'
import { BLOCKS, getWeekStart, formatWeekStart } from '@/lib/blocks'
import ReportClient from '@/components/ReportClient'

export const dynamic = 'force-dynamic'

async function getReportData(weekStart: string) {
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('block_id, duration_minutes, logged_at, activity')
    .eq('week_start', weekStart)
    .order('logged_at', { ascending: true })

  return logs ?? []
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const thisWeek = formatWeekStart(getWeekStart(now))
  const weekStart = params.week ?? thisWeek

  const logs = await getReportData(weekStart)

  // Aggregate per block
  const byBlock: Record<string, { total_logs: number; total_minutes: number; activities: string[] }> = {}
  for (const log of logs) {
    if (!byBlock[log.block_id]) {
      byBlock[log.block_id] = { total_logs: 0, total_minutes: 0, activities: [] }
    }
    byBlock[log.block_id].total_logs++
    byBlock[log.block_id].total_minutes += log.duration_minutes ?? 0
    byBlock[log.block_id].activities.push(log.activity)
  }

  const totalLogs = logs.length
  const totalMinutes = logs.reduce((s, l) => s + (l.duration_minutes ?? 0), 0)

  return (
    <>
      <div className="page-header">
        <p className="page-header-eyebrow">Productivity Report</p>
        <h1 className="page-title">Which Lionels are thriving?</h1>
        <p className="page-subtitle">
          Compare productivity across your 14 blocks — see who's swamped, who has capacity, and how your week is really distributed.
        </p>
      </div>

      <ReportClient
        blocks={BLOCKS}
        byBlock={byBlock}
        totalLogs={totalLogs}
        totalMinutes={totalMinutes}
        weekStart={weekStart}
        thisWeek={thisWeek}
      />
    </>
  )
}
