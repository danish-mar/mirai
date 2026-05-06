"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LogIn, Sparkles } from "lucide-react";
import { MotionPage } from "@/components/motion-page";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MotionPage className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="mb-8 inline-flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Mirai</span>
            <span className="text-lg font-semibold text-accent">未来</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-zinc-400">Sign in to your account to continue streaming.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
                <Link href="#" className="text-xs font-bold text-accent hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <LogIn className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 italic">
              Access is restricted to authorized users only.
            </p>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
          <Sparkles className="h-3 w-3" />
          Powered by Mirai Core
        </div>
      </div>
    </MotionPage>
  );
}
