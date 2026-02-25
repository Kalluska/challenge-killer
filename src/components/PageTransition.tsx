"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(0);

  useEffect(() => {
    // bump key to restart animation on route change
    setKey((k) => k + 1);
  }, [pathname]);

  return (
    <div key={key} className="page-fade">
      {children}
    </div>
  );
}
