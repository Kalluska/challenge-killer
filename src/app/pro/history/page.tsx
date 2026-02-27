import HistoryClient from "./HistoryClient";

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="text-3xl font-extrabold mb-6">Run History</div>

        <a
          href="/pro"
          className="mb-6 inline-block rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
        >
          ← Back to PRO
        </a>

        <HistoryClient />
      </div>
    </main>
  );
}
