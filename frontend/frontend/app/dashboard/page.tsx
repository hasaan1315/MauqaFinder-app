'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchMatches() {
      try {
        // 1. Get the current user session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        // 2. Fetch matches from your FastAPI backend using the JWT token
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/matches`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!res.ok) throw new Error('Failed to fetch job matches')

        const data = await res.json()
        setJobs(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [router])

  if (loading) return <div className="p-8 text-black">Loading your personalized matches...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-6">Your Personalized Job Matches</h1>
      {jobs.length === 0 ? (
        <p>No jobs found matching your profile constraints yet.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <div key={job.job_id || job.id || index} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-gray-600">{job.company_name}</p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="mr-4">Experience: {job.experience_years} years</span>
                <span>Education: {job.education_level_years} years</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}