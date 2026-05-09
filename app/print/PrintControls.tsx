"use client";

import { useEffect } from "react";

export default function PrintControls() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={() => window.print()}
      className="no-print print-trigger-btn"
      aria-label="Print"
    >
      Print Now
    </button>
  );
}
