"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowRight, Terminal, Cloud, CheckCircle2, Lock, Cpu } from "lucide-react";

export default function ChoiceScreen() {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Subtle minimalist background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black font-mono shadow-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-widest text-base text-white font-mono">SEENIL</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase">
                AIOps Architecture
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">Observability Without Exposure</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TEAM 64 · CICADA 2026</span>
        </div>
      </header>

      {/* Center Choice Selection */}
      <main className="z-10 max-w-5xl mx-auto w-full py-12 space-y-10">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 uppercase tracking-widest">
            Cryptographic Dual-Tier Separation
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Select Operational Portal
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-normal">
            Directly test the isolation boundary between customer on-premise data collection and central SaaS AIOps intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* TIER 1: AGENT CONSOLE */}
          <Link
            href="/agent/login"
            className="group relative bg-[#09090B] hover:bg-[#121214] border border-zinc-800 hover:border-zinc-500 rounded-[28px] p-8 transition-all duration-300 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Terminal className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[11px] font-mono font-bold tracking-wider uppercase">
                  TIER 1 · LOCAL ENCLAVE
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-zinc-200 transition-colors">
                  SEENIL Agent Console
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">Customer Host &amp; Edge Vault</p>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Inspect local SQLite vault with unredacted raw machine logs, real-time regex/entropy redaction pipeline, and live interactive chaos injection controls.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Local Vault (Raw logs never leave machine)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Real-time Egress Packet Strip &amp; Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Chaos Simulator (Kill connection &amp; inject secrets)</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg">
              <span>Enter as Local Agent</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* TIER 2: CLOUD SAAS */}
          <Link
            href="/cloud/login"
            className="group relative bg-[#09090B] hover:bg-[#121214] border border-zinc-800 hover:border-zinc-500 rounded-[28px] p-8 transition-all duration-300 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Cloud className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[11px] font-mono font-bold tracking-wider uppercase">
                  TIER 2 · CENTRAL SAAS
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-zinc-200 transition-colors">
                  SEENIL Cloud SaaS
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">Multi-Tenant AIOps Intelligence</p>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Monitor multi-tenant fleet health, automated MAD anomaly detection, alert correlation dockets, zero-loss SLAs, and live pseudonymized telemetry streams.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Metadata-only ingestion (0 raw logs received)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Fleet health states (Excellent / Good / Fair / Poor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Multi-tenant selector (Alpha Corp &amp; Beta Cloud)</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg">
              <span>Enter as Cloud SaaS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-xs text-zinc-500 font-mono py-4">
        SEENIL Observability Platform · High-Contrast Cryptographic Isolation · All Data Real
      </footer>
    </div>
  );
}