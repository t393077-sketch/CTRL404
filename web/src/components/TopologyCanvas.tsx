"use client";

import React, { useState } from "react";
import { ShieldCheck, Server, Lock, Cpu, Activity, Zap, CheckCircle2 } from "lucide-react";

export function TopologyCanvas() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes = [
    {
      id: "agent",
      title: "Tier 1 Edge Agent",
      subtitle: "Customer Environment",
      type: "Collector",
      status: "ONLINE",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      icon: Server,
      details: "psutil CPU/RAM/Disk, socket RTT probe, log auth tailer.",
      x: "10%",
      y: "50%",
    },
    {
      id: "redactor",
      title: "Zero-Trust Redactor",
      subtitle: "Local Sanitizer",
      type: "Security Engine",
      status: "100% LEAK-FREE",
      statusColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      icon: Lock,
      details: "Regex + Shannon Entropy (>3.8 bits) scrubs passwords, tokens & emails.",
      x: "32%",
      y: "50%",
    },
    {
      id: "boundary",
      title: "Trust Boundary",
      subtitle: "Cryptographic Gate",
      type: "Demarcation Wall",
      status: "HMAC SIGNED",
      statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      icon: ShieldCheck,
      details: "Rejects any non-allow-listed field. Only 11 metadata fields allowed.",
      x: "54%",
      y: "50%",
    },
    {
      id: "cloud",
      title: "Tier 2 SaaS Ingestion",
      subtitle: "SEENIL Cloud Multi-Tenant",
      type: "Metadata Router",
      status: "SUB-10S SLA",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      icon: Zap,
      details: "18.4ms p95 latency. Idempotent UUID deduplication & RLS isolation.",
      x: "75%",
      y: "50%",
    },
    {
      id: "aiops",
      title: "AIOps War Room",
      subtitle: "Autonomous Ops",
      type: "MAD Baseline Engine",
      status: "ACTIVE",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      icon: Activity,
      details: "Rolling MAD baselines, multi-signal incident clustering & 1-click remediation.",
      x: "93%",
      y: "50%",
    },
  ];

  return (
    <div className="relative w-full bg-slate-950/60 rounded-2xl border border-white/[0.08] p-5 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Background glow & subtle radar rings */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
              TWO-TIER ZERO-LEAK ARCHITECTURAL TOPOLOGY MESH
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              LIVE DATA FLOW
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Raw logs and secrets are trapped in Tier 1; only allow-listed metadata traverses the trust boundary.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tier 1: Customer VPC</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Tier 2: SaaS Platform</span>
          </span>
        </div>
      </div>

      {/* Node Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isSelected = activeNode === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(isSelected ? null : node.id)}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative group ${
                isSelected
                  ? "bg-slate-900/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.02]"
                  : "bg-slate-900/40 border-white/[0.08] hover:border-cyan-500/40 hover:bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${node.statusColor}`}>
                  {node.status}
                </span>
              </div>

              <div className="text-xs font-bold text-white tracking-wide">
                {node.title}
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono">
                {node.subtitle}
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-slate-400 leading-snug">
                {node.details}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
