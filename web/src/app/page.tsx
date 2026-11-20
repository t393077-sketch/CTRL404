"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Cloud, CheckCircle2, ShieldCheck, Lock, Activity, Layers } from "lucide-react";

export default function ChoiceScreen() {
  return (
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      
      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full pt-2">
        <div className="flex items-center gap-3">
          {/* 3D Chrome Hexagonal S Logo */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-800 to-black p-0.5 shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="url(#chromeGradL)" stroke="none" />
              <path d="M9 10a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3" stroke="#FFFFFF" strokeWidth="2" />
              <defs>
                <linearGradient id="chromeGradL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3F3F46" />
                  <stop offset="50%" stopColor="#18181B" />
                  <stop offset="100%" stopColor="#09090B" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-xl text-slate-900">SEENIL</span>
              <span className="text-[10px] font-semibold text-slate-600 bg-white/70 border border-white/80 px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                AIOps Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">See. Secure. Stay Ahead.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 vision-pill px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>TEAM 64 · CICADA 2026</span>
        </div>
      </header>

      {/* Center Selection Grid */}
      <main className="z-10 max-w-5xl mx-auto w-full py-10 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 vision-pill px-4 py-1.5 text-xs font-semibold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Cryptographic Trust Boundary Separation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900">
            Select Operational Portal
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto font-normal">
            Directly test the isolation perimeter between customer on-premise data collection and central SaaS AIOps intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* TIER 1: AGENT CONSOLE (Dark Slate Glass Card) */}
          <Link
            href="/agent/login"
            className="group vision-card-dark p-8 flex flex-col justify-between space-y-8 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-[11px] font-bold tracking-wider uppercase">
                  TIER 1 · LOCAL ENCLAVE
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  SEENIL Agent Console
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">Customer Host &amp; Edge Vault • localhost:8765</p>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                Inspect local SQLite vault with unredacted raw machine logs, real-time regex/entropy redaction pipeline, and live interactive chaos injection controls.
              </p>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-zinc-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local Vault (Raw logs never leave machine)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time Egress Packet Strip &amp; Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chaos Simulator (Kill connection &amp; inject secrets)</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg">
              <span>Enter as Local Agent</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* TIER 2: CLOUD SAAS (Frosted White Glass Card) */}
          <Link
            href="/cloud/login"
            className="group vision-card-white p-8 flex flex-col justify-between space-y-8 cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <span className="px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wider uppercase shadow-sm">
                  TIER 2 · CENTRAL SAAS
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  SEENIL Cloud SaaS
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Multi-Tenant AIOps Platform • Port 8000</p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Analyze multi-tenant telemetry fleet, Median Absolute Deviation (MAD) dynamic anomaly baselines, automated incident correlation, and live reliability SLAs.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fleet Overview &amp; Multi-Tenant Selector</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>MAD Anomaly Detection &amp; Multi-Signal Correlator</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SLA Reliability Metrics &amp; Live WebSocket Stream</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3.5 px-6 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg">
              <span>Enter as Cloud SaaS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-200/80 text-xs text-slate-500 font-medium flex items-center justify-between">
        <span>SEENIL © 2026 Team CTRL404</span>
        <div className="flex items-center gap-4">
          <Link href="/proof" className="hover:text-slate-900 transition underline underline-offset-4">
            Cryptographic Egress Proof
          </Link>
          <Link href="/scenarios" className="hover:text-slate-900 transition underline underline-offset-4">
            Chaos Scenarios
          </Link>
        </div>
      </footer>
    </div>
  );
}
