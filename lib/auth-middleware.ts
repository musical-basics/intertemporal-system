import { NextRequest } from 'next/server'

export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.substring(7)
  return token === process.env.AGENT_API_KEY
}

export function unauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized. Provide a valid Bearer token.' },
    { status: 401 }
  )
}
