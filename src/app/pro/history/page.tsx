import { Suspense } from "react";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default function ProHistoryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white p-6">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="text-3xl font-extrabold">Run History</div>
            <div className="mt-3 text-sm opacity-70">Loading…</div>
          </div>
        </main>
      }
    >
      <HistoryClient />
    </Suspense>
  );
}
