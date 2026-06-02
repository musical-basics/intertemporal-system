import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Intertemporal - 14 Lionels, One Week',
  description: 'A scheduling and productivity system that tracks the 14 distinct versions of you across every morning and evening of the week.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <div className="page-wrapper">
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
