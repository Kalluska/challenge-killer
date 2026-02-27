"use client";

import GlowButton from "@/components/GlowButton";

export default function UpgradeModal({
  open,
  onClose,
  title = "Free saves used",
  subtitle = "Upgrade to PRO to save unlimited runs and unlock full Monte Carlo.",
  gumroadUrl,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  gumroadUrl?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/12 bg-black/70 p-6 backdrop-blur-xl shadow-[0_0_60px_rgba(255,255,255,0.08)]">
        <div className="text-2xl font-extrabold">{title}</div>
        <div className="mt-2 text-sm opacity-80">{subtitle}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <GlowButton href="/pro" variant="primary" className="w-full">
            Go PRO
          </GlowButton>

          {gumroadUrl ? (
            <a
              href={gumroadUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold hover:bg-white/15 transition"
            >
              Buy on Gumroad
            </a>
          ) : (
            <a
              href="/pro"
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold hover:bg-white/15 transition"
            >
              Unlock unlimited saves
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm opacity-80 hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
