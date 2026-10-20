'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import PasswordInput from '@/components/PasswordInput'
import {
  checkPassword,
  getPasswordStrength,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/password'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const success = message.includes('Success')
  const [attempted, setAttempted] = useState(false)

  const check = checkPassword(password)
  const strength = getPasswordStrength(password)
  const passwordValid = check.valid

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)

    // Client-side policy is advisory UX only; the server enforces the real one.
    if (!passwordValid) {
      setMessage('Password does not meet the requirements listed below.')
      return
    }

    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) setMessage(error.message)
    else setMessage('Success! Check your email for the confirmation link.')
    setLoading(false)
  }

  const inputClass = "mt-1 block w-full px-4 py-3 rounded-lg text-sm transition-all duration-200"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider mb-1"

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="Mauqa-Finder" width={72} height={72} priority />
          </div>
          <div>
            <span className="text-2xl font-extrabold" style={{ color: '#000000' }}>Mauqa</span>
            <span className="text-2xl font-extrabold" style={{ color: '#10b981' }}>-Finder</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className={inputClass} style={{ border: '1px solid var(--border)' }} placeholder="Muhammad Ali" required />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} style={{ border: '1px solid var(--border)' }} placeholder="you@example.com" required />
            </div>

            <div>
              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Password"
                placeholder={`Min. ${PASSWORD_MIN_LENGTH} characters`}
                autoComplete="new-password"
                describedBy="password-requirements"
                invalid={attempted && !passwordValid}
              />

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>Password strength</span>
                    <span style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{ background: 'var(--border)' }}
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuenow={strength.score}
                    aria-valuetext={`${strength.label}. ${check.metCount} of ${check.total} requirements met.`}
                    aria-label="Password strength"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${strength.percent}%`, background: strength.color }}
                    />
                  </div>
                </div>
              )}

              {/* Requirements checklist */}
              <ul id="password-requirements" className="mt-3 space-y-1">
                {check.rules.map((rule) => (
                  <li key={rule.id} className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        background: rule.met ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                        color: rule.met ? '#10b981' : 'var(--text-placeholder)',
                      }}
                    >
                      {rule.met ? '✓' : '•'}
                    </span>
                    <span style={{ color: rule.met ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {rule.label}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0"
                    style={{
                      background: check.tooLong ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                      color: check.tooLong ? '#ef4444' : 'var(--text-placeholder)',
                    }}
                  >
                    {check.tooLong ? '✕' : '•'}
                  </span>
                  <span style={{ color: check.tooLong ? '#ef4444' : 'var(--text-muted)' }}>
                    No more than {PASSWORD_MAX_LENGTH} characters
                  </span>
                </li>
              </ul>

              {attempted && !passwordValid && (
                <p
                  id="password-requirements-status"
                  className="mt-2 text-xs"
                  style={{ color: '#f87171' }}
                  role="alert"
                >
                  {check.tooLong
                    ? `Password cannot be longer than ${PASSWORD_MAX_LENGTH} characters.`
                    : 'Password does not meet all the requirements above.'}
                </p>
              )}

              {/* Screen-reader-only live summary of the remaining requirements. */}
              <p className="sr-only" aria-live="polite">
                {password.length === 0
                  ? ''
                  : `${check.metCount} of ${check.total} password requirements met. ${
                      check.tooLong
                        ? `Password is too long; the maximum is ${PASSWORD_MAX_LENGTH} characters.`
                        : ''
                    }`}
              </p>
            </div>

            {message && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{
                  background: success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: success ? '#10b981' : '#f87171',
                  border: `1px solid ${success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#10b981' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
