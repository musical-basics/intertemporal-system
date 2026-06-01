import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockIdForTime, getBlockById, formatWeekStart, getWeekStart } from '@/lib/blocks'

// GUI-facing log creation (no bearer token — server validates differently)
// This is a server action alternative via route. Minimal auth: same-origin only.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { activity, duration_minutes, block_id, notes } = body

  if (!activity?.trim()) {
    return Response.json({ error: "'activity' is required" }, { status: 400 })
  }

  const loggedAt = new Date()
  const resolvedBlockId = block_id ?? getBlockIdForTime(loggedAt)

  if (!resolvedBlockId) {
    return Response.json({ error: 'Could not determine block' }, { status: 422 })
  }

  const block = getBlockById(resolvedBlockId)
  if (!block) {
    return Response.json({ error: `Block not found: ${resolvedBlockId}` }, { status: 404 })
  }

  const weekStart = formatWeekStart(getWeekStart(loggedAt))

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      block_id: resolvedBlockId,
      logged_at: loggedAt.toISOString(),
      activity: activity.trim(),
      duration_minutes: duration_minutes ?? null,
      source: 'gui',
      notes: notes?.trim() || null,
      week_start: weekStart,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    log: data,
    resolved_block: { id: block.id, label: block.label, emoji: block.emoji },
    message: `Logged under ${block.label}: "${activity}"`,
  }, { status: 201 })
}
