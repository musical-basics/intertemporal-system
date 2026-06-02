import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentBlock, isRestPeriod, getRestPeriodLabel, formatWeekStart, getWeekStart } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const now = new Date()
  const block = getCurrentBlock()
  const inRest = isRestPeriod(now)
  const weekStart = formatWeekStart(getWeekStart(now))

  if (inRest) {
    return Response.json({
      is_rest_period: true,
      rest_label: getRestPeriodLabel(now),
      block: null,
      responsibilities: [],
      recent_logs: [],
      week_start: weekStart,
      timestamp: now.toISOString(),
    })
  }

  if (!block) {
    return Response.json({ error: 'Could not determine current block' }, { status: 500 })
  }

  const [respResult, logsResult] = await Promise.all([
    supabase
      .from('responsibilities')
      .select('*')
      .eq('block_id', block.id)
      .order('fixed_start_time', { ascending: true }),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('block_id', block.id)
      .eq('week_start', weekStart)
      .order('logged_at', { ascending: false })
      .limit(10),
  ])

  return Response.json({
    is_rest_period: false,
    rest_label: null,
    block: {
      id: block.id,
      label: block.label,
      period: block.period,
      day_of_week: block.day_of_week,
      emoji: block.emoji,
      color: block.color,
    },
    responsibilities: respResult.data ?? [],
    recent_logs: logsResult.data ?? [],
    week_start: weekStart,
    timestamp: now.toISOString(),
  })
}
