"use client";
import { useEffect, useState } from "react";
import GlowButton from "@/components/GlowButton";
import { supabase } from "@/lib/supabase";

type ProRunRow = {
  id: string;
  created_at: string;
  inputs: any;
  outputs: any;
};

function fmt(dt: string) {
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

export default function HistoryClient() {
  const [email, setEmail] = useState<string>("");
  const [rows, setRows] = useState<ProRunRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data: ses } = await supabase.auth.getSession();
      const em = ses.session?.user?.email || "";
      setEmail(em);

      if (!ses.session?.user) {
        setRows([]);
        setErr("Not logged in. Please login to view history.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pro_runs")
        .select("id, created_at, inputs, outputs")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRows((data || []) as any);
    } catch (e: any) {
      setErr(e?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold">Run History</div>
            <div className="mt-1 text-sm opacity-70">
              Last 20 PRO simulations (saved to your account).
            </div>
            {email && <div className="mt-1 text-xs opacity-60">{email}</div>}
          </div>

          <div className="flex gap-2">
            <GlowButton href="/pro" variant="ghost">Back to PRO</GlowButton>
            <button
              onClick={load}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-sm opacity-70">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 text-sm opacity-70">
            No saved runs yet. Run a PRO simulation and it will appear here.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {rows.map((r) => {
              const surv = r.outputs?.survivalProbability ?? r.outputs?.survival ?? null;
              const minEq = r.outputs?.minEquity ?? r.outputs?.min ?? null;
              const maxEq = r.outputs?.maxEquity ?? r.outputs?.max ?? null;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm opacity-80">{fmt(r.created_at)}</div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 transition"
                        onClick={async () => {
                          await navigator.clipboard.writeText(JSON.stringify(r.inputs, null, 2));
                        }}
                      >
                        Copy inputs
                      </button>
                      <button
                        className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 transition"
                        onClick={async () => {
                          await navigator.clipboard.writeText(JSON.stringify(r.outputs, null, 2));
                        }}
                      >
                        Copy outputs</button>
              <a
                href={`/pro?run=${r.id}`}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
              >
                Go to saved run
              </a>
              <button
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs opacity-60">Survival</div>
                      <div className="text-2xl font-extrabold">
                        {surv == null ? "—" : `${Math.round(Number(surv))}%`}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs opacity-60">Min equity</div>
                      <div className="text-2xl font-extrabold">{minEq ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs opacity-60">Max equity</div>
                      <div className="text-2xl font-extrabold">{maxEq ?? "—"}</div>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs opacity-70 hover:opacity-90">
                      Show raw JSON
                    </summary>
                    <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[11px] leading-relaxed">
{JSON.stringify({ inputs: r.inputs, outputs: r.outputs }, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
