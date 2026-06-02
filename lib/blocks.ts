import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfWeek } from 'date-fns'

export const TIMEZONE = 'America/New_York'

export type Period = 'morning' | 'evening'

export interface Block {
  id: string
  label: string
  day_of_week: number // 0=Sun, 1=Mon ... 6=Sat
  period: Period
  start_time: string
  end_time: string
  color: string
  emoji: string
}

// The canonical 14 blocks — mirrors the DB seed data
export const BLOCKS: Block[] = [
  { id: 'sun_morning', label: 'Sunday Morning Lionel',    day_of_week: 0, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#7C6CAF', emoji: '⛪' },
  { id: 'sun_evening', label: 'Sunday Evening Lionel',    day_of_week: 0, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#9B59B6', emoji: '🌆' },
  { id: 'mon_morning', label: 'Monday Morning Lionel',    day_of_week: 1, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#1A5C6B', emoji: '🌅' },
  { id: 'mon_evening', label: 'Monday Evening Lionel',    day_of_week: 1, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#1A7A8A', emoji: '🌙' },
  { id: 'tue_morning', label: 'Tuesday Morning Lionel',   day_of_week: 2, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#2E6B3E', emoji: '🌅' },
  { id: 'tue_evening', label: 'Tuesday Evening Lionel',   day_of_week: 2, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#D4A853', emoji: '📡' },
  { id: 'wed_morning', label: 'Wednesday Morning Lionel', day_of_week: 3, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#1A5C6B', emoji: '🌅' },
  { id: 'wed_evening', label: 'Wednesday Evening Lionel', day_of_week: 3, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#1A7A8A', emoji: '🌙' },
  { id: 'thu_morning', label: 'Thursday Morning Lionel',  day_of_week: 4, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#2E6B3E', emoji: '🌅' },
  { id: 'thu_evening', label: 'Thursday Evening Lionel',  day_of_week: 4, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#8B6914', emoji: '🎹' },
  { id: 'fri_morning', label: 'Friday Morning Lionel',    day_of_week: 5, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#1A5C6B', emoji: '🌅' },
  { id: 'fri_evening', label: 'Friday Evening Lionel',    day_of_week: 5, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#C0392B', emoji: '🎉' },
  { id: 'sat_morning', label: 'Saturday Morning Lionel',  day_of_week: 6, period: 'morning', start_time: '06:00', end_time: '14:00', color: '#2E6B3E', emoji: '🌅' },
  { id: 'sat_evening', label: 'Saturday Evening Lionel',  day_of_week: 6, period: 'evening', start_time: '16:00', end_time: '00:00', color: '#9B59B6', emoji: '🌆' },
]

const DAY_PREFIX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/**
 * Determines if a given UTC timestamp falls in a rest period (nap or night sleep) in EST.
 * Rest windows: 02:00–06:00 (night), 14:00–16:00 (nap)
 */
export function isRestPeriod(utcDate: Date = new Date()): boolean {
  const est = toZonedTime(utcDate, TIMEZONE)
  const hours = est.getHours()
  const minutes = est.getMinutes()
  const totalMinutes = hours * 60 + minutes

  // Night sleep: 00:00 to 06:00 (0 to 360 min)
  if (totalMinutes < 6 * 60) return true
  // Nap: 14:00 to 16:00 (840 to 960 min)
  if (totalMinutes >= 14 * 60 && totalMinutes < 16 * 60) return true
  return false
}

/**
 * Get the block ID for a given UTC timestamp in EST.
 * Returns null if currently in a rest period.
 */
export function getBlockIdForTime(utcDate: Date = new Date()): string | null {
  if (isRestPeriod(utcDate)) return null

  const est = toZonedTime(utcDate, TIMEZONE)
  const dayOfWeek = est.getDay() // 0=Sun
  const hours = est.getHours()
  const totalMinutes = hours * 60 + est.getMinutes()

  const dayPrefix = DAY_PREFIX[dayOfWeek]
  let period: Period

  if (totalMinutes >= 6 * 60 && totalMinutes < 14 * 60) {
    period = 'morning'
  } else {
    period = 'evening'
  }

  return `${dayPrefix}_${period}`
}

/**
 * Get the full Block object for a given UTC timestamp.
 */
export function getBlockForTime(utcDate: Date = new Date()): Block | null {
  const blockId = getBlockIdForTime(utcDate)
  if (!blockId) return null
  return BLOCKS.find(b => b.id === blockId) ?? null
}

/**
 * Get the current active block (right now in EST).
 */
export function getCurrentBlock(): Block | null {
  return getBlockForTime(new Date())
}

/**
 * Get the Monday (week_start) of the week containing a given UTC date, in EST.
 */
export function getWeekStart(utcDate: Date = new Date()): Date {
  const est = toZonedTime(utcDate, TIMEZONE)
  const monday = startOfWeek(est, { weekStartsOn: 1 })
  // Return as a plain date (no TZ shift) — just year/month/day
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
}

/**
 * Format a week_start date as YYYY-MM-DD string for DB storage.
 */
export function formatWeekStart(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get a human-readable rest period label.
 */
export function getRestPeriodLabel(utcDate: Date = new Date()): string {
  const est = toZonedTime(utcDate, TIMEZONE)
  const hours = est.getHours()
  if (hours < 6) return 'Night Sleep (12am–6am)'
  return 'Afternoon Nap (2pm–4pm)'
}

/**
 * Get all 14 blocks in order (Sun–Sat, morning first).
 */
export function getAllBlocks(): Block[] {
  return BLOCKS
}

/**
 * Get block by ID.
 */
export function getBlockById(id: string): Block | undefined {
  return BLOCKS.find(b => b.id === id)
}

export type ScheduleResolution =
  | {
      status: "active"
      timezone: typeof TIMEZONE
      at: string
      block: Block
      windowLabel: string
      canSchedule: true
      reason: null
    }
  | {
      status: "blackout"
      timezone: typeof TIMEZONE
      at: string
      blackout: "sleep" | "nap"
      windowLabel: string
      canSchedule: false
      reason: string
    }

export function getScheduleResolution(utcDate: Date): ScheduleResolution {
  const est = toZonedTime(utcDate, TIMEZONE)
  const hours = est.getHours()
  const minutes = est.getMinutes()
  const totalMinutes = hours * 60 + minutes

  const base = {
    timezone: TIMEZONE as typeof TIMEZONE,
    at: utcDate.toISOString(),
  }

  // Night sleep: 00:00 to 06:00
  if (totalMinutes < 6 * 60) {
    return {
      ...base,
      status: "blackout",
      blackout: "sleep",
      windowLabel: "12:00 AM-6:00 AM",
      canSchedule: false,
      reason: "Sleep window is protected."
    }
  }

  // Nap: 14:00 to 16:00
  if (totalMinutes >= 14 * 60 && totalMinutes < 16 * 60) {
    return {
      ...base,
      status: "blackout",
      blackout: "nap",
      windowLabel: "2:00 PM-4:00 PM",
      canSchedule: false,
      reason: "Nap window is protected."
    }
  }

  const block = getBlockForTime(utcDate)
  if (!block) throw new Error(`No block found for ${utcDate.toISOString()}`)

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
  }

  return {
    ...base,
    status: "active",
    block,
    windowLabel: `${formatTime(block.start_time)}-${formatTime(block.end_time)}`,
    canSchedule: true,
    reason: null
  }
}

export function buildIntervalSamples(start: Date, end: Date) {
  const samples = [start]
  const stepMs = 5 * 60 * 1000
  let cursor = new Date(Math.ceil((start.valueOf() + 1) / stepMs) * stepMs)

  while (cursor < end) {
    samples.push(cursor)
    cursor = new Date(cursor.valueOf() + stepMs)
  }

  samples.push(new Date(end.valueOf() - 1))
  return samples
}

export type ScheduleCheck = {
  schedulable: boolean
  timezone: typeof TIMEZONE
  startAt: string
  endAt: string
  reasons: string[]
  touchedBlocks: string[]
}

export function checkScheduleWindow(startAt: string, endAt: string, responsibilities: any[]): ScheduleCheck {
  const start = new Date(startAt)
  const end = new Date(endAt)

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end <= start) {
    return {
      schedulable: false,
      timezone: TIMEZONE,
      startAt,
      endAt,
      reasons: ["Provide a valid startAt and endAt, with endAt after startAt."],
      touchedBlocks: [],
    }
  }

  const reasons = new Set<string>()
  const touchedBlocks = new Set<string>()
  const samples = buildIntervalSamples(start, end)

  for (const sample of samples) {
    const resolution = getScheduleResolution(sample)

    if (resolution.status === "blackout") {
      reasons.add(resolution.reason)
      continue
    }

    touchedBlocks.add(resolution.block.label)

    const est = toZonedTime(sample, TIMEZONE)
    const minuteOfDay = est.getHours() * 60 + est.getMinutes()

    const overlapping = responsibilities.find((responsibility) => {
      if (responsibility.block_id !== resolution.block.id) return false
      if (!responsibility.fixed_start_time || !responsibility.fixed_end_time) return false

      const [startH, startM] = responsibility.fixed_start_time.split(':').map(Number)
      const [endH, endM] = responsibility.fixed_end_time.split(':').map(Number)
      const startMinute = startH * 60 + startM
      const endMinute = endH * 60 + endM

      return minuteOfDay >= startMinute && minuteOfDay < endMinute
    })

    if (overlapping) {
      reasons.add(`${resolution.block.label} already has ${overlapping.title}.`)
    }
  }

  return {
    schedulable: reasons.size === 0,
    timezone: TIMEZONE,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    reasons: Array.from(reasons),
    touchedBlocks: Array.from(touchedBlocks),
  }
}
