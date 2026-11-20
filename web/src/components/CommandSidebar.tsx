"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Gauge,
  Sliders,
  LogOut,
  Radio,
  Server
} from "lucide-react";

interface CommandSidebarProps {
  incidentCount?: number;
}

export function CommandSidebar({ incidentCount = 1 }: CommandSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Fleet Overview",
      href: "/fleet",
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: "Incidents",
      href: "/incidents",
      icon: ShieldAlert,
      badge: incidentCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EF4444] text-white">
          {incidentCount}
        </span>
      ) : null
    },
    {
      name: "Egress Proof",
      href: "/egress-proof",
      icon: Lock,
      badge: (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          0-LEAK
        </span>
      )
    },
    {
      name: "Reliability",
      href: "/reliability",
      icon: Gauge,
      badge: (
        <span className="text-[10px] font-mono text-cyan-300">
          p95&le;10s
        </span>
      )
    },
    {
      name: "Demo Controls",
      href: "/demo-controls",
      icon: Sliders,
      badge: (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          LIVE
        </span>
      )
    }
  ];

  return (
    <aside className="w-[264px] shrink-0 bg-[#0A1A3F] text-slate-200 flex flex-col justify-between select-none border-r border-[#1B3A6B]/50 min-h-screen">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1B3A6B]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1D4A8A] to-[#06B6D4] flex items-center justify-center text-white font-bold shadow-md shadow-[#5EE6F0]/20 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider font-mono text-white flex items-center gap-1.5">
                <span>SEENIL</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5EE6F0]/20 text-[#5EE6F0] border border-[#5EE6F0]/30 font-mono font-bold">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans tracking-tight">
                Observability Without Exposure
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section (Pill-shaped active items) */}
        <div className="px-4 py-5 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-[#5EE6F0] font-bold">
            OBSERVABILITY SUITE
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1D4A8A] text-white font-semibold shadow-md shadow-[#1D4A8A]/50 ring-1 ring-[#5EE6F0]/30"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#5EE6F0]" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge}
              </Link>
            );
          })}
        </div>

        {/* Overlapping Collectors Stack Widget (Mirrors reference style) */}
        <div className="px-4 py-2">
          <div className="p-4 rounded-[20px] bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                TELEMETRY MESH
              </span>
              <span className="text-[9px] font-mono text-[#10B981] font-bold">
                3 NODES
              </span>
            </div>

            {/* Overlapping circular avatar / status dot stack */}
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0A1A3F] bg-[#1D4A8A] text-white flex items-center justify-center text-[10px] font-bold">
                  N1
                </div>
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0A1A3F] bg-[#06B6D4] text-white flex items-center justify-center text-[10px] font-bold">
                  N2
                </div>
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0A1A3F] bg-[#10B981] text-white flex items-center justify-center text-[10px] font-bold">
                  N3
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">100%</div>
                <div className="text-[9px] text-slate-400">Zero Leak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-[11px] font-mono text-slate-400 border-t border-[#1B3A6B]/40 flex items-center justify-between bg-[#081533]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-slate-300">Engine Active</span>
        </div>
        <Link
          href="/login"
          title="Sign Out"
          className="text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
        >
          <LogOut className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
