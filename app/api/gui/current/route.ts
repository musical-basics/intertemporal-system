import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentBlock, getBlockForTime, isRestPeriod, getRestPeriodLabel, formatWeekStart, getWeekStart } from '@/lib/blocks'

// This GUI endpoint does NOT require bearer auth (for browser-side calls)
// It's read-only for the current block status
export async function GET(_request: NextRequest) {
  const now = new Date()
  const block = getCurrentBlock()
  const inRest = isRestPeriod(now)
  const weekStart = formatWeekStart(getWeekStart(now))

  if (inRest) {
    return Response.json({
      is_rest_period: true,
      rest_label: getRestPeriodLabel(now),
      block: null,
    })
  }

  if (!block) {
    return Response.json({ error: 'Could not determine current block' }, { status: 500 })
  }

  return Response.json({
    is_rest_period: false,
    rest_label: null,
    block: {
      id: block.id,
      label: block.label,
      period: block.period,
      emoji: block.emoji,
      color: block.color,
    },
    week_start: weekStart,
  })
}
