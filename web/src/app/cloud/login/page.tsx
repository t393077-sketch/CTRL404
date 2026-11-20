"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, ArrowRight, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-[#070E1E] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Background radial orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#1D4A8A]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-[#0A1A3F]/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition text-xs font-mono">
          <span>&larr; Switch View</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>TIER 2 · CENTRAL AIOPS SAAS</span>
        </div>
      </header>

      {/* Centered Dark Glass Card */}
      <main className="z-10 max-w-md mx-auto w-full py-8">
        <div className="bg-[#0A1A3F]/85 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-7">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                SEENIL Cloud SaaS
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Central Multi-Tenant Ingestion &amp; AIOps
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300">
                Operator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@seenil.cloud"
                  className="w-full bg-[#070E1E]/80 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#5EE6F0]/60 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300">
                SaaS Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-[#070E1E]/80 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#5EE6F0]/60 transition"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#10B981] hover:from-[#163B70] hover:to-[#059669] text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#1D4A8A]/30 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Connecting to Ingestion..." : "Sign In to Cloud SaaS"}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] font-mono text-slate-400">
              🛡️ Zero raw telemetry received · All data pseudonymized at edge
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-[11px] text-slate-400 font-mono py-2">
        SEENIL Cloud SaaS · Ingestion Engine v2.4 · Real Telemetry
      </footer>
    </div>
  );
}