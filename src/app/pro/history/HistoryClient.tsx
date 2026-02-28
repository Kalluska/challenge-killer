"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Run = {
  id: string;
  inputs: any;
  outputs: any;
  created_at: string;
};

export default function HistoryClient() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pro_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setRuns(data || []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <div className="mt-6 opacity-60">Loading...</div>;
  }

  return (
    <div className="mt-6 space-y-6">
      {runs.map((r) => (
        <div
          key={r.id}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div className="text-sm opacity-70">
            {new Date(r.created_at).toLocaleString()}
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(r.inputs, null, 2))
              }
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              Copy inputs
            </button>

            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(r.outputs, null, 2))
              }
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              Copy outputs
            </button>

            <a
              href={`/pro?run=${r.id}`}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
            >
              Go to saved run
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
