"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(Boolean(s)));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-extrabold tracking-tight">Challenge Killer™</div>
          <div className="flex gap-3">
            <a className="text-sm underline opacity-80 hover:opacity-100" href="/calculator">Free</a>
            <a className="text-sm underline opacity-80 hover:opacity-100" href="/pro">PRO</a>
            <a
              className="text-sm underline opacity-80 hover:opacity-100"
              href={loggedIn ? "/account" : "/login"}
            >
              {loggedIn ? "Account" : "Login"}
            </a>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">
              Stop blowing prop firm accounts.
            </h1>
            <p className="mt-4 text-lg opacity-75">
              Most traders fail from rule breaks — not strategy. Run a simulation before you buy another challenge.
            </p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <a href="/calculator" className="rounded-2xl bg-white px-6 py-3 font-extrabold text-black hover:opacity-90">
                Run Free Pass Estimate
              </a>
              <a href="/pro" className="rounded-2xl border border-white/15 px-6 py-3 font-extrabold hover:bg-white/10">
                Unlock PRO
              </a>
            </div>

            <div className="mt-6 text-sm opacity-60">
              Educational tool only. Not financial advice.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm opacity-70">What PRO adds</div>
            <ul className="mt-3 space-y-2 text-sm opacity-85 list-disc pl-5">
              <li>Daily loss + max drawdown Monte Carlo simulation</li>
              <li>Average fail day (when you statistically blow it)</li>
              <li>Survival Plan generator (risk & trades/day recommendations)</li>
              <li>PRO saved to your account (login)</li>
            </ul>
            <a href="/pro" className="mt-5 inline-block rounded-xl bg-white px-4 py-2 font-extrabold text-black">
              Go PRO (19€)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
