import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

        <div className="relative z-10 max-w-3xl">
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Mauqa-Finder Logo" width={100} height={100} priority />
          </div>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            Pakistan&apos;s Smartest Job Matcher
          </span>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Your Next{' '}
            <span style={{ color: '#10b981' }}>Mauqa</span>
            {' '}is Waiting
          </h1>

          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Stop scrolling through irrelevant listings. Set your education, experience, and district once — we match you with real government & private jobs across Punjab and Pakistan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="px-8 py-3.5 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
              Get Started Free
            </Link>
            <Link href="/login"
              className="px-8 py-3.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        {[
          { icon: '🎯', title: 'Personalized Matches', desc: 'Jobs filtered by your exact education and experience level.' },
          { icon: '📍', title: 'District-Based Search', desc: 'Find jobs in your district or browse all of Pakistan.' },
          { icon: '⚡', title: 'Real-Time Data', desc: 'Scraped daily from Punjab Jobs Portal and NJP.' },
        ].map(f => (
          <div key={f.title} className="p-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
