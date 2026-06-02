import { toZonedTime } from 'date-fns-tz'
import { startOfWeek } from 'date-fns'

export const TIMEZONE = 'America/New_York'

export type Period = 'morning' | 'evening'
export type ShiftStatus = 'active' | 'nap' | 'sleep'

export const MINUTES_PER_DAY = 24 * 60
export const MORNING_START = 6 * 60
export const MORNING_END = 14 * 60
export const NAP_START = 14 * 60
export const NAP_END = 16 * 60
export const EVENING_START = 16 * 60
export const EVENING_END = 24 * 60

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

// The canonical 14 blocks, mirroring the DB seed data.
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
 * Determines whether a UTC timestamp falls in a rest period in Eastern time.
 * Rest windows: 00:00-06:00 sleep, 14:00-16:00 nap.
 */
export function isRestPeriod(utcDate: Date = new Date()): boolean {
  return getShiftStatusForTime(utcDate) !== 'active'
}

/**
 * Get the block ID that owns a timestamp in Eastern time.
 * Nap maps to that day's morning block. Sleep maps to the previous day's evening block.
 */
export function getBlockIdForTime(utcDate: Date = new Date()): string {
  const { dayOfWeek, minuteOfDay } = getEasternParts(utcDate)

  if (minuteOfDay >= MORNING_START && minuteOfDay < NAP_END) {
    return `${DAY_PREFIX[dayOfWeek]}_morning`
  }

  if (minuteOfDay >= EVENING_START) {
    return `${DAY_PREFIX[dayOfWeek]}_evening`
  }

  const previousDay = (dayOfWeek + 6) % 7
  return `${DAY_PREFIX[previousDay]}_evening`
}

/**
 * Get the block ID only when a timestamp is inside an active shift.
 */
export function getActiveBlockIdForTime(utcDate: Date = new Date()): string | null {
  if (isRestPeriod(utcDate)) return null
  return getBlockIdForTime(utcDate)
}

/**
 * Get the attributed Block object for a given UTC timestamp.
 */
export function getBlockForTime(utcDate: Date = new Date()): Block {
  const blockId = getBlockIdForTime(utcDate)
  const block = getBlockById(blockId)
  if (!block) throw new Error(`No block found for ${utcDate.toISOString()}`)
  return block
}

/**
 * Get the active Block object for a timestamp, or null during rest periods.
 */
export function getActiveBlockForTime(utcDate: Date = new Date()): Block | null {
  const blockId = getActiveBlockIdForTime(utcDate)
  return blockId ? getBlockById(blockId) ?? null : null
}

/**
 * Get the current active block (right now in EST).
 */
export function getCurrentBlock(): Block | null {
  return getActiveBlockForTime(new Date())
}

export type BlockResolution = {
  block_id: string
  block: Block
  shift_status: ShiftStatus
  timezone: typeof TIMEZONE
}

export function resolveBlockForTime(utcDate: Date = new Date()): BlockResolution {
  const block_id = getBlockIdForTime(utcDate)
  const block = getBlockById(block_id)

  if (!block) throw new Error(`No block found for ${utcDate.toISOString()}`)

  return {
    block_id,
    block,
    shift_status: getShiftStatusForTime(utcDate),
    timezone: TIMEZONE,
  }
}

export function getShiftStatusForTime(utcDate: Date = new Date()): ShiftStatus {
  const { minuteOfDay } = getEasternParts(utcDate)

  if (minuteOfDay >= MORNING_START && minuteOfDay < MORNING_END) return 'active'
  if (minuteOfDay >= NAP_START && minuteOfDay < NAP_END) return 'nap'
  if (minuteOfDay >= EVENING_START && minuteOfDay < EVENING_END) return 'active'
  return 'sleep'
}

function getEasternParts(utcDate: Date) {
  const est = toZonedTime(utcDate, TIMEZONE)
  const hour = est.getHours()
  const minute = est.getMinutes()

  return {
    dayOfWeek: est.getDay(),
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
  }
}

