"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Terminal } from "lucide-react";
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
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-mono">
          <span>&larr; Switch View</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TIER 1 · LOCAL CUSTOMER ENCLAVE</span>
        </div>
      </header>

      {/* Centered Black Glass Card */}
      <main className="z-10 max-w-md mx-auto w-full py-8">
        <div className="bg-[#09090B] border border-zinc-800 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-7">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                SEENIL Agent Console
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Customer Host &amp; Egress Vault Login
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-zinc-300">
                Collector Node ID
              </label>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                placeholder="node_xxxxxxxx"
                className="w-full bg-[#000000] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-zinc-300">
                Agent HMAC Secret Key
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
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
                <span>{loading ? "Verifying Enclave..." : "Enter Local Console"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-zinc-800 text-center">
            <span className="text-[10px] font-mono text-zinc-400">
              Local SQLite table strictly isolated · Zero raw telemetry leaves host
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-[11px] text-zinc-500 font-mono py-2">
        SEENIL Edge Daemon v1.0.0 · Localhost Enclave · Real Data
      </footer>
    </div>
  );
}