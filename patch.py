from pathlib import Path
import re, sys

ROOT = Path(".")
PRO = ROOT / "src/app/pro/ProClient.tsx"
HIST = ROOT / "src/app/pro/history/HistoryClient.tsx"

def read(p: Path) -> str:
    if not p.exists():
        print(f"[ERR] Missing: {p}")
        sys.exit(1)
    return p.read_text(encoding="utf-8", errors="replace")

def write(p: Path, s: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8", newline="\n")

def normalize_src():
    repl = {
        "â€¢": "|",
        "•": "|",
        "â„¢": "TM",
        "™": "TM",
        "â€“": "-",
        "–": "-",
        "â€”": "-",
        "—": "-",
        "Ã¤": "ä",
        "Ã¶": "ö",
        "Ã…": "Å",
        "Ã„": "Ä",
        "Ã–": "Ö",
        "Â ": " ",
        "Â€": "€",
    }
    changed = 0
    for p in (ROOT / "src").rglob("*"):
        if p.suffix.lower() not in [".ts", ".tsx", ".js", ".jsx", ".css"]:
            continue
        s = read(p)
        orig = s
        for a, b in repl.items():
            s = s.replace(a, b)
        if s != orig:
            write(p, s)
            changed += 1
    print(f"[OK] Normalized text in {changed} files")

def patch_proclient():
    s = read(PRO)

    if '"use client";' in s:
        s = re.sub(r'^\s*"use client";\s*', "", s, flags=re.M)
        s = '"use client";\n' + s.lstrip()

    s = s.replace("Run a simulation first.", "")
    s = s.replace(" • ", " | ").replace("•", "|").replace("â€¢", "|")

    s = s.replace(" show={", " open={").replace(" onDone={", " onClose={")

    save_body = r'''
    // Robust save: try multiple column layouts.
    try {
      const u = await supabase.auth.getUser();
      const email = u.data.user?.email ?? null;
      const uid = u.data.user?.id ?? null;

      const candidates: any[] = [];
      if (email) candidates.push({ user_email: email, inputs, outputs });
      if (email) candidates.push({ email, inputs, outputs });
      if (uid) candidates.push({ user_id: uid, inputs, outputs });
      if (uid) candidates.push({ uid, inputs, outputs });
      candidates.push({ inputs, outputs });

      let lastErr: any = null;
      let insertedId: string | null = null;

      for (const payload of candidates) {
        const { data, error } = await supabase
          .from("runs")
          .insert(payload)
          .select("id")
          .single();

        if (!error) {
          insertedId = (data as any)?.id ?? null;
          lastErr = null;
          break;
        }
        lastErr = error;
      }

      if (lastErr) throw lastErr;

      setToastMsg("Run saved");
      setToastOpen(true);
      return insertedId;
    } catch (e: any) {
      const msg = e?.message || JSON.stringify(e);
      console.error("SAVE FAILED:", e);
      setToastMsg("Save failed: " + msg);
      setToastOpen(true);
      return null;
    }
'''.strip("\n")

    def replace_fn(m):
        return m.group(1) + "\n" + save_body + "\n" + m.group(3)

    s2 = re.sub(
        r'(async\s+function\s+handleSaveRun\s*\([^)]*\)\s*\{)([\s\S]*?)(\n\})',
        replace_fn,
        s,
        count=1
    )
    if s2 == s:
        s2 = re.sub(
            r'(const\s+handleSaveRun\s*=\s*async\s*\([^)]*\)\s*=>\s*\{)([\s\S]*?)(\n\};)',
            lambda m: m.group(1) + "\n" + save_body + "\n" + m.group(3),
            s,
            count=1
        )
    if s2 == s:
        s2 = s + "\n\nconst handleSaveRun = async (inputs: any, outputs: any) => {\n" + save_body + "\n};\n"

    write(PRO, s2)
    print("[OK] Patched ProClient")

def write_historyclient():
    code = r'''"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RunRow = { id: string; created_at: string; inputs: any; outputs: any; };

function fmt(dt: string) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function HistoryClient() {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [who, setWho] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const u = await supabase.auth.getUser();
      const email = u.data.user?.email ?? null;
      const uid = u.data.user?.id ?? null;
      setWho(email || uid || null);

      const attempts: (() => Promise<any>)[] = [];
      if (email) attempts.push(() => supabase.from("runs").select("id,created_at,inputs,outputs").eq("user_email", email).order("created_at", { ascending: false }).limit(20));
      if (email) attempts.push(() => supabase.from("runs").select("id,created_at,inputs,outputs").eq("email", email).order("created_at", { ascending: false }).limit(20));
      if (uid) attempts.push(() => supabase.from("runs").select("id,created_at,inputs,outputs").eq("user_id", uid).order("created_at", { ascending: false }).limit(20));
      if (uid) attempts.push(() => supabase.from("runs").select("id,created_at,inputs,outputs").eq("uid", uid).order("created_at", { ascending: false }).limit(20));
      attempts.push(() => supabase.from("runs").select("id,created_at,inputs,outputs").order("created_at", { ascending: false }).limit(20));

      let lastErr: any = null;
      let data: any = null;

      for (const fn of attempts) {
        const res = await fn();
        if (!res.error) { data = res.data; lastErr = null; break; }
        lastErr = res.error;
      }
      if (lastErr) throw lastErr;

      setRows(data || []);
    } catch (e: any) {
      console.error("HISTORY LOAD FAILED:", e);
      setErr(e?.message || "Failed to load history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const content = useMemo(() => {
    if (loading) return <div className="mt-3 text-sm opacity-70">Loading…</div>;
    if (err) return <div className="mt-3 text-sm text-red-300">{err}</div>;
    if (!rows.length) return <div className="mt-3 text-sm opacity-70">No saved runs yet.</div>;

    return (
      <div className="mt-6 space-y-4">
        {rows.map((r) => {
          const surv =
            r.outputs?.passProbability ??
            r.outputs?.survivalProbability ??
            r.outputs?.survival ??
            null;

          return (
            <div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm opacity-70">{fmt(r.created_at)}</div>
                  <div className="mt-2 text-2xl font-extrabold">
                    Survival: {surv !== null ? `${Math.round(Number(surv))}%` : "—"}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(r.inputs ?? {}, null, 2))}
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                  >
                    Copy inputs
                  </button>

                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(r.outputs ?? {}, null, 2))}
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                  >
                    Copy outputs
                  </button>

                  <a
                    href={`/pro?run=${r.id}`}
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition"
                  >
                    Go to saved run →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [loading, err, rows]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-4xl font-extrabold">Run History</div>
            <div className="mt-2 text-sm opacity-70">Last 20 PRO simulations (saved to your account).</div>
            {who && <div className="mt-1 text-xs opacity-60">{who}</div>}
          </div>
          <div className="flex gap-3">
            <a href="/pro" className="text-sm underline opacity-80 hover:opacity-100">Back to PRO</a>
            <button onClick={load} className="text-sm underline opacity-80 hover:opacity-100">Refresh</button>
          </div>
        </div>

        {content}
      </div>
    </div>
  );
}
'''
    write(HIST, code)
    print("[OK] Rewrote HistoryClient")

normalize_src()
patch_proclient()
write_historyclient()
print("[DONE]")
