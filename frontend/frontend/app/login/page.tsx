'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const inputClass = "mt-1 block w-full px-4 py-3 rounded-lg text-sm transition-all duration-200"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider mb-1"

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="Mauqa-Finder" width={72} height={72} priority />
          </div>
          <div>
            <span className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>Mauqa</span>
            <span className="text-2xl font-extrabold" style={{ color: '#10b981' }}>-Finder</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} style={{ border: '1px solid var(--border)' }} placeholder="you@example.com" required />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={inputClass} style={{ border: '1px solid var(--border)' }} placeholder="••••••••" required />
            </div>

            {message && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#10b981' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
