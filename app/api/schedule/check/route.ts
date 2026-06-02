import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { checkScheduleWindow } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'

const checkSchema = z.object({
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
})

// POST /api/schedule/check
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const payload = checkSchema.safeParse(await request.json())

  if (!payload.success) {
    return Response.json(
      {
        error: "Invalid schedule check payload",
        issues: payload.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

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
