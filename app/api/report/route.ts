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

  const { data: responsibilitiesData } = await supabase
    .from('responsibilities')
    .select('block_id, fixed_start_time, fixed_end_time')
    .eq('is_recurring', true)

  const responsibilities = responsibilitiesData ?? []

  const blockMap: Record<string, {
    total_logs: number
    total_minutes: number
    capacity_minutes: number
    committed_minutes: number
    remaining_minutes: number
    utilization: number
    status: 'open' | 'balanced' | 'busy' | 'swamped'
    activities: string[]
  }> = {}

  for (const log of logs) {
    if (!blockMap[log.block_id]) {
      blockMap[log.block_id] = { total_logs: 0, total_minutes: 0, capacity_minutes: 480, committed_minutes: 0, remaining_minutes: 0, utilization: 0, status: 'open', activities: [] }
    }
    blockMap[log.block_id].total_logs++
    if (log.duration_minutes) blockMap[log.block_id].total_minutes += log.duration_minutes
    blockMap[log.block_id].activities.push(log.activity)
  }

  // Ensure all blocks with responsibilities are represented even if no logs
  for (const resp of responsibilities) {
    if (!blockMap[resp.block_id]) {
       blockMap[resp.block_id] = { total_logs: 0, total_minutes: 0, capacity_minutes: 480, committed_minutes: 0, remaining_minutes: 0, utilization: 0, status: 'open', activities: [] }
    }
    if (resp.fixed_start_time && resp.fixed_end_time) {
       const [startH, startM] = resp.fixed_start_time.split(':').map(Number)
       const [endH, endM] = resp.fixed_end_time.split(':').map(Number)
       const duration = (endH * 60 + endM) - (startH * 60 + startM)
       blockMap[resp.block_id].committed_minutes += Math.max(0, duration)
    }
  }

  // Compute final capacity metrics
  for (const blockId of Object.keys(blockMap)) {
    const b = blockMap[blockId]
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

  // Find busiest and most free blocks based on allocatedMinutes / remainingMinutes
  const sorted = Object.entries(blockMap).sort((a, b) => 
    (b[1].total_minutes + b[1].committed_minutes) - (a[1].total_minutes + a[1].committed_minutes)
  )
  const busiest = sorted.slice(0, 3).map(([id]) => id)
  const mostFree = [...sorted].sort((a, b) => b[1].remaining_minutes - a[1].remaining_minutes).slice(0, 3).map(([id]) => id)

  return Response.json({
    week_start: weekStart,
    total_logs: logs.length,
    total_minutes: logs.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0),
    by_block: blockMap,
    busiest_blocks: busiest,
    most_free_blocks: mostFree,
  })
}
