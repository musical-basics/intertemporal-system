import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'

// GET /api/report?week_start=2026-06-01
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')

  let query = supabase
    .from('activity_logs')
    .select('block_id, duration_minutes, logged_at, activity')
    .order('logged_at', { ascending: true })

  if (weekStart) query = query.eq('week_start', weekStart)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const logs = data ?? []

  // Aggregate per block
  const blockMap: Record<string, {
    total_logs: number
    total_minutes: number
    avg_minutes: number | null
    activities: string[]
  }> = {}

  for (const log of logs) {
    if (!blockMap[log.block_id]) {
      blockMap[log.block_id] = { total_logs: 0, total_minutes: 0, avg_minutes: null, activities: [] }
    }
    blockMap[log.block_id].total_logs++
    if (log.duration_minutes) blockMap[log.block_id].total_minutes += log.duration_minutes
    blockMap[log.block_id].activities.push(log.activity)
  }

  // Compute averages
  for (const blockId of Object.keys(blockMap)) {
    const b = blockMap[blockId]
    if (b.total_logs > 0 && b.total_minutes > 0) {
      b.avg_minutes = Math.round(b.total_minutes / b.total_logs)
    }
  }

  // Find busiest and most free blocks
  const sorted = Object.entries(blockMap).sort((a, b) => b[1].total_minutes - a[1].total_minutes)
  const busiest = sorted.slice(0, 3).map(([id]) => id)
  const mostFree = sorted.slice(-3).map(([id]) => id)

  return Response.json({
    week_start: weekStart,
    total_logs: logs.length,
    total_minutes: logs.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0),
    by_block: blockMap,
    busiest_blocks: busiest,
    most_free_blocks: mostFree,
  })
}
