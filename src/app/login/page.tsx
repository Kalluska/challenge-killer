"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/account";
    });
  }, []);

  async function sendLink() {
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setSent(true);
    setMsg("Magic link sent. Check your email.");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-extrabold">Login</h1>
        <p className="mt-2 text-sm opacity-70">
          Use email magic link. This lets PRO stay unlocked across devices.
        </p>

        <div className="mt-5">
          <label className="text-sm opacity-70">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>

        <button
          onClick={sendLink}
          disabled={!email.includes("@")}
          className="mt-4 w-full rounded-xl bg-white py-3 font-extrabold text-black disabled:opacity-50"
        >
          {sent ? "Resend magic link" : "Send magic link"}
        </button>

        {msg && <div className="mt-3 text-sm opacity-80">{msg}</div>}
      </div>
    </main>
  );
}
