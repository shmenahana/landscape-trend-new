"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardLogin() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const initialErr = search.get("err") === "unconfigured"
    ? "Dashboard password not configured. Set DASHBOARD_PASSWORD in .env."
    : null;

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialErr);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }
      router.replace(next);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" aria-hidden />
      <div className="flex-1 flex items-start justify-center px-5 py-12">
        <section className="w-full max-w-md">
          <div className="text-center">
            <p className="font-script text-gold text-3xl">The</p>
            <h1 className="font-serif text-4xl text-navy -mt-1">Magnet Parlor</h1>
            <div className="heart-divider my-6"><span>♥</span></div>
            <p className="text-xs text-warmgray uppercase tracking-widest">Operator Sign-In</p>
          </div>
          <form onSubmit={onSubmit} className="parlor-card p-6 mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full" disabled={submitting || !password}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
