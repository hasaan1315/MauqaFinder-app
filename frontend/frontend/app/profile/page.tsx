'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DEGREE_OPTIONS = [
  { value: '', label: '— None (show all) —' },
  { value: 'computer science', label: 'Computer Science' },
  { value: 'information technology', label: 'Information Technology' },
  { value: 'software engineering', label: 'Software Engineering' },
  { value: 'electrical engineering', label: 'Electrical Engineering' },
  { value: 'civil engineering', label: 'Civil Engineering' },
  { value: 'mechanical engineering', label: 'Mechanical Engineering' },
  { value: 'telecommunication engineering', label: 'Telecommunication Engineering' },
  { value: 'business administration', label: 'Business Administration (BBA/MBA)' },
  { value: 'commerce', label: 'Commerce / B.Com' },
  { value: 'accounting', label: 'Accounting / Finance' },
  { value: 'economics', label: 'Economics' },
  { value: 'public administration', label: 'Public Administration' },
  { value: 'law', label: 'Law / LLB' },
  { value: 'education', label: 'Education / B.Ed' },
  { value: 'english', label: 'English Literature' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'medical', label: 'MBBS / Medical' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'data science', label: 'Data Science' },
  { value: 'artificial intelligence', label: 'Artificial Intelligence' },
]

const EDUCATION_OPTIONS = [
  { value: 10, label: 'Matric (10 years)' },
  { value: 12, label: 'Intermediate (12 years)' },
  { value: 14, label: 'Bachelor\'s (14 years)' },
  { value: 16, label: 'Master\'s / BS (16 years)' },
  { value: 18, label: 'MS / MPhil (18 years)' },
]

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [education, setEducation] = useState(16)
  const [experience, setExperience] = useState(0)
  const [location, setLocation] = useState('all')
  const [degreeKeyword, setDegreeKeyword] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [status, setStatus] = useState({ loading: false, message: '' })
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.full_name)
        setFullName(session.user.user_metadata.full_name)
    })
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/locations`)
      .then(res => res.json()).then(setCities).catch(() => {})
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, message: '' })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ full_name: fullName, education_level_years: education, experience_years: experience, preferred_location: location, degree_keyword: degreeKeyword || null })
      })
      if (!res.ok) throw new Error('Failed to save profile')
      setStatus({ loading: false, message: 'Profile saved! Redirecting...' })
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setStatus({ loading: false, message: err.message })
    }
  }

  const inputClass = "mt-1 block w-full px-4 py-3 rounded-lg text-sm transition-all duration-200"
  const labelClass = "block text-xs font-semibold uppercase tracking-wider mb-1"
  const borderStyle = { border: '1px solid var(--border)' }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Preferences</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            We use these to match you with the most relevant jobs.
          </p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className={inputClass} style={borderStyle} placeholder="Muhammad Ali" required />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Education Level</label>
              <select value={education} onChange={e => setEducation(Number(e.target.value))}
                className={inputClass} style={borderStyle}>
                {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>
                Years of Experience
                <span className="ml-2 font-normal normal-case" style={{ color: '#10b981' }}>{experience} yr{experience !== 1 ? 's' : ''}</span>
              </label>
              <input type="range" min={0} max={20} value={experience} onChange={e => setExperience(Number(e.target.value))}
                className="mt-2 w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#10b981', background: `linear-gradient(to right, #10b981 ${experience * 5}%, #2d3f50 ${experience * 5}%)` }} />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>
              </div>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Degree / Field of Study <span className="normal-case font-normal">(Optional)</span></label>
              <select value={degreeKeyword} onChange={e => setDegreeKeyword(e.target.value)}
                className={inputClass} style={borderStyle}>
                {DEGREE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-muted)' }}>Preferred District</label>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className={inputClass} style={borderStyle}>
                <option value="all">🇵🇰 All Pakistan</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            {status.message && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{
                  background: status.message.includes('saved') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: status.message.includes('saved') ? '#10b981' : '#f87171',
                  border: `1px solid ${status.message.includes('saved') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                {status.message}
              </div>
            )}

            <button type="submit" disabled={status.loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              {status.loading ? 'Saving...' : 'Save & Find My Matches →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
