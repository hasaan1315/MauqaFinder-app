'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [year, setYear] = useState(2026)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="w-full mt-auto py-8 transition-colors duration-200"
            style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Mauqa<span style={{ color: 'var(--accent)' }}>•</span>
          </div>
          <div className="w-1 h-1 rounded-full" style={{ background: 'var(--border)' }}></div>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © {year} All rights reserved.
          </span>
        </div>
        <div className="flex gap-6 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <Link href="#" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
          <Link href="#" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }}>Terms</Link>
          <a href="https://github.com/hasaan1315" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
            Built by Muhammad Hasaan
          </a>
        </div>
      </div>
    </footer>
  )
}