import { toZonedTime } from 'date-fns-tz'
import { Block, TIMEZONE } from '@/lib/blocks'

export function formatEasternTime(date: Date): string {
  const eastern = toZonedTime(date, TIMEZONE)
  let hour = eastern.getHours()
  const minute = eastern.getMinutes()
  const suffix = hour >= 12 ? 'pm' : 'am'

  hour %= 12
  if (hour === 0) hour = 12

  return minute === 0
    ? `${hour}${suffix}`
    : `${hour}:${String(minute).padStart(2, '0')}${suffix}`
}

export function humanDuration(minutes?: number | null): string | null {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

export function narrateLog(input: {
  block: Block
  activity: string
  logged_at: Date
  duration_minutes?: number | null
}): string {
  const base = `${input.block.label} ${input.activity.trim()} at ${formatEasternTime(input.logged_at)}`
  const duration = humanDuration(input.duration_minutes)

  return duration ? `${base}, took ${duration}.` : `${base}.`
}
