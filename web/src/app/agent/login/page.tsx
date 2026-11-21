"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Terminal, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AgentLoginPage() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState("node_40b9c8e26f984f20");
  const [token, setToken] = useState("seenil_agent_alpha_key");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Input validation
    if (!nodeId.trim() || !nodeId.startsWith("node_")) {
      setErrorMessage("Collector Node ID must be in format 'node_xxxxxxxx'.");
      return;
    }
    if (!token.trim() || token.length < 8) {
      setErrorMessage("HMAC Secret Key must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      // 2. Verify local agent daemon is reachable on port 8765
      const res = await fetch("http://127.0.0.1:8765/status");
      if (res.ok) {
        // Enclave verified
        if (typeof window !== "undefined") {
          sessionStorage.setItem("seenil_agent_session", JSON.stringify({
            nodeId: nodeId.trim(),
            token: token.trim(),
            enclavePort: 8765,
            loggedInAt: new Date().toISOString()
          }));
        }
        router.push("/agent/dashboard");
      } else {
        setErrorMessage("Local daemon responded with an error. Ensure agent is initialized.");
      }
    } catch (_) {
      // Offline fallback: allow local login if key matches expected
      if (token === "seenil_agent_alpha_key" || token === "token_alpha_sec_98124") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("seenil_agent_session", JSON.stringify({
            nodeId: nodeId.trim(),
            token: token.trim(),
            enclavePort: 8765,
            loggedInAt: new Date().toISOString()
          }));
        }
        router.push("/agent/dashboard");
      } else {
        setErrorMessage("Agent daemon unreachable on localhost:8765 and credentials not recognized.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      
      {/* Top Bar */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition text-xs font-semibold vision-pill px-3 py-1.5 cursor-pointer vision-interactive">
          <span>&larr; Switch View</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 vision-pill px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>TIER 1 · LOCAL CUSTOMER ENCLAVE</span>
        </div>
      </header>

      {/* Centered Master Glass Card */}
      <main className="z-10 max-w-md mx-auto w-full py-8">
        <div className="vision-card-dark p-8 sm:p-10 shadow-2xl space-y-7 relative overflow-hidden">
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                SEENIL Agent Console
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Customer Host &amp; Egress Vault Login • Port 8765
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                Collector Node ID
              </label>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                placeholder="node_xxxxxxxx"
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400 transition shadow-inner"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                Agent HMAC Secret Key
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400 transition shadow-inner"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50 vision-interactive"
              >
                <span>{loading ? "Verifying Enclave Credentials..." : "Enter Local Console"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-white/10 text-center">
            <span className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              <span>Zero Raw Data Leaves Host Machine</span>
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-500 font-medium">
        <span>SEENIL Enclave Tier 1 · Local Machine Only</span>
      </footer>
    </div>
  );
}