export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-2xl text-center p-6">
        <h1 className="text-4xl font-extrabold mb-4">Challenge Killer™</h1>
        <p className="text-lg opacity-80 mb-6">
          Before you buy another prop firm challenge, run this.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/calculator"
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:opacity-80 transition"
          >
            Run Free Pass Estimate
          </a>

          <a
            href="/pro"
            className="border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
          >
            PRO (Unlock)
          </a>
        </div>

        <p className="text-xs opacity-60 mt-6">
          Educational tool only. Not financial advice.
        </p>
      </div>
    </main>
  );
}
