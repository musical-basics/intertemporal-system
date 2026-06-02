import { BLOCKS, getWeekStart, formatWeekStart } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'
import ReportClient from '@/components/ReportClient'
import { buildWeeklyReport } from '@/lib/report'
import { Suspense } from 'react'
import { connection } from 'next/server'

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const thisWeek = formatWeekStart(getWeekStart(now))
  const weekStart = params.week ?? thisWeek

  return (
    <>
      <div className="page-header">
        <p className="page-header-eyebrow">Productivity Report</p>
        <h1 className="page-title">Which Lionels are thriving?</h1>
        <p className="page-subtitle">
          Compare productivity across your 14 blocks and see who is swamped, balanced, busy, or open.
        </p>
      </div>

      <Suspense fallback={<ReportSkeleton />}>
        <ReportDataLoader weekStart={weekStart} thisWeek={thisWeek} />
      </Suspense>
    </>
  )
}

async function ReportDataLoader({ weekStart, thisWeek }: { weekStart: string; thisWeek: string }) {
  await connection()

  const [{ data: logs }, { data: responsibilities }] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('block_id, duration_minutes, logged_at, activity')
      .eq('week_start', weekStart)
      .order('logged_at', { ascending: true }),
    supabase
      .from('responsibilities')
      .select('block_id, fixed_start_time, fixed_end_time')
      .eq('is_recurring', true)
  ])

  const report = buildWeeklyReport(logs ?? [], responsibilities ?? [], weekStart)

  return (
    <ReportClient
      blocks={BLOCKS}
      byBlock={report.by_block}
      totalLogs={report.total_logs}
      totalMinutes={report.total_minutes}
      totals={report.totals}
      weekStart={weekStart}
      thisWeek={thisWeek}
    />
  )
}

function ReportSkeleton() {
  return (
    <>
      <div className="report-grid" style={{ marginBottom: 24 }}>
        {[1, 2].map(i => (
          <div key={i} className="stat-card">
            <div style={{ height: 11, width: 140, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 40, width: 80, background: 'var(--cream-border)', borderRadius: 6, marginBottom: 6 }} />
            <div style={{ height: 12, width: 180, background: 'var(--cream-dark)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--cream-border)' }}>
          <div style={{ height: 20, width: 180, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 6 }} />
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ height: 280, background: 'var(--cream-dark)', borderRadius: 8, animation: 'shimmer 1.4s ease infinite' }} />
        </div>
      </div>
      <style>{`@keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:.9} }`}</style>
    </>
  )
}
