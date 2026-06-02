import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { buildWeeklyReport } from '@/lib/report'

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

  const { data: responsibilitiesData, error: responsibilitiesError } = await supabase
    .from('responsibilities')
    .select('block_id, fixed_start_time, fixed_end_time')
    .eq('is_recurring', true)

  if (responsibilitiesError) {
    return Response.json({ error: responsibilitiesError.message }, { status: 500 })
  }

  return Response.json(buildWeeklyReport(logs, responsibilitiesData ?? [], weekStart))
}
