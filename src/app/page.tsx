"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GlowButton from "@/components/GlowButton";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(Boolean(s)));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* HERO */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">
              Stop blowing prop firm accounts.
            </h1>

            <p className="mt-4 text-lg opacity-75">
              Most traders fail from rule breaks — not strategy.
              Simulate your pass probability before risking another challenge.
            </p>

            <div className="mt-8 flex gap-4 flex-wrap">
              <GlowButton href="/calculator">
                Run Free Pass Estimate
              </GlowButton>

              <GlowButton href="/pro" variant="ghost">
                Unlock PRO (19€)
              </GlowButton>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm opacity-70">What PRO adds</div>
            <ul className="mt-3 space-y-2 text-sm opacity-85 list-disc pl-5">
              <li>Daily loss + max drawdown Monte Carlo simulation</li>
              <li>Average fail day (when you statistically blow it)</li>
              <li>Survival Plan generator</li>
              <li>Saved to your account</li>
            </ul>

            <div className="mt-6">
              <GlowButton href="/pro">Go PRO (19€)</GlowButton>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-center">How it works</h2>

          <div className="mt-10 grid md:grid-cols-3 gap-8 text-center">
            <Step
              number="01"
              title="Enter Real Rules"
              desc="Input your actual prop firm rules and realistic winrate."
            />
            <Step
              number="02"
              title="Run Simulations"
              desc="Monte Carlo simulation models thousands of random trade paths."
            />
            <Step
              number="03"
              title="See Statistical Risk"
              desc="Understand how likely you are to pass — or blow it."
            />
          </div>
        </div>

        {/* WHY TRADERS FAIL */}
        <div className="mt-24 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold">
            Most traders don’t fail from strategy.
          </h2>
          <p className="mt-6 text-lg opacity-75">
            They fail from variance, over-risking, and daily loss rule violations.
            A strategy with positive expectancy can still statistically fail
            a short evaluation period.
          </p>
        </div>

        {/* FREE VS PRO */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-center">
            Free vs PRO
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3">Feature</th>
                  <th>Free</th>
                  <th>PRO</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <Row feature="Quick risk estimate" free="✓" pro="✓" />
                <Row feature="Daily loss simulation" free="—" pro="✓" />
                <Row feature="Max drawdown modeling" free="—" pro="✓" />
                <Row feature="Average fail day" free="—" pro="✓" />
                <Row feature="Survival Plan generator" free="—" pro="✓" />
                <Row feature="Saved to account" free="—" pro="✓" />
              </tbody>
            </table>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-extrabold">
            Before you buy another challenge…
          </h2>

          <p className="mt-4 opacity-75">
            Run the simulation first.
          </p>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <GlowButton href="/calculator">
              Run Free Estimate
            </GlowButton>
            <GlowButton href="/pro" variant="ghost">
              Unlock PRO (19€)
            </GlowButton>
          </div>
        </div>

      </div>
    </main>
  );
}

function Step({ number, title, desc }: any) {
  return (
    <div>
      <div className="text-5xl font-extrabold opacity-20">{number}</div>
      <div className="mt-4 text-xl font-bold">{title}</div>
      <div className="mt-2 text-sm opacity-70">{desc}</div>
    </div>
  );
}

function Row({ feature, free, pro }: any) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3">{feature}</td>
      <td>{free}</td>
      <td>{pro}</td>
    </tr>
  );
}
