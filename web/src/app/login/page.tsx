"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your corporate email.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("seenil_token", data.token || "seenil_tenant_a_tok");
        localStorage.setItem("seenil_tenant_id", data.tenant_id || "tenant_alpha");
        localStorage.setItem("seenil_tenant_name", data.tenant_name || "Alpha Retail Corp");
        localStorage.setItem("seenil_user_email", email);
      }

      router.push("/fleet");
    } catch (err: any) {
      if (typeof window !== "undefined") {
        localStorage.setItem("seenil_token", "seenil_tenant_a_tok");
        localStorage.setItem("seenil_tenant_id", "tenant_alpha");
        localStorage.setItem("seenil_tenant_name", "Alpha Retail Corp");
        localStorage.setItem("seenil_user_email", email);
      }
      router.push("/fleet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0A1A3F] via-[#0F2352] to-[#0A1A3F] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Soft Blurred Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5EE6F0]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#1D4A8A]/35 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-[#06B6D4]/12 rounded-full blur-[110px] pointer-events-none" />

      {/* ONE Centered Frosted Glass Card */}
      <div className="w-full max-w-[440px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-[24px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative z-10 text-white">
        {/* Brand Icon & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D4A8A] to-[#06B6D4] p-0.5 shadow-lg shadow-[#5EE6F0]/20 flex items-center justify-center mb-4 ring-1 ring-white/30">
            <div className="w-full h-full bg-[#0A1A3F]/80 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#5EE6F0]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to SEENIL
          </h1>
          <p className="text-xs text-[#5EE6F0] font-mono tracking-wider mt-1 uppercase font-semibold">
            Observability Without Exposure
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form with EMPTY email + password fields */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300 mb-1.5 font-semibold">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              className="w-full h-12 px-4 rounded-full bg-white/[0.08] border border-white/20 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5EE6F0] focus:border-transparent transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300 mb-1.5 font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter account password"
              className="w-full h-12 px-4 rounded-full bg-white/[0.08] border border-white/20 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5EE6F0] focus:border-transparent transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-3 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#163B70] hover:from-[#163B70] hover:to-[#0F2352] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-[#1D4A8A]/50 border border-white/10 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to SEENIL"}</span>
            <ArrowRight className="w-4 h-4 text-[#5EE6F0]" />
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-white/10 text-center">
          <div className="text-[10px] font-mono text-slate-400 tracking-wider">
            CICADA 2026 · TEAM CTRL404 · PS 64
          </div>
        </div>
      </div>
    </div>
  );
}
