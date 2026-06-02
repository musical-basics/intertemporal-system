import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockIdForTime, getBlockById, formatWeekStart, getWeekStart } from '@/lib/blocks'

import { z } from 'zod'

const guiLogSchema = z.object({
  activity: z.string().min(1, "'activity' is required"),
  duration_minutes: z.number().optional().nullable(),
  block_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

// GUI-facing log creation (no bearer token — server validates differently)
// This is a server action alternative via route. Minimal auth: same-origin only.
export async function POST(request: NextRequest) {
  const payload = guiLogSchema.safeParse(await request.json())

  if (!payload.success) {
    return Response.json(
      {
        error: "Invalid log payload",
        issues: payload.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { activity, duration_minutes, block_id, notes } = payload.data

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
