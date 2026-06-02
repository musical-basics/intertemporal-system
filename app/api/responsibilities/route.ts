import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockById } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { createResponsibilitySchema, parseJsonBody } from '@/lib/validation'

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const blockId = searchParams.get('block_id')

  let query = supabase
    .from('responsibilities')
    .select('*')
    .order('block_id', { ascending: true })
    .order('fixed_start_time', { ascending: true })

  if (blockId) query = query.eq('block_id', blockId)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    responsibilities: data ?? [],
    count: data?.length ?? 0,
  })
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const payload = await parseJsonBody(
    request,
    createResponsibilitySchema,
    'Invalid responsibility payload'
  )
  if (payload instanceof Response) return payload

  const { block_id, title, description, fixed_start_time, fixed_end_time, is_recurring } = payload.data

  if (!getBlockById(block_id)) {
    return Response.json({ error: `Block '${block_id}' not found` }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('responsibilities')
    .insert({
      block_id,
      title,
      description: description ?? null,
      fixed_start_time: fixed_start_time ?? null,
      fixed_end_time: fixed_end_time ?? null,
      is_recurring: is_recurring ?? true,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ responsibility: data }, { status: 201 })
}
