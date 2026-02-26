import { Suspense } from "react";
import ClaimClient from "./ClaimClient";

export const dynamic = "force-dynamic";

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white p-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="text-3xl font-extrabold">Claim PRO</div>
            <div className="mt-3 text-sm opacity-70">Loading…</div>
          </div>
        </main>
      }
    >
      <ClaimClient />
    </Suspense>
  );
}
