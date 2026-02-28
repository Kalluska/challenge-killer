"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user.email  null);
    });
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="text-3xl font-extrabold mb-6">Account</div>
        {email  (
          <div className="opacity-80">Logged in as {email}</div>
        ) : (
          <div className="opacity-60">Not logged in</div>
        )}
      </div>
    </main>
  );
}
