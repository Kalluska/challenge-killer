"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GlowButton from "@/components/GlowButton";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export default function AccountPage() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"FREE" | "PRO">("FREE");
  const [msg, setMsg] = useState<string>("");
  const [checking, setChecking] = useState<boolean>(false);

  async function refresh() {
    setChecking(true);
    setMsg("Checking…");

    try {
      const { data, error: sessErr } = await withTimeout(
        supabase.auth.getSession(),
        4000,
        "auth.getSession()"
      );
      if (sessErr) throw sessErr;

      const session = data.session;
      const em = session?.user?.email ?? "";
      setEmail(em);

      // 1) Gumroad redirect local unlock
      const lsPro = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";

      // 2) metadata flag (if used)
      const metaPro = Boolean((session?.user?.user_metadata as any)?.pro);

      // 3) whitelist table lookup (may fail due to RLS)
      let whitelist = false;
      let note = "";

      if (em) {
        try {
          const res = await withTimeout(
            supabase.from("pro_users").select("email").eq("email", em).maybeSingle(),
            4000,
            "pro_users select"
          );
          whitelist = Boolean(res.data?.email) && !res.error;
          if (res.error) note = "Whitelist check blocked (RLS).";
        } catch (e: any) {
          note = e?.message || "Whitelist check failed.";
        }
      }

      const isPro = Boolean(lsPro || metaPro || whitelist);
      setStatus(isPro ? "PRO" : "FREE");

      setMsg(isPro ? "Updated (PRO)." : `Updated (FREE). ${note}`.trim());
    } catch (e: any) {
      setMsg("Error: " + (e?.message || String(e)));
    } finally {
      setChecking(false);
    }
  }

  function forceRedirectHomeSoon() {
    // Always redirect even if Supabase hangs
    setTimeout(() => {
      try {
        window.location.replace("/");
      } catch {
        window.location.href = "/";
      }
    }, 300);
  }

  async function logout() {
    setMsg("Logging out…");

    // Do NOT let signOut block UX
    forceRedirectHomeSoon();

    try {
      await withTimeout(supabase.auth.signOut(), 2500, "auth.signOut()");
    } catch {
      // ignore – redirect already scheduled
    }
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loggedIn = Boolean(email);

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl font-extrabold">Account</h1>
            <div className="mt-2 opacity-70">{loggedIn ? email : "Not logged in"}</div>
          </div>

          {loggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="text-sm underline opacity-80 hover:opacity-100"
            >
              Logout
            </button>
          ) : (
            <a href="/login" className="text-sm underline opacity-80 hover:opacity-100">
              Login
            </a>
          )}
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

            <div className="mt-5 flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={refresh}
                disabled={checking}
                className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-extrabold hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? "Checking…" : "Refresh status"}
              </button>

              {!loggedIn && (
                <GlowButton href="/login" variant="ghost">
                  Login
                </GlowButton>
              )}
            </div>

            <div className="mt-3 text-xs opacity-60 whitespace-pre-wrap">{msg}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm opacity-70">Quick links</div>
            <div className="mt-4 grid gap-3">
              <a className="underline opacity-90 hover:opacity-100" href="/calculator">Free calculator</a>
              <a className="underline opacity-90 hover:opacity-100" href="/pro">PRO</a>
              <GlowButton href="/" variant="ghost">Home</GlowButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
