import { Suspense } from "react";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default function ProHistoryPage() {
  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs opacity-70">PRO</div>
            <h1 className="text-4xl font-extrabold mt-1">Run History</h1>
            <p className="mt-2 opacity-70">Last 20 PRO simulations (saved to your account).</p>
          </div>

          <div className="flex gap-3">
            <a href="/pro" className="text-sm underline opacity-80 hover:opacity-100">
              Back to PRO
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <Suspense fallback={<div className="text-sm opacity-70">Loading…</div>}>
            <HistoryClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
