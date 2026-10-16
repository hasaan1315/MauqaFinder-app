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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#f87171'
  const bg = score >= 85 ? 'rgba(16,185,129,0.12)' : score >= 65 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 min-w-[56px]"
      style={{ background: bg, border: `1px solid ${color}33` }}>
      <span className="text-lg font-extrabold leading-none" style={{ color }}>{score}%</span>
      <span className="text-[10px] font-medium mt-0.5" style={{ color }}>match</span>
    </div>
  )
}

function JobCard({ job }: { job: any }) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  
  const sourceColor = job.source === 'punjab' ? 'gold' : job.source === 'ppsc' ? 'green' : 'blue'
  const sourceLabel = job.source === 'punjab' ? 'Punjab Gov' : job.source === 'ppsc' ? 'PPSC' : 'NJP'

  return (
    <div className="p-5 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-md shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-semibold text-base leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
          {job.title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {job.match_score != null && <ScoreBadge score={job.match_score} />}
          <Badge label={sourceLabel} color={sourceColor} />
        </div>
      </div>

      {job.employer && (
        <p className="text-sm mb-3 font-medium" style={{ color: 'var(--text-primary)', opacity: 0.85 }}>🏢 {job.employer}</p>
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

      {job.match_breakdown?.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowBreakdown(v => !v)}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            {showBreakdown ? '▲' : '▼'} {showBreakdown ? 'Hide' : 'Show'} match breakdown
          </button>
          {showBreakdown && (
            <ul className="mt-2 space-y-1">
              {job.match_breakdown.map((reason: string, i: number) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span> {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* --- UPDATED LINK SECTION --- */}
      <div className="flex flex-col items-start gap-1">
        <a href={job.job_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2.5"
          style={{ color: 'var(--accent)' }}>
          {job.source === 'ppsc' ? 'Open PPSC Portal →' : 'View Job →'}
        </a>
        {job.source === 'ppsc' && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            * PPSC requires you to manually select the job from their main list.
          </span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  const [filterSource, setFilterSource] = useState('All')
  const [filterExp, setFilterExp] = useState('All')
  const [filterSeats, setFilterSeats] = useState('All')

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }

        setUserName(session.user.user_metadata?.full_name?.split(' ')[0] || '')

        const cached = sessionStorage.getItem('cachedMatches')
        if (cached) {
          sessionStorage.removeItem('cachedMatches')
          setJobs(JSON.parse(cached))
          setLoading(false)
          return
        }

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

  const displayedJobs = jobs.filter(job => {
    // 1. Source check
    const matchSource = filterSource === 'All' || 
      (filterSource === 'Punjab' && job.source === 'punjab') ||
      (filterSource === 'NJP' && job.source === 'njp') ||
      (filterSource === 'PPSC' && job.source === 'ppsc');

    // 2. Experience check
    const matchExp = filterExp === 'All' ||
      (filterExp === 'Entry' && (job.experience_years === 0 || job.experience_years == null)) ||
      (filterExp === '1-3' && job.experience_years >= 1 && job.experience_years <= 3) ||
      (filterExp === '4+' && job.experience_years >= 4);

    // 3. Vacancies check
    const matchSeats = filterSeats === 'All' ||
      (filterSeats === 'Single' && job.vacancies === 1) ||
      (filterSeats === 'Multiple' && job.vacancies > 1);

    return matchSource && matchExp && matchSeats;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)' }}>Finding your matches...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 rounded-xl max-w-md w-full text-center shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="text-4xl mb-3">⚠️</div>
        <p className="font-semibold mb-1" style={{ color: '#f87171' }}>Something went wrong</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={() => router.push('/profile')}
          className="px-6 py-2 rounded-lg text-sm font-medium text-white shadow-sm"
          style={{ background: 'var(--accent)' }}>
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-sm text-white"
            style={{ background: 'var(--accent)' }}>
            ⚙️ Update Preferences
          </button>
        </div>

        {/* Stats bar */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Matches', value: jobs.length },
              { label: 'Punjab Jobs', value: jobs.filter(j => j.source === 'punjab').length },
              { label: 'NJP Jobs', value: jobs.filter(j => j.source === 'njp').length },
              { label: 'PPSC Jobs', value: jobs.filter(j => j.source === 'ppsc').length },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl text-center shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl shadow-sm" 
               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Filter by:</span>
            
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg cursor-pointer outline-none transition-colors" 
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="All">All Sources</option>
              <option value="Punjab">Punjab Gov</option>
              <option value="NJP">NJP</option>
              <option value="PPSC">PPSC</option>
            </select>

            <select value={filterExp} onChange={(e) => setFilterExp(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg cursor-pointer outline-none transition-colors" 
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="All">All Experience</option>
              <option value="Entry">Entry Level (0 yrs)</option>
              <option value="1-3">Mid Level (1-3 yrs)</option>
              <option value="4+">Senior (4+ yrs)</option>
            </select>

            <select value={filterSeats} onChange={(e) => setFilterSeats(e.target.value)}
              className="text-sm py-2 px-3 rounded-lg cursor-pointer outline-none transition-colors" 
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="All">All Vacancies</option>
              <option value="Single">Single Seat</option>
              <option value="Multiple">Multiple Seats</option>
            </select>

            <div className="ml-auto text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Showing {displayedJobs.length} of {jobs.length}
            </div>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="p-12 rounded-2xl text-center shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No matches found</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Try adjusting your education, experience, or location preferences.</p>
            <button onClick={() => router.push('/profile')}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
              style={{ background: 'var(--accent)' }}>
              Update Preferences
            </button>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="p-12 rounded-2xl text-center shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">🗂️</div>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No jobs match these filters</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Try adjusting the dropdowns above to see more results.</p>
            <button onClick={() => { setFilterSource('All'); setFilterExp('All'); setFilterSeats('All'); }}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
              style={{ background: 'var(--text-muted)' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {displayedJobs.map((job, i) => <JobCard key={job.job_id || i} job={job} />)}
          </div>
        )}
      </div>
    </div>
  )
}