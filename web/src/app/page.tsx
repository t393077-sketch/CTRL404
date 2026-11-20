"use client";

import React from "react";
import Link from "next/link";
import { Shield, Cloud, Terminal, Cpu, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function ChoiceScreen() {
  return (
    <div className="min-h-screen bg-[#070E1E] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1D4A8A]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5EE6F0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1D4A8A] to-[#0A1A3F] border border-[#1B3A6B] flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-[#5EE6F0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">SEENIL</span>
              <span className="text-[10px] font-mono text-[#5EE6F0] bg-[#5EE6F0]/10 border border-[#5EE6F0]/20 px-2 py-0.5 rounded-full uppercase">
                v2.4 Dual-Tier
              </span>
            </div>
            <p className="text-xs text-slate-400">Observability Without Exposure</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>TEAM 64 · CICADA 2026</span>
        </div>
      </header>

      {/* Center Choice Selection */}
      <main className="z-10 max-w-5xl mx-auto w-full py-12 space-y-10">
        <div className="text-center space-y-3">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300 uppercase tracking-widest">
            Select Evaluation Environment
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Choose Your Operational View
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Experience SEENIL&apos;s cryptographically isolated two-tier architecture: inspect raw telemetry in the on-premise Customer Enclave or monitor sanitized intelligence in the Central SaaS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* TIER 1: AGENT CONSOLE */}
          <Link
            href="/agent/login"
            className="group relative bg-[#0A1A3F]/80 hover:bg-[#0E2356]/90 border border-white/10 hover:border-[#5EE6F0]/50 rounded-[28px] p-8 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(94,230,240,0.15)] flex flex-col justify-between space-y-8"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Terminal className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-mono font-bold tracking-wider uppercase">
                  TIER 1 · LOCAL CUSTOMER
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-[#5EE6F0] transition-colors">
                  SEENIL Agent Console
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Customer Host &amp; Edge Enclave</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Inspect local SQLite vault with unredacted raw machine logs, real-time regex/entropy redaction pipeline, and live interactive chaos injection controls.
              </p>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Local Vault (Raw logs never leave machine)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time Egress Packet Strip &amp; Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Chaos Simulator (Kill connection &amp; inject secrets)</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition group-hover:border-[#5EE6F0]/60">
              <span>Enter as Local Agent</span>
              <ArrowRight className="w-4 h-4 text-[#5EE6F0] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* TIER 2: CLOUD SAAS */}
          <Link
            href="/cloud/login"
            className="group relative bg-[#0A1A3F]/80 hover:bg-[#0E2356]/90 border border-white/10 hover:border-[#10B981]/50 rounded-[28px] p-8 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)] flex flex-col justify-between space-y-8"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Cloud className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[11px] font-mono font-bold tracking-wider uppercase">
                  TIER 2 · CENTRAL SAAS
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  SEENIL Cloud
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Multi-Tenant AIOps Intelligence</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Monitor multi-tenant fleet health, automated MAD anomaly detection, alert correlation dockets, zero-loss SLAs, and live pseudonymized telemetry streams.
              </p>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Metadata-only ingestion (0 raw logs received)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Fleet health states (Excellent / Good / Fair / Poor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Multi-tenant selector (Alpha Corp &amp; Beta Cloud)</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#10B981] hover:from-[#163B70] hover:to-[#059669] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#1D4A8A]/30">
              <span>Enter as Cloud SaaS</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-xs text-slate-400 font-mono py-4">
        SEENIL AIOps Architecture · Dual-Tier Cryptographic Isolation · All Data Real
      </footer>
    </div>
  );
}