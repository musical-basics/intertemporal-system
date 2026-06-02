import { z } from 'zod'

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Use HH:MM or HH:MM:SS time.')

export const logSchema = z.object({
  activity: z.string().trim().min(1, "'activity' is required"),
  duration_minutes: z.number().int().positive().optional().nullable(),
  logged_at: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  block_id: z.string().trim().optional().nullable(),
})

export const guiLogSchema = logSchema.omit({ logged_at: true })

export const scheduleCheckSchema = z.object({
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
})

export const createResponsibilitySchema = z.object({
  block_id: z.string().trim().min(1, "'block_id' is required"),
  title: z.string().trim().min(1, "'title' is required"),
  description: z.string().trim().optional().nullable(),
  fixed_start_time: timeSchema.optional().nullable(),
  fixed_end_time: timeSchema.optional().nullable(),
  is_recurring: z.boolean().optional(),
})

export const createBlockResponsibilitySchema = createResponsibilitySchema.omit({ block_id: true })

export const updateResponsibilitySchema = createResponsibilitySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  })

export function validationErrorResponse(error: z.ZodError, message: string) {
  const flattened = error.flatten()

  return Response.json(
    {
      error: message,
      issues: flattened.fieldErrors,
      form_errors: flattened.formErrors,
    },
    { status: 400 }
  )
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  message: string
): Promise<{ data: z.infer<T> } | Response> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body', issues: {}, form_errors: [] },
      { status: 400 }
    )
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return validationErrorResponse(parsed.error, message)

  return { data: parsed.data }
}
