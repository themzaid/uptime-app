import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900">
          Uptime Monitor
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Keep track of your websites. Get alerted when they go down.
        </p>
        <Link 
          href="/dashboard"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 shadow-md"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
