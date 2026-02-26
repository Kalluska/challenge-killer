"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GlowButton from "@/components/GlowButton";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

export default function AccountPage() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"FREE" | "PRO">("FREE");
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    setMsg("Checking…");

    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const em = session?.user?.email ?? "";
    setEmail(em);

    // 1) localStorage unlock (Gumroad redirect)
    const lsPro = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";

    // 2) metadata flag (if you used it earlier)
    const metaPro = Boolean((session?.user?.user_metadata as any)?.pro);

    // 3) whitelist table
    let whitelist = false;
    if (em) {
      const { data: row, error } = await supabase
        .from("pro_users")
        .select("email")
        .eq("email", em)
        .maybeSingle();

      whitelist = Boolean(row?.email) && !error;
    }

    const isPro = Boolean(lsPro || metaPro || whitelist);
    setStatus(isPro ? "PRO" : "FREE");
    setMsg("Updated.");
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-extrabold">Account</h1>
            <div className="mt-1 opacity-70">{email}</div>
          </div>

          <button
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
                : "If you bought PRO, use purchase redirect once to claim it."}
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
              <button
                onClick={refresh}
                className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 font-extrabold hover:bg-white/10 transition-all"
              >
                Refresh status
              </button>
            </div>

            <div className="mt-3 text-xs opacity-60">{msg}</div>
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
