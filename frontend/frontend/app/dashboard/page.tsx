'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    green:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
    gold:   { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa' },
    purple: { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa' },
    red:    { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  }
  const c = colors[color] || colors.blue
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>
      {label}
    </span>
  )
}

function JobCard({ job }: { job: any }) {
  const sourceColor = job.source === 'punjab' ? 'gold' : 'blue'
  const sourceLabel = job.source === 'punjab' ? 'Punjab Gov' : 'NJP'

  return (
    <div className="p-5 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-xl group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-semibold text-base leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
          {job.title}
        </h2>
        <Badge label={sourceLabel} color={sourceColor} />
      </div>

      {job.employer && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>🏢 {job.employer}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {job.district && <Badge label={`📍 ${job.district}`} color="purple" />}
        {job.experience_years != null && <Badge label={`${job.experience_years}yr exp`} color="blue" />}
        {job.education_level_years != null && <Badge label={`${job.education_level_years}yr edu`} color="green" />}
        {job.vacancies != null && <Badge label={`${job.vacancies} seats`} color="gold" />}
        {job.last_date_to_apply && (
          <Badge label={`Deadline: ${job.last_date_to_apply}`} color="red" />
        )}
      </div>

      <a href={job.job_url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2.5"
        style={{ color: '#10b981' }}>
        View Job →
      </a>
    </div>
  )
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }

        setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || '')

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/matches`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.detail || `Server error: ${res.status}`)
        }
        setJobs(await res.json())
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)' }}>Finding your matches...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 rounded-xl max-w-md w-full text-center" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="text-4xl mb-3">⚠️</div>
        <p className="font-semibold mb-1" style={{ color: '#f87171' }}>Something went wrong</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={() => router.push('/profile')}
          className="px-6 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#10b981' }}>
          Update Profile
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {userName ? `Welcome back, ${userName} 👋` : 'Your Job Matches'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {jobs.length} personalized match{jobs.length !== 1 ? 'es' : ''} found
            </p>
          </div>
          <button onClick={() => router.push('/profile')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'var(--bg-card)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            ⚙️ Update Preferences
          </button>
        </div>

        {/* Stats bar */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Matches', value: jobs.length },
              { label: 'Punjab Jobs', value: jobs.filter(j => j.source === 'punjab').length },
              { label: 'NJP Jobs', value: jobs.filter(j => j.source === 'njp').length },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs */}
        {jobs.length === 0 ? (
          <div className="p-12 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No matches found</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Try adjusting your education, experience, or location preferences.</p>
            <button onClick={() => router.push('/profile')}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              Update Preferences
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job, i) => <JobCard key={job.job_id || i} job={job} />)}
          </div>
        )}
      </div>
    </div>
  )
}
