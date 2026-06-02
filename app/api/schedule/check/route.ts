import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkScheduleWindow } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { parseJsonBody, scheduleCheckSchema } from '@/lib/validation'

// POST /api/schedule/check
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const payload = await parseJsonBody(
    request,
    scheduleCheckSchema,
    "Invalid schedule check payload"
  )
  if (payload instanceof Response) return payload

  const { data: responsibilities, error } = await supabase
    .from('responsibilities')
    .select('*')
    .eq('is_recurring', true)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const result = checkScheduleWindow(payload.data.startAt, payload.data.endAt, responsibilities ?? [])

  return Response.json(result)
}
