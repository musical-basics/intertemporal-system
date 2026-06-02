import { BLOCKS, Block, minutesBetweenTimes } from '@/lib/blocks'

export type ReportStatus = 'open' | 'balanced' | 'busy' | 'swamped'

export type ReportLogRow = {
  block_id: string
  duration_minutes?: number | null
  activity?: string | null
  logged_at?: string
}

export type ReportResponsibilityRow = {
  block_id: string
  fixed_start_time?: string | null
  fixed_end_time?: string | null
}

export type BlockReport = {
  block_id: string
  id: string
  label: string
  day_of_week: number
  period: Block['period']
  color: string
  emoji: string
  total_logs: number
  logCount: number
  total_minutes: number
  loggedMinutes: number
  logged_minutes: number
  capacityMinutes: number
  capacity_minutes: number
  committedMinutes: number
  committed_minutes: number
  allocatedMinutes: number
  allocated_minutes: number
  remainingMinutes: number
  remaining_minutes: number
  utilization: number
  status: ReportStatus
  activities: string[]
}

export type WeeklyReport = {
  week_start: string | null
  total_logs: number
  total_minutes: number
  totals: {
    logCount: number
    loggedMinutes: number
    committedMinutes: number
    capacityMinutes: number
    allocatedMinutes: number
    remainingMinutes: number
  }
  by_block: Record<string, BlockReport>
  blocks: BlockReport[]
  busiest_blocks: string[]
  most_free_blocks: string[]
}

export function getBlockStatus(utilization: number, remainingMinutes: number): ReportStatus {
  if (utilization >= 0.88 || remainingMinutes <= 45) return 'swamped'
  if (utilization >= 0.68) return 'busy'
  if (utilization <= 0.25) return 'open'
  return 'balanced'
}

export function buildWeeklyReport(
  logs: ReportLogRow[],
  responsibilities: ReportResponsibilityRow[],
  weekStart: string | null = null
): WeeklyReport {
  const byBlock = Object.fromEntries(
    BLOCKS.map((block) => [block.id, emptyBlockReport(block)])
  ) as Record<string, BlockReport>

  for (const log of logs) {
    const report = byBlock[log.block_id]
    if (!report) continue

    report.total_logs += 1
    report.logCount += 1
    report.total_minutes += log.duration_minutes ?? 0
    report.loggedMinutes += log.duration_minutes ?? 0
    report.logged_minutes += log.duration_minutes ?? 0
    if (log.activity) report.activities.push(log.activity)
  }

  for (const responsibility of responsibilities) {
    const report = byBlock[responsibility.block_id]
    if (!report) continue

    const minutes = minutesBetweenTimes(
      responsibility.fixed_start_time,
      responsibility.fixed_end_time
    )

    report.committedMinutes += minutes
    report.committed_minutes += minutes
  }

  for (const report of Object.values(byBlock)) {
    const allocated = report.loggedMinutes + report.committedMinutes
    const remaining = Math.max(0, report.capacityMinutes - allocated)
    const utilization = report.capacityMinutes > 0
      ? Math.min(1, allocated / report.capacityMinutes)
      : 1

    report.allocatedMinutes = allocated
    report.allocated_minutes = allocated
    report.remainingMinutes = remaining
    report.remaining_minutes = remaining
    report.utilization = utilization
    report.status = getBlockStatus(utilization, remaining)
  }

  const blocks = BLOCKS.map((block) => byBlock[block.id])
  const sortedByLoad = [...blocks].sort((a, b) => b.allocatedMinutes - a.allocatedMinutes)
  const sortedByCapacity = [...blocks].sort((a, b) => b.remainingMinutes - a.remainingMinutes)

  const totals = blocks.reduce(
    (acc, block) => ({
      logCount: acc.logCount + block.logCount,
      loggedMinutes: acc.loggedMinutes + block.loggedMinutes,
      committedMinutes: acc.committedMinutes + block.committedMinutes,
      capacityMinutes: acc.capacityMinutes + block.capacityMinutes,
      allocatedMinutes: acc.allocatedMinutes + block.allocatedMinutes,
      remainingMinutes: acc.remainingMinutes + block.remainingMinutes,
    }),
    {
      logCount: 0,
      loggedMinutes: 0,
      committedMinutes: 0,
      capacityMinutes: 0,
      allocatedMinutes: 0,
      remainingMinutes: 0,
    }
  )

  return {
    week_start: weekStart,
    total_logs: totals.logCount,
    total_minutes: totals.loggedMinutes,
    totals,
    by_block: byBlock,
    blocks,
    busiest_blocks: sortedByLoad.slice(0, 3).map((block) => block.id),
    most_free_blocks: sortedByCapacity.slice(0, 3).map((block) => block.id),
  }
}

function emptyBlockReport(block: Block): BlockReport {
  const capacity = minutesBetweenTimes(block.start_time, block.end_time)

  return {
    block_id: block.id,
    id: block.id,
    label: block.label,
    day_of_week: block.day_of_week,
    period: block.period,
    color: block.color,
    emoji: block.emoji,
    total_logs: 0,
    logCount: 0,
    total_minutes: 0,
    loggedMinutes: 0,
    logged_minutes: 0,
    capacityMinutes: capacity,
    capacity_minutes: capacity,
    committedMinutes: 0,
    committed_minutes: 0,
    allocatedMinutes: 0,
    allocated_minutes: 0,
    remainingMinutes: capacity,
    remaining_minutes: capacity,
    utilization: 0,
    status: 'open',
    activities: [],
  }
}
