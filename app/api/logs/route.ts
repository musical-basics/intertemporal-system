import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockById, formatWeekStart, getAttributedWeekStart, resolveBlockForTime } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { narrateLog } from '@/lib/logging'
import { logSchema, parseJsonBody } from '@/lib/validation'

// GET /api/logs?block_id=mon_evening&week_start=2026-06-01&limit=50&source=agent
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get('block_id')
  const weekStart = searchParams.get('week_start')
  const source = searchParams.get('source')
  const shiftStatus = searchParams.get('shift_status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(limit)

  if (blockId) query = query.eq('block_id', blockId)
  if (weekStart) query = query.eq('week_start', weekStart)
  if (source) query = query.eq('source', source)
  if (shiftStatus) query = query.eq('shift_status', shiftStatus)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ logs: data ?? [], count: data?.length ?? 0 })
}

// POST /api/logs
// Body: { activity, duration_minutes?, logged_at?, notes?, block_id? }
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const payload = await parseJsonBody(request, logSchema, "Invalid log payload")
  if (payload instanceof Response) return payload

  const { activity, duration_minutes, logged_at, notes, block_id } = payload.data

  const loggedAt = logged_at ? new Date(logged_at) : new Date()
  const attribution = resolveBlockForTime(loggedAt)
  const resolvedBlockId = block_id ?? attribution.block_id

  const block = getBlockById(resolvedBlockId)
  if (!block) {
    return Response.json({ error: `Block '${resolvedBlockId}' not found` }, { status: 404 })
  }

  const weekStart = formatWeekStart(getAttributedWeekStart(loggedAt))
  const narrative = narrateLog({
    block,
    activity,
    logged_at: loggedAt,
    duration_minutes,
  })

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      block_id: resolvedBlockId,
      logged_at: loggedAt.toISOString(),
      activity,
      duration_minutes: duration_minutes ?? null,
      source: 'agent',
      shift_status: attribution.shift_status,
      notes: notes ?? null,
      week_start: weekStart,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    log: data,
    resolved_block: {
      id: block.id,
      label: block.label,
      emoji: block.emoji,
    },
    shift_status: attribution.shift_status,
    narrative,
    message: narrative,
  }, { status: 201 })
}
