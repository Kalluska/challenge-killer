"use client";

type Props = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  variant?: "solid" | "ghost";
  className?: string;
};

export default function GlowButton({
  href,
  children,
  external,
  variant = "solid",
  className = "",
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-3 font-extrabold transition-all duration-300 " +
    "hover:scale-[1.03] active:scale-[0.99]";

  const solid =
    "bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.40)]";

  const ghost =
    "border border-white/20 text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]";

  const cls = `${base} ${variant === "solid" ? solid : ghost} ${className}`;

  return (
    <a
      href={href}
      className={cls}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
