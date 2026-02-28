"use client";

import { useEffect, useState } from "react";

const LS_KEY = "ck_pro_unlocked_v1";

export default function ProUnlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem(LS_KEY) === "1") onUnlocked();
  }, [onUnlocked]);

  async function verify() {
    setStatus("checking");
    setMsg("");

    try {
      const r = await fetch("/api/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await r.json();

      if (data.ok) {
        localStorage.setItem(LS_KEY, "1");
        setStatus("ok");
        setMsg("Unlocked ✅");
        onUnlocked();
      } else {
        setStatus("bad");
        setMsg(data.error  "Invalid key");
      }
    } catch {
      setStatus("bad");
      setMsg("Network error");
    }
  }

  return (
    <div className="border border-white/15 rounded-2xl p-5 bg-white/5">
      <div className="font-bold mb-2">Unlock PRO</div>
      <div className="text-sm opacity-70 mb-4">Paste your Gumroad license key.</div>

      <input
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value)}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        className="w-full bg-black/40 border border-white/15 rounded-xl p-3 mb-3 outline-none"
      />

      <button
        onClick={verify}
        disabled={licenseKey.trim().length < 10 || status === "checking"}
        className="w-full rounded-xl py-3 font-bold bg-white text-black disabled:opacity-50"
      >
        {status === "checking"  "Verifying..." : "Unlock"}
      </button>

      {msg && <div className="mt-3 text-sm">{msg}</div>}
    </div>
  );
}
