import { BLOCKS, getCurrentBlock, getWeekStart, formatWeekStart } from '@/lib/blocks'
import { supabase } from '@/lib/supabase'
import LogClient from '@/components/LogClient'
import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'

// ─── Static shell — renders in <50ms ────────────────────────────────────────
export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ block?: string; week?: string }>
}) {
  const params = await searchParams
  const blockId = params.block ?? 'all'
  const weekStart = params.week

  const now = new Date()
  const thisWeek = formatWeekStart(getWeekStart(now))
  const currentBlock = getCurrentBlock()
  const resolvedWeek = weekStart ?? thisWeek

  return (
    <>
      <div className="page-header">
        <p className="page-header-eyebrow">Activity Log</p>
        <h1 className="page-title">What have the Lionels been up to?</h1>
        <p className="page-subtitle">
          Every logged activity, organized by the Lionel who did it. Log from here or via your AI agent.
        </p>
      </div>

      <Suspense fallback={<LogSkeleton />}>
        <LogDataLoader
          blockId={blockId}
          resolvedWeek={resolvedWeek}
          thisWeek={thisWeek}
          currentBlockId={currentBlock?.id ?? null}
        />
      </Suspense>
    </>
  )
}

// ─── Async data component — only this waits for Supabase ────────────────────
async function LogDataLoader({
  blockId,
  resolvedWeek,
  thisWeek,
  currentBlockId,
}: {
  blockId: string
  resolvedWeek: string
  thisWeek: string
  currentBlockId: string | null
}) {
  noStore()

  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('week_start', resolvedWeek)
    .order('logged_at', { ascending: false })
    .limit(100)

  if (blockId !== 'all') {
    query = query.eq('block_id', blockId)
  }

  const { data } = await query

  return (
    <LogClient
      initialLogs={data ?? []}
      blocks={BLOCKS}
      currentBlockId={currentBlockId}
      selectedBlockId={blockId}
      weekStart={resolvedWeek}
      thisWeek={thisWeek}
    />
  )
}

// ─── Inline skeleton ─────────────────────────────────────────────────────────
function LogSkeleton() {
  return (
    <>
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ height: 18, width: 200, background: 'var(--cream-dark)', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, height: 38, background: 'var(--cream-dark)', borderRadius: 8 }} />
          <div style={{ width: 100, height: 38, background: 'var(--cream-dark)', borderRadius: 8 }} />
          <div style={{ width: 90, height: 38, background: 'var(--cream-border)', borderRadius: 8 }} />
        </div>
      </div>
      <div className="card">
        <div style={{ padding: '20px 24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '16px 0',
              borderBottom: i < 4 ? '1px solid var(--cream-border)' : 'none',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-dark)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 12, width: 180, background: 'var(--cream-dark)', borderRadius: 4 }} />
                <div style={{ height: 14, width: `${55 + i * 8}%`, background: 'var(--cream-border)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
