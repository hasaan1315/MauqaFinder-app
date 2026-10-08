'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide the navigation bar on the login screen
if (pathname === '/login' || pathname === '/signup' || pathname === '/') return null
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center text-white">
        <div className="text-xl font-bold tracking-tight">
          <Link href="/dashboard">Mauqa-Finder</Link>
        </div>
        
        <div className="flex space-x-6 items-center text-sm font-medium">
          <Link 
            href="/dashboard" 
            className={`hover:text-blue-200 transition ${pathname === '/dashboard' ? 'underline underline-offset-4' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/profile" 
            className={`hover:text-blue-200 transition ${pathname === '/profile' ? 'underline underline-offset-4' : ''}`}
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="ml-4 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}