/**
 * Get the Monday (week_start) of the week containing a given UTC date, in EST.
 */
export function getWeekStart(utcDate: Date = new Date()): Date {
  const est = toZonedTime(utcDate, TIMEZONE)
  const monday = startOfWeek(est, { weekStartsOn: 1 })
  // Return as a plain date with no timezone shift, just year/month/day.
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
}

/**
 * Get the week containing the attributed block date for a timestamp.
 * Sleep belongs to the previous day's evening block.
 */
export function getAttributedWeekStart(utcDate: Date = new Date()): Date {
  const est = toZonedTime(utcDate, TIMEZONE)

  if (getShiftStatusForTime(utcDate) === 'sleep') {
    est.setDate(est.getDate() - 1)
  }

  const monday = startOfWeek(est, { weekStartsOn: 1 })
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
  const status = getShiftStatusForTime(utcDate)
  if (status === 'sleep') return 'Night Sleep (12am-6am)'
  if (status === 'nap') return 'Afternoon Nap (2pm-4pm)'
  return 'Active shift'
}

/**
 * Get all 14 blocks in order, Sunday through Saturday, morning first.
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
      minuteOfDay: number
      block: Block
      windowLabel: string
      canSchedule: true
      reason: null
    }
  | {
      status: "blackout"
      timezone: typeof TIMEZONE
      at: string
      minuteOfDay: number
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
    minuteOfDay: totalMinutes,
  }

  if (totalMinutes < MORNING_START) {
    return {
      ...base,
      status: "blackout",
      blackout: "sleep",
      windowLabel: "12:00 AM-6:00 AM",
      canSchedule: false,
      reason: "Sleep window is protected."
    }
  }

  if (totalMinutes >= NAP_START && totalMinutes < NAP_END) {
    return {
      ...base,
      status: "blackout",
      blackout: "nap",
      windowLabel: "2:00 PM-4:00 PM",
      canSchedule: false,
      reason: "Nap window is protected."
    }
  }

  const blockId = getActiveBlockIdForTime(utcDate)
  const block = blockId ? getBlockById(blockId) : null
  if (!block) throw new Error(`No active block found for ${utcDate.toISOString()}`)

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

export type ScheduleResponsibility = {
  block_id: string
  title: string
  fixed_start_time?: string | null
  fixed_end_time?: string | null
}

export function timeStringToMinutes(value?: string | null): number | null {
  if (!value) return null
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

export function minutesBetweenTimes(start?: string | null, end?: string | null): number {
  const startMinute = timeStringToMinutes(start)
  const endMinute = timeStringToMinutes(end)

  if (startMinute == null || endMinute == null) return 0

  let duration = endMinute - startMinute
  if (duration <= 0) duration += MINUTES_PER_DAY
  return Math.max(0, duration)
}

export function checkScheduleWindow(
  startAt: string,
  endAt: string,
  responsibilities: ScheduleResponsibility[]
): ScheduleCheck {
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

    const minuteOfDay = resolution.minuteOfDay

    const overlapping = responsibilities.find((responsibility) => {
      if (responsibility.block_id !== resolution.block.id) return false
      if (!responsibility.fixed_start_time || !responsibility.fixed_end_time) return false

      const startMinute = timeStringToMinutes(responsibility.fixed_start_time)
      const rawEndMinute = timeStringToMinutes(responsibility.fixed_end_time)
      if (startMinute == null || rawEndMinute == null) return false

      const endMinute = rawEndMinute <= startMinute ? rawEndMinute + MINUTES_PER_DAY : rawEndMinute
      const checkedMinute = minuteOfDay < startMinute && endMinute > MINUTES_PER_DAY
        ? minuteOfDay + MINUTES_PER_DAY
        : minuteOfDay

      return checkedMinute >= startMinute && checkedMinute < endMinute
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
