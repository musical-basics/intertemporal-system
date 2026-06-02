import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getBlockById } from '@/lib/blocks'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth-middleware'
import { parseJsonBody, updateResponsibilitySchema } from '@/lib/validation'

function notFound(id: string) {
  return Response.json({ error: `Responsibility '${id}' not found` }, { status: 404 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { id } = await params
  const { data, error } = await supabase
    .from('responsibilities')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return notFound(id)

  return Response.json({ responsibility: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { id } = await params
  const payload = await parseJsonBody(
    request,
    updateResponsibilitySchema,
    'Invalid responsibility payload'
  )
  if (payload instanceof Response) return payload

  if (payload.data.block_id && !getBlockById(payload.data.block_id)) {
    return Response.json({ error: `Block '${payload.data.block_id}' not found` }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('responsibilities')
    .update({
      ...payload.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return notFound(id)

  return Response.json({ responsibility: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse()

  const { id } = await params
  const { data, error } = await supabase
    .from('responsibilities')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return notFound(id)

  return Response.json({ ok: true, deleted_id: id })
}
