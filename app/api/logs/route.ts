import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockForTime, getBlockById, isRestPeriod, formatWeekStart, getWeekStart, getBlockIdForTime } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'

// GET /api/logs?block_id=mon_evening&week_start=2026-06-01&limit=50&source=agent
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get('block_id')
  const weekStart = searchParams.get('week_start')
  const source = searchParams.get('source')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(limit)

  if (blockId) query = query.eq('block_id', blockId)
  if (weekStart) query = query.eq('week_start', weekStart)
  if (source) query = query.eq('source', source)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ logs: data ?? [], count: data?.length ?? 0 })
}

import { z } from 'zod'

const logSchema = z.object({
  activity: z.string().min(1, "'activity' is required"),
  duration_minutes: z.number().optional().nullable(),
  logged_at: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().optional().nullable(),
  block_id: z.string().optional().nullable()
})

// POST /api/logs
// Body: { activity, duration_minutes?, logged_at?, notes?, block_id? }
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const payload = logSchema.safeParse(await request.json())

  if (!payload.success) {
    return Response.json(
      {
        error: "Invalid log payload",
        issues: payload.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { activity, duration_minutes, logged_at, notes, block_id } = payload.data

  // Determine the timestamp for this log entry
  const loggedAt = logged_at ? new Date(logged_at) : new Date()

  // Determine which block this falls into
  let resolvedBlockId: string | null = block_id ?? getBlockIdForTime(loggedAt)

  // If still in a rest period, assign to the nearest adjacent block
  if (!resolvedBlockId) {
    // Fallback: find the nearest non-rest block (look back up to 2h)
    const fallback = new Date(loggedAt.getTime() - 2 * 60 * 60 * 1000)
    resolvedBlockId = getBlockIdForTime(fallback)
  }

  if (!resolvedBlockId) {
    return Response.json({
      error: 'Could not determine block for this timestamp. Provide block_id explicitly.',
    }, { status: 422 })
  }

  const block = getBlockById(resolvedBlockId)
  if (!block) {
    return Response.json({ error: `Block '${resolvedBlockId}' not found` }, { status: 404 })
  }

  const weekStart = formatWeekStart(getWeekStart(loggedAt))

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      block_id: resolvedBlockId,
      logged_at: loggedAt.toISOString(),
      activity,
      duration_minutes: duration_minutes ?? null,
      source: 'agent',
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
    message: `Logged under ${block.label}: "${activity}"${duration_minutes ? ` (${duration_minutes} min)` : ''}`,
  }, { status: 201 })
}
