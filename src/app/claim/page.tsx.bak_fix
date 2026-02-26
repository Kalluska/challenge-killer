"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import GlowButton from "@/components/GlowButton";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

export default function ClaimPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState<"checking" | "need_login" | "claiming" | "done" | "error">("checking");
  const [msg, setMsg] = useState<string>("Checking session…");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        const userEmail = session?.user?.email?.toLowerCase() || "";

        if (!session || !userEmail) {
          setState("need_login");
          setMsg("Please login to claim PRO.");
          return;
        }

        // Optional: allow ?email=... but default to logged-in user email
        const qEmail = (sp.get("email") || "").trim().toLowerCase();
        const emailToClaim = qEmail || userEmail;

        // Safety: only allow claiming for yourself
        if (emailToClaim !== userEmail) {
          setState("error");
          setMsg("Email mismatch. Login with the same email you used for purchase.");
          return;
        }

        setState("claiming");
        setMsg("Claiming PRO…");

        const r = await fetch("/api/claim-pro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToClaim }),
        });

        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) {
          throw new Error(j?.error || "Claim failed");
        }

        // Instant UX
        localStorage.setItem(LS_KEY, "1");

        setState("done");
        setMsg("PRO claimed. Redirecting…");

        setTimeout(() => router.replace("/pro?claimed=1"), 600);
      } catch (e: any) {
        setState("error");
        setMsg(e?.message || "Claim failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="text-3xl font-extrabold">Claim PRO</div>
        <div className="mt-3 text-sm opacity-70">{msg}</div>

        {state === "need_login" && (
          <div className="mt-6 flex gap-3 flex-wrap">
            <GlowButton href="/login">Login</GlowButton>
            <GlowButton href="/" variant="ghost">Home</GlowButton>
          </div>
        )}

        {state === "error" && (
          <div className="mt-6 flex gap-3 flex-wrap">
            <GlowButton href="/account">Go to Account</GlowButton>
            <GlowButton href="/login" variant="ghost">Login</GlowButton>
          </div>
        )}

        {(state === "checking" || state === "claiming") && (
          <div className="mt-6 text-xs opacity-60">Do not close this tab.</div>
        )}
      </div>
    </main>
  );
}
