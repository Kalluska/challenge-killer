"use client";

export default function GlowBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Animated blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-blob glow-blob-a" />
        <div className="glow-blob glow-blob-b" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/80" />
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}
