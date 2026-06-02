import { BLOCKS, getWeekStart, formatWeekStart } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'
import ReportClient from '@/components/ReportClient'
import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'

// ─── Static shell — renders in <50ms ────────────────────────────────────────
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
          Compare productivity across your 14 blocks — see who's swamped, who has capacity, and how your week is really distributed.
        </p>
      </div>

      <Suspense fallback={<ReportSkeleton />}>
        <ReportDataLoader weekStart={weekStart} thisWeek={thisWeek} />
      </Suspense>
    </>
  )
}

// ─── Async data component — only this waits for Supabase ────────────────────
async function ReportDataLoader({ weekStart, thisWeek }: { weekStart: string; thisWeek: string }) {
  noStore()

  const [{ data: logs }, { data: responsibilitiesData }] = await Promise.all([
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

  const responsibilities = responsibilitiesData ?? []

  const byBlock: Record<string, { total_logs: number; total_minutes: number; capacity_minutes: number; committed_minutes: number; remaining_minutes: number; utilization: number; status: 'open' | 'balanced' | 'busy' | 'swamped'; activities: string[] }> = {}
  
  for (const log of logs ?? []) {
    if (!byBlock[log.block_id]) {
      byBlock[log.block_id] = { total_logs: 0, total_minutes: 0, capacity_minutes: 480, committed_minutes: 0, remaining_minutes: 0, utilization: 0, status: 'open', activities: [] }
    }
    byBlock[log.block_id].total_logs++
    byBlock[log.block_id].total_minutes += log.duration_minutes ?? 0
    byBlock[log.block_id].activities.push(log.activity)
  }

  // Add responsibilities
  for (const resp of responsibilities) {
    if (!byBlock[resp.block_id]) {
       byBlock[resp.block_id] = { total_logs: 0, total_minutes: 0, capacity_minutes: 480, committed_minutes: 0, remaining_minutes: 0, utilization: 0, status: 'open', activities: [] }
    }
    if (resp.fixed_start_time && resp.fixed_end_time) {
       const [startH, startM] = resp.fixed_start_time.split(':').map(Number)
       const [endH, endM] = resp.fixed_end_time.split(':').map(Number)
       const duration = (endH * 60 + endM) - (startH * 60 + startM)
       byBlock[resp.block_id].committed_minutes += Math.max(0, duration)
    }
  }

  // Compute final metrics
  for (const blockId of Object.keys(byBlock)) {
    const b = byBlock[blockId]
    const allocatedMinutes = b.total_minutes + b.committed_minutes
    b.remaining_minutes = Math.max(0, b.capacity_minutes - allocatedMinutes)
    b.utilization = Math.min(1, allocatedMinutes / b.capacity_minutes)

    if (b.utilization >= 0.88 || b.remaining_minutes <= 45) {
      b.status = 'swamped'
    } else if (b.utilization >= 0.68) {
      b.status = 'busy'
    } else if (b.utilization <= 0.25) {
      b.status = 'open'
    } else {
      b.status = 'balanced'
    }
  }

  const totalLogs = (logs ?? []).length
  const totalMinutes = (logs ?? []).reduce((s, l) => s + (l.duration_minutes ?? 0), 0)

  return (
    <ReportClient
      blocks={BLOCKS}
      byBlock={byBlock}
      totalLogs={totalLogs}
      totalMinutes={totalMinutes}
      weekStart={weekStart}
      thisWeek={thisWeek}
    />
  )
}

// ─── Inline skeleton ─────────────────────────────────────────────────────────
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
