"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const [email, setEmail] = useState<string>("");
  const [pro, setPro] = useState<boolean>(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      const user = data.session.user;
      setEmail(user.email ?? "");
      setPro(Boolean((user.user_metadata as any)?.pro));
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/login";
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function refreshMeta() {
    setMsg("");
    const { data } = await supabase.auth.getUser();
    const isPro = Boolean((data.user?.user_metadata as any)?.pro);
    setPro(isPro);
    setMsg("Updated.");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold">Account</h1>
            <p className="mt-1 text-sm opacity-70">{email}</p>
          </div>
          <button onClick={logout} className="text-sm underline opacity-80 hover:opacity-100">Logout</button>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm opacity-70">Status</div>
            <div className="mt-2 text-3xl font-extrabold">{pro ? "PRO ✅" : "FREE"}</div>
            <p className="mt-2 text-sm opacity-70">
              If you bought PRO, use the purchase redirect once to claim it to your account.
            </p>
            <button
              onClick={refreshMeta}
              className="mt-4 rounded-xl border border-white/15 px-4 py-2 font-bold hover:bg-white/10"
            >
              Refresh status
            </button>
            {msg && <div className="mt-2 text-sm opacity-70">{msg}</div>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm opacity-70">Quick links</div>
            <div className="mt-3 flex flex-col gap-2">
              <a className="underline" href="/calculator">Free calculator</a>
              <a className="underline" href="/pro">PRO</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
