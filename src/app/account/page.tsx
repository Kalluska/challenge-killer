"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GlowButton from "@/components/GlowButton";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

export default function AccountPage() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"FREE" | "PRO">("FREE");
  const [msg, setMsg] = useState<string>("");
  const [checking, setChecking] = useState<boolean>(false);

  async function refresh() {
    setChecking(true);
    setMsg("Checking…");

    try {
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const session = data.session;
      const em = session?.user?.email ?? "";
      setEmail(em);

      // 1) Gumroad redirect local unlock
      const lsPro = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";

      // 2) metadata flag (if used)
      const metaPro = Boolean((session?.user?.user_metadata as any)?.pro);

      // 3) whitelist table lookup
      let whitelist = false;
      let whitelistNote = "";

      if (em) {
        const { data: row, error: wlErr } = await supabase
          .from("pro_users")
          .select("email")
          .eq("email", em)
          .maybeSingle();

        if (wlErr) {
          // Most common: RLS blocks select
          whitelistNote =
            "Whitelist check failed (likely RLS). If you want Account to show PRO via pro_users, add an RLS policy that allows users to select their own email row.";
        } else {
          whitelist = Boolean(row?.email);
        }
      }

      const isPro = Boolean(lsPro || metaPro || whitelist);
      setStatus(isPro ? "PRO" : "FREE");

      setMsg(isPro ? "Updated (PRO)." : `Updated (FREE). ${whitelistNote}`.trim());
    } catch (e: any) {
      const m = e?.message || String(e);
      setMsg("Error: " + m);
      // keep current status, but at least UI won’t hang
    } finally {
      setChecking(false);
    }
  }

  async function logout() {
    setMsg("Logging out…");
    try {
      await supabase.auth.signOut();
      // hard redirect so session is definitely cleared in UI
      window.location.replace("/");
    } catch (e: any) {
      setMsg("Logout error: " + (e?.message || String(e)));
    }
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl font-extrabold">Account</h1>
            <div className="mt-2 opacity-70">{email || "Not logged in"}</div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="text-sm underline opacity-80 hover:opacity-100"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm opacity-70">Status</div>
            <div className="mt-2 text-5xl font-extrabold">{status}</div>

            <div className="mt-3 text-sm opacity-70">
              {status === "PRO"
                ? "You have PRO access."
                : "If you bought PRO, use the purchase redirect once (or whitelist your email)."}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={refresh}
                disabled={checking}
                className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-extrabold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? "Checking…" : "Refresh status"}
              </button>
            </div>

            <div className="mt-3 text-xs opacity-60 whitespace-pre-wrap">{msg}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm opacity-70">Quick links</div>
            <div className="mt-4 grid gap-3">
              <a className="underline opacity-90 hover:opacity-100" href="/calculator">
                Free calculator
              </a>
              <a className="underline opacity-90 hover:opacity-100" href="/pro">
                PRO
              </a>
              <GlowButton href="/" variant="ghost">
                Home
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
