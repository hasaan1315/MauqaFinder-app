import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-76px)] bg-gray-50 text-black px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Find the perfect role with <span className="text-blue-600">Mauqa-Finder</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Stop endlessly scrolling through irrelevant job boards. Set your education, experience, and location preferences once, and let our personalized matching engine deliver exactly what you are looking for.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}