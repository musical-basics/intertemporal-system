import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockById } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { createBlockResponsibilitySchema, parseJsonBody } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { blockId } = await params
  const block = getBlockById(blockId)
  if (!block) {
    return Response.json({ error: `Block '${blockId}' not found` }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('responsibilities')
    .select('*')
    .eq('block_id', blockId)
    .order('fixed_start_time', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    block: {
      id: block.id,
      label: block.label,
      period: block.period,
      day_of_week: block.day_of_week,
      emoji: block.emoji,
    },
    responsibilities: data ?? [],
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { blockId } = await params
  const block = getBlockById(blockId)
  if (!block) {
    return Response.json({ error: `Block '${blockId}' not found` }, { status: 404 })
  }

  const payload = await parseJsonBody(
    request,
    createBlockResponsibilitySchema,
    'Invalid responsibility payload'
  )
  if (payload instanceof Response) return payload

  const { title, description, fixed_start_time, fixed_end_time, is_recurring = true } = payload.data

  const { data, error } = await supabase
    .from('responsibilities')
    .insert({ block_id: blockId, title, description, fixed_start_time, fixed_end_time, is_recurring })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
