import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockById, formatWeekStart, getAttributedWeekStart, resolveBlockForTime } from '@/lib/blocks'
import { narrateLog } from '@/lib/logging'
import { guiLogSchema, parseJsonBody } from '@/lib/validation'

// GUI-facing log creation (no bearer token - server validates differently)
// This is a server action alternative via route. Minimal auth: same-origin only.
export async function POST(request: NextRequest) {
  const payload = await parseJsonBody(request, guiLogSchema, "Invalid log payload")
  if (payload instanceof Response) return payload

  const { activity, duration_minutes, block_id, notes } = payload.data

  const loggedAt = new Date()
  const attribution = resolveBlockForTime(loggedAt)
  const resolvedBlockId = block_id ?? attribution.block_id

  const block = getBlockById(resolvedBlockId)
  if (!block) {
    return Response.json({ error: `Block not found: ${resolvedBlockId}` }, { status: 404 })
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
      activity: activity.trim(),
      duration_minutes: duration_minutes ?? null,
      source: 'gui',
      shift_status: attribution.shift_status,
      notes: notes?.trim() || null,
      week_start: weekStart,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    log: data,
    resolved_block: { id: block.id, label: block.label, emoji: block.emoji },
    shift_status: attribution.shift_status,
    narrative,
    message: narrative,
  }, { status: 201 })
}
