import { supabase } from '@/lib/supabase'
import { BLOCKS, getCurrentBlock, getWeekStart, formatWeekStart, getBlockById } from '@/lib/blocks'
import LogClient from '@/components/LogClient'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

async function getLogs(blockId?: string, weekStart?: string) {
  const now = new Date()
  const thisWeek = formatWeekStart(getWeekStart(now))
  const resolvedWeek = weekStart ?? thisWeek

  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('week_start', resolvedWeek)
    .order('logged_at', { ascending: false })
    .limit(100)

  if (blockId && blockId !== 'all') {
    query = query.eq('block_id', blockId)
  }

  const { data, error } = await query
  return { logs: data ?? [], thisWeek, error }
}

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ block?: string; week?: string }>
}) {
  const params = await searchParams
  const blockId = params.block ?? 'all'
  const weekStart = params.week
  const currentBlock = getCurrentBlock()

  const { logs, thisWeek } = await getLogs(blockId, weekStart)
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

      <LogClient
        initialLogs={logs}
        blocks={BLOCKS}
        currentBlockId={currentBlock?.id ?? null}
        selectedBlockId={blockId}
        weekStart={resolvedWeek}
        thisWeek={thisWeek}
      />
    </>
  )
}
