'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [education, setEducation] = useState(16)
  const [experience, setExperience] = useState(0)
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState({ loading: false, message: '' })
  const router = useRouter()

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, message: '' })

    try {
      // 1. Get the current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // 2. Send the profile data to your FastAPI backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          education_level_years: education,
          experience_years: experience,
          preferred_location: location
        })
      })

      if (!res.ok) throw new Error('Failed to save profile')

      setStatus({ loading: false, message: 'Profile saved successfully! Redirecting...' })
      
      // Redirect to the dashboard to see the new matches
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (err: any) {
      setStatus({ loading: false, message: err.message })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-black">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Set Your Preferences</h1>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Education (Years)</label>
            <input
              type="number"
              value={education}
              onChange={(e) => setEducation(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Location / City</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {status.message && (
            <p className={`text-sm text-center ${status.message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {status.loading ? 'Saving...' : 'Save Profile & View Matches'}
          </button>
        </form>
      </div>
    </div>
  )
}