"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CloudLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("analyst@seenil.cloud");
  const [password, setPassword] = useState("seenil_cloud_pass");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/cloud/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-mono">
          <span>&larr; Switch View</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TIER 2 · CENTRAL AIOPS SAAS</span>
        </div>
      </header>

      {/* Centered Black Glass Card */}
      <main className="z-10 max-w-md mx-auto w-full py-8">
        <div className="bg-[#09090B] border border-zinc-800 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-7">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                SEENIL Cloud SaaS
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Central Multi-Tenant Ingestion &amp; AIOps
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-zinc-300">
                Operator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@seenil.cloud"
                className="w-full bg-[#000000] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-zinc-300">
                SaaS Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-[#000000] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Connecting to Ingestion..." : "Sign In to Cloud SaaS"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-zinc-800 text-center">
            <span className="text-[10px] font-mono text-zinc-400">
              Zero raw telemetry received · All data pseudonymized at edge
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-[11px] text-zinc-500 font-mono py-2">
        SEENIL Cloud SaaS · Ingestion Engine v2.4 · Real Telemetry
      </footer>
    </div>
  );
}