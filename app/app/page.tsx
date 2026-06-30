export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">
          Tailwind v4 is Live!
        </h1>
        <p className="text-slate-600 mb-4">
          Your Next.js environment is configured and ready to be paired with
          Prisma.
        </p>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition">
          Connect Database
        </button>
      </div>
    </main>
  );
}
