'use client'
import { Block } from '@/lib/blocks'
import { Moon } from 'lucide-react'

interface Props {
  currentBlock: Block | null
  now: string
}

export default function StatusBanner({ currentBlock, now }: Props) {
  const estTime = new Date(now).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const estDate = new Date(now).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (!currentBlock) {
    return (
      <div className="status-banner is-rest fade-in">
        <div className="status-banner-icon">
          <Moon size={36} color="var(--ink-faint)" />
        </div>
        <div className="status-banner-body">
          <div className="status-banner-label">Rest Period</div>
          <div className="status-banner-title">Lionel is resting 💤</div>
          <div className="status-banner-subtitle">{estDate} · {estTime} EST, no scheduling during rest windows</div>
        </div>
      </div>
    )
  }

  return (
    <div className="status-banner is-active fade-in" style={{ borderColor: currentBlock.color + '60' }}>
      <div className="status-banner-icon">{currentBlock.emoji}</div>
      <div className="status-banner-body">
        <div className="status-banner-label">Active Right Now</div>
        <div className="status-banner-title" style={{ color: currentBlock.color }}>
          {currentBlock.label}
        </div>
        <div className="status-banner-subtitle">
          {estDate} · {estTime} EST · Block runs {currentBlock.period === 'morning' ? '6:00am - 2:00pm' : '4:00pm - 12:00am'}
        </div>
      </div>
    </div>
  )
}
