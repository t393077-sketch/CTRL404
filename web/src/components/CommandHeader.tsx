"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Globe2, LogOut, Radio, Search } from "lucide-react";

interface CommandHeaderProps {
  title?: string;
  wsConnected?: boolean;
  wsReconnecting?: boolean;
}

export function CommandHeader({
  title = "Fleet Overview",
  wsConnected = true,
  wsReconnecting = false
}: CommandHeaderProps) {
  const [tenantName, setTenantName] = useState("Alpha Retail Corp");
  const [dataRegion, setDataRegion] = useState("ap-south-1 (Mumbai)");
  const [utcClock, setUtcClock] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/tenant/info", {
      headers: {
        Authorization: "Bearer seenil_tenant_a_tok"
      }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.tenant_name) setTenantName(data.tenant_name);
          if (data.data_region) setDataRegion(data.data_region);
        }
      })
      .catch(() => {});

    const updateTime = () => {
      const now = new Date();
      setUtcClock(now.toISOString().substring(11, 19) + "Z");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-white/60 px-8 flex items-center justify-between select-none z-20">
      {/* Left: Title & Tenant Pill */}
      <div className="flex items-center gap-5">
        <h1 className="text-xl font-extrabold text-[#0F1B33] tracking-tight flex items-center gap-3">
          <span>{title}</span>
          <span className="text-xs text-[#64748B] hidden md:inline">·</span>
          <span className="text-xs font-mono font-semibold text-[#1D4A8A] bg-[#1D4A8A]/10 px-4 py-1.5 rounded-full hidden md:inline border border-[#1D4A8A]/20 shadow-sm">
            {tenantName}
          </span>
        </h1>
      </div>

      {/* Middle: Airy Quick Search Pill (reference style) */}
      <div className="hidden xl:flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 border border-white/80 w-72 text-xs text-[#64748B] shadow-sm">
        <Search className="w-4 h-4 text-[#64748B]" />
        <span className="font-sans font-medium">Search telemetry metrics...</span>
      </div>

      {/* Right: Region Pill, Clock Pill, Connection Status Pill, User Avatar */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Data Region Pill */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/80 text-[11px] font-mono font-semibold text-[#64748B] shadow-sm">
          <Globe2 className="w-3.5 h-3.5 text-[#1D4A8A]" />
          <span>{dataRegion}</span>
        </div>

        {/* Live UTC Clock Pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/80 text-[11px] font-mono font-bold text-[#0F1B33] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#1D4A8A]" />
          <span>{utcClock || "UTC"}</span>
        </div>

        {/* Connection Status Pill */}
        <div className="flex items-center">
          {wsConnected ? (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-400/30 text-xs font-mono font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              LIVE
            </span>
          ) : wsReconnecting ? (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 text-[#F59E0B] border border-amber-400/30 text-xs font-mono font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
              RECONNECTING
            </span>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 text-[#EF4444] border border-rose-400/30 text-xs font-mono font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              OFFLINE
            </span>
          )}
        </div>

        {/* User Avatar + Sign Out */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#EDF1F7]">
          <div className="w-9 h-9 rounded-full bg-[#0A1A3F] text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-[#1D4A8A]/20">
            SR
          </div>
          <Link
            href="/login"
            className="text-xs text-[#64748B] hover:text-[#0F1B33] font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
