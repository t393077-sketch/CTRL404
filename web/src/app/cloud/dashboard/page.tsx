"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  BarChart3,
  ShieldCheck,
  Database,
  Settings,
  LogOut,
  Bell,
  Home,
  AlertTriangle,
  FileCheck2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

interface ReliabilityStats {
  tenant_id: string;
  total_events: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  total_duplicates_blocked: number;
  sla_compliant_pct: number;
}

export default function CloudDashboardPage() {
  const [selectedTenant, setSelectedTenant] = useState<"Alpha Financial Corp" | "Beta Cloud Systems">(
    "Alpha Financial Corp"
  );
  const [reliability, setReliability] = useState<ReliabilityStats | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [activeDate, setActiveDate] = useState(21);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toUTCString().replace("GMT", "GMT")
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCloudData = async () => {
    try {
      const resRel = await fetch("http://127.0.0.1:8000/api/v1/reliability/stats", {
        headers: { Authorization: "Bearer seenil_tenant_a_tok" }
      });
      if (resRel.ok) {
        const data = await resRel.json();
        setReliability(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 3000);
    return () => clearInterval(interval);
  }, []);

  const trendsData = [
    { time: "12:00", value: 32 },
    { time: "12:05", value: 68 },
    { time: "12:10", value: 45 },
    { time: "12:15", value: 88 },
    { time: "12:20", value: 54 }
  ];

  const resourceData = [
    { time: "30%", value: 20 },
    { time: "40%", value: 65 },
    { time: "50%", value: 40 },
    { time: "60%", value: 78 },
    { time: "70%", value: 50 },
    { time: "80%", value: 95 }
  ];

  return (
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-3 sm:p-5 pb-28 font-sans select-none relative overflow-x-hidden">
      {/* LEFT FLOATING VERTICAL DOCK (Exact to Reference) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6 vision-dock px-3 py-6">
        <Link href="/cloud/dashboard" className="p-2.5 rounded-xl bg-white/20 text-white shadow-sm transition hover:scale-110">
          <LayoutGrid className="w-5 h-5" />
        </Link>
        <Link href="/cloud/dashboard" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <Activity className="w-5 h-5" />
        </Link>
        <Link href="/proof" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <ShieldCheck className="w-5 h-5" />
        </Link>
        <Link href="/scenarios" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <Database className="w-5 h-5" />
        </Link>
        <button className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <Settings className="w-5 h-5" />
        </button>
        <Link href="/" className="mt-4 p-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/10 transition hover:scale-110">
          <LogOut className="w-5 h-5" />
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1520px] mx-auto w-full space-y-4 md:pl-16 z-10">
        
        {/* TOP BRAND HEADER (Exact to Reference) */}
        <header className="flex items-center justify-between px-2 pt-1 pb-2">
          {/* Tenant Switcher Pill */}
          <div className="flex items-center gap-2">
            <div className="vision-card-white px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value as any)}
                className="bg-transparent text-[#0F172A] font-medium outline-none cursor-pointer text-xs"
              >
                <option value="Alpha Financial Corp">Alpha Financial Corp</option>
                <option value="Beta Cloud Systems">Beta Cloud Systems</option>
              </select>
            </div>
          </div>

          {/* Center Brand */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              {/* 3D Chrome Hexagonal S Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-black p-0.5 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="url(#chromeGrad)" stroke="none" />
                  <path d="M9 10a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3" stroke="#FFFFFF" strokeWidth="2" />
                  <defs>
                    <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3F3F46" />
                      <stop offset="50%" stopColor="#18181B" />
                      <stop offset="100%" stopColor="#09090B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0F172A]">SEENIL</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 tracking-wider mt-0.5">
              See. Secure. Stay Ahead.
            </span>
          </div>

          {/* Right Status & Profile */}
          <div className="flex items-center gap-3">
            {/* Live Indicator Pill */}
            <div className="vision-pill px-3 py-1 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </div>

            {/* Notification Bell */}
            <button className="vision-pill p-2 text-slate-600 hover:text-black transition">
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/80 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Lead Operator"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* 9-CARD MASTER GRID (Exact Match to Design System Reference) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* ROW 1: CARD 1 — SYSTEM HEALTH (Dark Slate Glass) */}
          <div className="md:col-span-3 vision-card-dark p-5 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Overall Status</span>
              <h3 className="text-base font-bold text-white mt-0.5">System Health</h3>
            </div>

            {/* 3D Chrome Metallic Knot Orb */}
            <div className="my-4 flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-600/40 via-white/20 to-transparent blur-md"></div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-zinc-800 p-0.5 shadow-2xl flex items-center justify-center relative">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-zinc-900 via-slate-800 to-zinc-900 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-200 drop-shadow-md animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="12" cy="12" r="9" stroke="url(#chromeRing)" strokeWidth="2.5" />
                      <path d="M12 3a9 9 0 0 0 0 18v-9a4 4 0 0 1 4-4h5" stroke="#FFFFFF" strokeWidth="2" />
                      <defs>
                        <linearGradient id="chromeRing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="50%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#1E293B" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Healthy Green Pill */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-xs font-semibold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Healthy
              </div>
            </div>
          </div>

          {/* ROW 1: CARD 2 — REAL-TIME OVERVIEW (Frosted White Glass) */}
          <div className="md:col-span-3 vision-card-white p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Live telemetry from your collectors</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Real-time Overview</h3>
            </div>

            <div className="flex items-end justify-between my-2">
              <div>
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight block">16</span>
                <span className="text-xs text-slate-500 font-medium">Active Collectors</span>
                <span className="text-[11px] font-bold text-emerald-600 block mt-1">↑ +2%</span>
              </div>

              {/* 4 Vertical Frosted Glowing Tubes */}
              <div className="flex items-end gap-3 pb-1">
                {/* CPU Tube */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-20 rounded-full bg-slate-200/80 p-0.5 flex flex-col justify-end shadow-inner">
                    <div className="w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: "24%" }}></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">CPU</span>
                  <span className="text-[10px] font-bold text-slate-900">24%</span>
                </div>

                {/* Mem Tube */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-20 rounded-full bg-slate-200/80 p-0.5 flex flex-col justify-end shadow-inner">
                    <div className="w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: "46%" }}></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Mem</span>
                  <span className="text-[10px] font-bold text-slate-900">46%</span>
                </div>

                {/* Disk Tube */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-20 rounded-full bg-slate-200/80 p-0.5 flex flex-col justify-end shadow-inner">
                    <div className="w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: "32%" }}></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Disk</span>
                  <span className="text-[10px] font-bold text-slate-900">32%</span>
                </div>

                {/* Net Tube */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-20 rounded-full bg-slate-200/80 p-0.5 flex flex-col justify-end shadow-inner">
                    <div className="w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: "12%" }}></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">Net</span>
                  <span className="text-[10px] font-bold text-slate-900">12%</span>
                </div>
              </div>
            </div>

            <div className="h-2"></div>
          </div>

          {/* ROW 1: CARD 3 — HEALTH DISTRIBUTION (Frosted White Glass) */}
          <div className="md:col-span-3 vision-card-white p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">4-State Overview</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Health Distribution</h3>
            </div>

            <div className="flex items-center justify-between my-2">
              {/* Circular Donut Gauge */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Excellent: 90% */}
                  <path
                    className="text-emerald-500"
                    strokeDasharray="90, 100"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-slate-900">90%</span>
                </div>
              </div>

              {/* 4-State Legend */}
              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Excellent</span>
                  <span className="font-bold text-slate-900 ml-auto">90%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">Good</span>
                  <span className="font-bold text-slate-900 ml-auto">6%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">Fair</span>
                  <span className="font-bold text-slate-900 ml-auto">3%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-600">Poor</span>
                  <span className="font-bold text-slate-900 ml-auto">1%</span>
                </div>
              </div>
            </div>

            <div className="h-2"></div>
          </div>

          {/* ROW 1: CARD 4 — AGENT STATUS (Frosted White Glass) */}
          <div className="md:col-span-3 vision-card-white p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Collector Network</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Agent Status</h3>
            </div>

            {/* 3 Interconnected Dark Circular Badges */}
            <div className="my-auto py-3 flex items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex flex-col items-center justify-center shadow-lg border border-white/10">
                <span className="text-sm font-black">1065</span>
                <span className="text-[9px] uppercase font-semibold text-zinc-400">Total</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex flex-col items-center justify-center shadow-lg border border-white/10">
                <span className="text-lg font-black">∞</span >
                <span className="text-[9px] uppercase font-semibold text-zinc-400">Running</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex flex-col items-center justify-center shadow-lg border border-white/10">
                <span className="text-sm font-black text-rose-400">7</span>
                <span className="text-[9px] uppercase font-semibold text-zinc-400">Offline</span>
              </div>
            </div>

            <div className="text-[11px] text-center text-slate-500 font-medium">
              3s Watchdog Pulse Active
            </div>
          </div>

          {/* ROW 2: CARD 5 — RECENT TRENDS (Dark Slate Glass) */}
          <div className="md:col-span-3 vision-card-dark p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Performance over time</span>
              <h3 className="text-base font-bold text-white mt-0.5">Recent Trends</h3>
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <XAxis dataKey="time" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} ticks={[25, 50, 75, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(24, 24, 27, 0.9)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "11px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ fill: "#38BDF8", r: 3 }}
                    activeDot={{ r: 5, fill: "#FFFFFF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROW 2: CARD 6 — EVENT TIMELINE & CALENDAR (Frosted White Glass) */}
          <div className="md:col-span-6 vision-card-white p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-base font-bold text-slate-900">May 2025</h3>
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Date Pill Selector */}
            <div className="grid grid-cols-7 gap-2 my-3 text-center">
              {[
                { day: "Sun", date: 18 },
                { day: "Mon", date: 19 },
                { day: "Tue", date: 20 },
                { day: "Wed", date: 21 },
                { day: "Thu", date: 22 },
                { day: "Fri", date: 23 },
                { day: "Sat", date: 24 }
              ].map((item) => (
                <div
                  key={item.date}
                  onClick={() => setActiveDate(item.date)}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <span className="text-[11px] font-medium text-slate-500">{item.day}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      activeDate === item.date
                        ? "bg-zinc-900 text-white shadow-md scale-105"
                        : "text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    {item.date}
                  </div>
                </div>
              ))}
            </div>

            {/* Events List */}
            <div className="space-y-2 mt-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-semibold text-slate-800">Anomaly Detected – High CPU</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">12:00 PM</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Collector Back Online</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">01:15 PM</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-slate-800">Policy Update Deployed</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">03:30 PM</span>
              </div>
            </div>
          </div>

          {/* ROW 2: CARD 7 — PROJECT INSIGHTS (Dark Slate Glass) */}
          <div className="md:col-span-3 vision-card-dark p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Key Metrics</span>
              <h3 className="text-base font-bold text-white mt-0.5">Project Insights</h3>
            </div>

            <div className="space-y-3.5 my-auto py-2">
              {/* Ingest Latency */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Ingest Latency</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white">4.8ms</span>
                    <span className="text-[10px] text-emerald-400">↓ 12%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: "35%" }}></div>
                </div>
              </div>

              {/* Duplicate Count */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Duplicate Count</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white">0</span>
                    <span className="text-[10px] text-emerald-400">↓ 0%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>

              {/* Alert Count */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Alert Count</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white">3</span>
                    <span className="text-[10px] text-amber-400">↑ 50%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>

              {/* Data Loss */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Data Loss</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-emerald-400">0%</span>
                    <span className="text-[10px] text-emerald-400">↓ 0%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: CARD 8 — RESOURCE USAGE (Frosted White Glass) */}
          <div className="md:col-span-6 vision-card-white p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">System Resources</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Resource Usage</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-2">
              {/* Wave Graph */}
              <div className="md:col-span-7 h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={resourceData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#18181B" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                    <Area type="monotone" dataKey="value" stroke="#09090B" strokeWidth={2} fillOpacity={1} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 2 Circular Gauges */}
              <div className="md:col-span-5 flex items-center justify-around">
                {/* 20% Memory */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-slate-900" strokeDasharray="20, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-xs font-black text-slate-900">20%</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 mt-1">Memory</span>
                </div>

                {/* 93% Analysis */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-slate-900" strokeDasharray="93, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-xs font-black text-slate-900">93%</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 mt-1">Analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: CARD 9 — GLOBAL COVERAGE (Frosted White Glass) */}
          <div className="md:col-span-6 vision-card-white p-5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Collectors Worldwide</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Global Coverage</h3>
            </div>

            {/* Stylized Dark World Map with Glowing Beacons */}
            <div className="my-2 h-28 relative flex items-center justify-center">
              <svg className="w-full h-full text-slate-900" viewBox="0 0 600 240" fill="currentColor" opacity="0.85">
                {/* Simplified World Continent Silhouettes */}
                <path d="M 80 60 Q 120 40 160 55 Q 180 80 150 110 Q 110 130 90 90 Z" />
                <path d="M 140 130 Q 160 140 170 180 Q 150 220 130 190 Q 120 150 140 130 Z" />
                <path d="M 280 50 Q 340 40 370 70 Q 350 100 300 90 Q 270 70 280 50 Z" />
                <path d="M 290 100 Q 340 100 350 150 Q 320 200 290 180 Q 270 130 290 100 Z" />
                <path d="M 380 60 Q 480 40 520 80 Q 500 130 440 120 Q 390 90 380 60 Z" />
                <path d="M 460 140 Q 510 140 520 180 Q 480 200 450 170 Z" />
              </svg>

              {/* Glowing Blue Locators */}
              {/* North America Beacon */}
              <div className="absolute top-[35%] left-[24%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_#06B6D4]"></span>
                </span>
              </div>

              {/* Europe Beacon */}
              <div className="absolute top-[32%] left-[52%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_#06B6D4]"></span>
                </span>
              </div>

              {/* Mumbai / ap-south-1 Beacon */}
              <div className="absolute top-[48%] left-[66%]">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_10px_#10B981]"></span>
                </span>
              </div>

              {/* Tokyo / East Asia Beacon */}
              <div className="absolute top-[42%] left-[84%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_#06B6D4]"></span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
              <span>Primary Node: ap-south-1</span>
              <span className="text-emerald-700 font-bold">100% Region Online</span>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM FLOATING NAVIGATION PILL (Exact to Reference) */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 vision-bottom-dock px-3 py-2 flex items-center gap-1 shadow-2xl">
        <Link
          href="/cloud/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white font-semibold text-xs shadow-md"
        >
          <Home className="w-4 h-4 text-white" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/cloud/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </Link>
        <Link
          href="/scenarios"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Incidents</span>
        </Link>
        <Link
          href="/proof"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Egress Proof</span>
        </Link>
        <Link
          href="/agent/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <Settings className="w-4 h-4" />
          <span>Agent</span>
        </Link>
        <button
          onClick={() => alert("Quick Action Menu: Add Metric / Inject Chaos / Export Report")}
          className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition shadow-sm ml-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
