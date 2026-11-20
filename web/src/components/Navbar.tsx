"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Activity, Lock, Gauge, LogOut, Radio } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("seenil_token");
      localStorage.removeItem("seenil_tenant_id");
      localStorage.removeItem("seenil_tenant_name");
      router.push("/");
    }
  };

  const tenantName = (typeof window !== "undefined" && localStorage.getItem("seenil_tenant_name")) || "Alpha Retail Corp";
  const tenantId = (typeof window !== "undefined" && localStorage.getItem("seenil_tenant_id")) || "tenant_alpha";

  const navLinks = [
    { href: "/fleet", label: "Fleet Overview", icon: Activity },
    { href: "/egress-proof", label: "Egress Proof Panel", icon: Lock },
    { href: "/reliability", label: "Reliability & SLAs", icon: Gauge },
  ];

  return (
    <header className="border-b border-[#1E2C44] bg-[#0D1420]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/fleet" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-white">SEENIL</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-cyan-400 font-mono uppercase tracking-widest border border-cyan-800/60 bg-cyan-950/40 px-1.5 py-0.5 rounded">
                Zero-Leak AIOps
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-[#1E2C44] text-cyan-400 border border-cyan-800/50"
                      : "text-slate-300 hover:text-white hover:bg-[#131C2E]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status + logout */}
        <div className="flex items-center gap-4">
          {/* Live stream badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-xs font-mono">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Telemetry Stream Active</span>
          </div>

          {/* Tenant Pill */}
          <div className="text-right">
            <div className="text-xs font-medium text-white">{tenantName}</div>
            <div className="text-[10px] text-slate-400 font-mono">{tenantId}</div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#131C2E] rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
