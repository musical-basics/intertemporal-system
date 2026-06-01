'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, BookOpen, BarChart2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/',        label: 'Week',    icon: LayoutGrid },
  { href: '/log',     label: 'Log',     icon: BookOpen },
  { href: '/report',  label: 'Report',  icon: BarChart2 },
]

export default function NavBar() {
  const pathname = usePathname()
  const [currentLabel, setCurrentLabel] = useState<string>('')

  useEffect(() => {
    // Fetch the current block label for the nav indicator
    async function fetchCurrent() {
      try {
        const res = await fetch('/api/gui/current')
        if (!res.ok) return
        const data = await res.json()
        if (data.is_rest_period) {
          setCurrentLabel(data.rest_label ?? 'Resting')
        } else if (data.block) {
          setCurrentLabel(data.block.label)
        }
      } catch { /* silently fail in nav */ }
    }
    fetchCurrent()
  }, [])

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <div className="nav-brand-icon">⏳</div>
          <span className="nav-brand-text">Intertemporal</span>
        </Link>

        <div className="nav-links">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${pathname === href ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {currentLabel && (
          <div className="nav-current-block">
            <div className="pulse" />
            <Clock size={11} />
            <span>{currentLabel}</span>
          </div>
        )}
      </div>
    </nav>
  )
}
