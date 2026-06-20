"use client";

import { useEffect } from "react";

export default function PrintControls({ delayMs = 500 }: { delayMs?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return null;
}
