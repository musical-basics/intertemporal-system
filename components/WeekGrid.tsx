'use client'
import { Block } from '@/lib/blocks'
import LionelCard from './LionelCard'

interface Responsibility {
  block_id: string
  title: string
  fixed_start_time?: string
  fixed_end_time?: string
}

interface Props {
  blocks: Block[]
  currentBlockId: string | null
  responsibilities: Responsibility[]
  logCounts: Record<string, number>
  weekLabel: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PERIODS: ('morning' | 'evening')[] = ['morning', 'evening']
const PERIOD_LABELS = { morning: '☀️ AM', evening: '🌙 PM' }

export default function WeekGrid({ blocks, currentBlockId, responsibilities, logCounts }: Props) {
  const getBlock = (day: number, period: 'morning' | 'evening') =>
    blocks.find(b => b.day_of_week === day && b.period === period)

  const getResponsibilities = (blockId: string) =>
    responsibilities.filter(r => r.block_id === blockId)

  return (
    <div>
      <div className="week-grid fade-in">
        {/* Header row */}
        <div className="week-grid-period-label" />
        {DAYS.map(day => (
          <div key={day} className="week-grid-day-label">{day}</div>
        ))}

        {/* Morning row */}
        <div className="week-grid-period-label">{PERIOD_LABELS.morning}</div>
        {[0,1,2,3,4,5,6].map(day => {
          const block = getBlock(day, 'morning')!
          return (
            <LionelCard
              key={`${day}_morning`}
              block={block}
              isCurrent={block.id === currentBlockId}
              responsibilities={getResponsibilities(block.id)}
              logCount={logCounts[block.id] ?? 0}
              animDelay={day * 0.04}
            />
          )
        })}

        {/* Nap row */}
        <div className="week-grid-period-label">😴 Nap</div>
        {[0,1,2,3,4,5,6].map(day => (
          <div key={`nap_${day}`} className="lionel-card is-rest" style={{ minHeight: 44 }}>
            <span style={{ fontSize: 11, color: '#A8A29E', fontStyle: 'italic' }}>2pm – 4pm</span>
          </div>
        ))}

        {/* Evening row */}
        <div className="week-grid-period-label">{PERIOD_LABELS.evening}</div>
        {[0,1,2,3,4,5,6].map(day => {
          const block = getBlock(day, 'evening')!
          return (
            <LionelCard
              key={`${day}_evening`}
              block={block}
              isCurrent={block.id === currentBlockId}
              responsibilities={getResponsibilities(block.id)}
              logCount={logCounts[block.id] ?? 0}
              animDelay={0.28 + day * 0.04}
            />
          )
        })}

        {/* Sleep row */}
        <div className="week-grid-period-label">🌑 Sleep</div>
        {[0,1,2,3,4,5,6].map(day => (
          <div key={`sleep_${day}`} className="lionel-card is-rest" style={{ minHeight: 44 }}>
            <span style={{ fontSize: 11, color: '#A8A29E', fontStyle: 'italic' }}>12am – 6am</span>
          </div>
        ))}
      </div>
    </div>
  )
}
