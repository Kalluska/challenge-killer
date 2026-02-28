"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RunRow = {
  id: string;
  created_at: string;
  inputs: any;
  outputs: any;
};

export default function HistoryClient() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const fmt = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fi-FI", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return null;
    }
  }, []);

  const load = async () => {
    setLoading(true);
    setErr(null);

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setErr(userErr.message);
      setLoading(false);
      return;
    }
    const user = userRes.user;
    if (!user) {
      setErr("Please login to view your history.");
      setLoading(false);
      return;
    }

    setEmail(user.email  null);

    // IMPORTANT:
    // Do NOT filter by user_id here. RLS already ensures you only see your own rows.
    const { data, error } = await supabase
      .from("runs")
      .select("id,created_at,inputs,outputs")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setRuns((data as any)  []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm opacity-70">{email  ""}</div>
        <button
          onClick={load}
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-xl hover:bg-white/15 transition"
        >
          Refresh
        </button>
      </div>

      {loading  (
        <div className="mt-6 text-sm opacity-70">Loading…</div>
      ) : err  (
        <div className="mt-6 text-sm text-red-300">Error: {err}</div>
      ) : runs.length === 0  (
        <div className="mt-6 text-sm opacity-70">
          No saved runs yet. Go to PRO and press “Save run”.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {runs.map((r) => {
            const survival =
              r.outputs.survivalProbability 
              r.outputs.survival 
              r.outputs.passProbability 
              null;

            const minEq =
              r.outputs.minEquity 
              r.outputs.min_equity 
              r.outputs.min 
              null;

            const maxEq =
              r.outputs.maxEquity 
              r.outputs.max_equity 
              r.outputs.max 
              null;

            const dateStr = fmt
               fmt.format(new Date(r.created_at))
              : new Date(r.created_at).toLocaleString();

            return (
              <div
                key={r.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="text-sm opacity-70">{dateStr}</div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(JSON.stringify(r.inputs  {}, null, 2))
                      }
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                    >
                      Copy inputs
                    </button>

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(JSON.stringify(r.outputs  {}, null, 2))
                      }
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                    >
                      Copy outputs
                    </button>

                    <a
                      href={`/prorun=${r.id}`}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                    >
                      Go to saved run →
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs opacity-70">Survival</div>
                    <div className="mt-1 text-3xl font-extrabold">
                      {typeof survival === "number"  `${Math.round(survival)}%` : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs opacity-70">Min equity</div>
                    <div className="mt-1 text-3xl font-extrabold">
                      {minEq != null  String(minEq) : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs opacity-70">Max equity</div>
                    <div className="mt-1 text-3xl font-extrabold">
                      {maxEq != null  String(maxEq) : "—"}
                    </div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm opacity-70 hover:opacity-100">
                    Show raw JSON
                  </summary>
                  <pre className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs opacity-80">
{JSON.stringify({ inputs: r.inputs, outputs: r.outputs }, null, 2)}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
