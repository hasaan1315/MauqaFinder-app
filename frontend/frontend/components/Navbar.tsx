'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login' || pathname === '/signup' || pathname === '/') return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link href={href}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        style={{
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          background: active ? 'rgba(16,185,129,0.1)' : 'transparent',
          border: active ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
        }}>
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md transition-colors duration-200"
      style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center">
          <Image 
            src="/logo-horizontal.svg" 
            alt="Mauqa-Finder" 
            width={200} 
            height={40} 
            priority 
            // REMOVE this style below if you upload a new dark-text logo
            style={{ filter: 'invert(1) hue-rotate(180deg)' }} 
          />
        </Link>

        <div className="flex items-center gap-2">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/profile', 'Profile')}
          <button onClick={handleLogout}
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}