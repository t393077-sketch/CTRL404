"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Lock, Key, Terminal } from "lucide-react";
import Link from "next/link";

export default function AgentLoginPage() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState("node_40b9c8e26f984f20");
  const [token, setToken] = useState("seenil_agent_alpha_key");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/agent/dashboard");
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
        <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>TIER 1 · ON-PREMISE ENCLAVE</span>
        </div>
      </header>

      {/* Centered Dark Glass Card */}
      <main className="z-10 max-w-md mx-auto w-full py-8">
        <div className="bg-[#0A1A3F]/85 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-7">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Terminal className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                SEENIL Agent Console
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Customer Host &amp; Egress Vault Login
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300">
                Collector Node ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="node_xxxxxxxx"
                  className="w-full bg-[#070E1E]/80 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#5EE6F0]/60 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300">
                Agent HMAC Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
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
                className="w-full h-11 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#0A1A3F] hover:from-[#163B70] hover:to-[#0F2352] border border-[#5EE6F0]/30 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#1D4A8A]/30 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Authenticating Enclave..." : "Enter Local Console"}</span>
                <ArrowRight className="w-4 h-4 text-[#5EE6F0]" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] font-mono text-slate-400">
              🔒 Local SQLite table strictly isolated · Zero raw telemetry leaves host
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-[11px] text-slate-400 font-mono py-2">
        SEENIL Edge Daemon v1.0.0 · Localhost Enclave · Real Data
      </footer>
    </div>
  );
}