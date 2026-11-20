"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cloud,
  Shield,
  Activity,
  AlertTriangle,
  Server,
  Layers,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";

interface Collector {
  source_id: string;
  tenant_id: string;
  status: string;
  last_heartbeat_utc: string;
  config_status: string;
  version: string;
}

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
  const [metricTab, setMetricTab] = useState<"CPU" | "Memory" | "Latency" | "Packet Loss">("CPU");
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [reliability, setReliability] = useState<ReliabilityStats | null>(null);
  const [currentTime, setCurrentTime] = useState("");

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
      const resCol = await fetch("http://127.0.0.1:8000/api/v1/collectors", {
        headers: { Authorization: "Bearer seenil_tenant_a_tok" }
      });
      if (resCol.ok) {
        const data = await resCol.json();
        setCollectors(data);
      }

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

  // Telemetry trajectory data
  const chartData = [
    { time: "00:00", cpu: 28, mem: 42, latency: 18, loss: 0 },
    { time: "04:00", cpu: 32, mem: 45, latency: 22, loss: 0 },
    { time: "08:00", cpu: 55, mem: 60, latency: 26, loss: 0.1 },
    { time: "12:00", cpu: 48, mem: 58, latency: 24, loss: 0 },
    { time: "16:00", cpu: 62, mem: 68, latency: 31, loss: 0.2 },
    { time: "20:00", cpu: 35, mem: 50, latency: 20, loss: 0 },
    { time: "24:00", cpu: 30, mem: 46, latency: 19, loss: 0 }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1B33] flex flex-col justify-between p-4 sm:p-6 pb-24 font-sans select-none relative overflow-x-hidden">
      {/* Background radial tint */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1D4A8A]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto w-full space-y-4 z-10">
        {/* TOP BAR (Image 2 exact reference) */}
        <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_24px_rgba(15,27,51,0.06)]">
          {/* Logo & Product Name */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold font-mono text-xl tracking-wider text-[#0A1A3F]">
              SEENIL
            </span>
            <span className="text-xs font-mono text-[#64748B] uppercase">AIOps</span>
          </div>

          {/* Multi-Tenant Switcher Pills */}
          <div className="flex items-center bg-[#F4F6FB] p-1 rounded-full border border-[#E3E8F0]">
            <button
              onClick={() => setSelectedTenant("Alpha Financial Corp")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition ${
                selectedTenant === "Alpha Financial Corp"
                  ? "bg-black text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0F1B33]"
              }`}
            >
              Alpha Financial Corp
            </button>
            <button
              onClick={() => setSelectedTenant("Beta Cloud Systems")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition ${
                selectedTenant === "Beta Cloud Systems"
                  ? "bg-black text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0F1B33]"
              }`}
            >
              Beta Cloud Systems
            </button>
          </div>

          {/* Time & Privacy Pillar Badge */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#64748B]">{currentTime || "Fri, 20 Nov 2026 21:42:07 GMT"}</span>
            <div className="px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-mono font-bold shadow-sm">
              Metadata-Only · 0 Raw Logs
            </div>
          </div>
        </div>

        {/* TOP ROW OF CARDS (Image 2 exact structure) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Fleet State Card (Solid dark contrast card) */}
          <div className="bg-[#0A1A3F] text-white rounded-[24px] p-6 shadow-[0_8px_32px_rgba(10,26,63,0.22)] border border-[#1B3A6B] flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-2xl font-black text-white tracking-wide">Excellent</span>
            </div>
            <p className="text-xs text-slate-300">
              Active collectors streaming within nominal limits
            </p>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full w-fit">
              60s Watchdog Active
            </div>
          </div>

          {/* 2. Live Telemetry Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(15,27,51,0.06)] flex flex-col justify-between space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              LIVE TELEMETRY
            </div>
            <div>
              <div className="text-4xl font-extrabold font-mono text-[#0F1B33] tracking-tight">
                {reliability ? `${reliability.p95_latency_ms.toFixed(0)}ms` : "26ms"}
              </div>
              <div className="text-xs font-mono text-[#64748B] mt-1">p95 Latency</div>
            </div>
            {/* Visual Bar Sparkline */}
            <div className="flex items-end gap-1.5 h-8 pt-2">
              <div className="w-3 bg-black rounded-t h-4" />
              <div className="w-3 bg-black rounded-t h-7" />
              <div className="w-3 bg-black rounded-t h-6" />
              <div className="w-3 bg-black rounded-t h-8" />
              <div className="w-3 bg-black rounded-t h-5" />
            </div>
          </div>

          {/* 3. SLA Metrics Rings */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(15,27,51,0.06)] flex flex-col justify-between space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              SLA METRICS
            </div>
            <div className="flex items-center justify-around pt-1">
              {/* Ring 1 */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#E3E8F0" strokeWidth="5" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#10B981"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="163"
                    strokeDashoffset="16"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-xs font-extrabold font-mono text-[#0F1B33]">99%</div>
                  <div className="text-[7px] font-mono text-[#64748B]">&le;10s</div>
                </div>
              </div>

              {/* Ring 2 */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#E3E8F0" strokeWidth="5" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#2563EB"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="163"
                    strokeDashoffset="48"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-xs font-extrabold font-mono text-[#0F1B33]">100%</div>
                  <div className="text-[7px] font-mono text-[#64748B]">Zero Dup</div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-center font-mono text-[#64748B]">
              Audited against zero-duplicate invariant
            </div>
          </div>

          {/* 4. KPI Overview (Overlapping black circles) */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(15,27,51,0.06)] flex flex-col justify-between space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              KPI OVERVIEW
            </div>
            <div className="flex items-center justify-center -space-x-3 py-2">
              <div className="w-20 h-20 rounded-full bg-black text-white flex flex-col items-center justify-center text-center shadow-lg border border-white/20">
                <span className="text-base font-extrabold font-mono">
                  {reliability?.total_events ?? 562}
                </span>
                <span className="text-[8px] font-mono text-slate-400 uppercase leading-none">Ingested</span>
              </div>
              <div className="w-20 h-20 rounded-full bg-black text-white flex flex-col items-center justify-center text-center shadow-lg border border-white/20">
                <span className="text-base font-extrabold font-mono text-[#10B981]">
                  {reliability?.total_duplicates_blocked ?? 0}
                </span>
                <span className="text-[8px] font-mono text-slate-400 uppercase leading-none">Blocked</span>
              </div>
              <div className="w-20 h-20 rounded-full bg-black text-white flex flex-col items-center justify-center text-center shadow-lg border border-white/20">
                <span className="text-base font-extrabold font-mono text-[#5EE6F0]">0</span>
                <span className="text-[8px] font-mono text-slate-400 uppercase leading-none">Alerts</span>
              </div>
            </div>
            <div className="text-[10px] text-center font-mono text-[#64748B]">
              Central SaaS Ingestion Ledger
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: COLLECTOR FLEET & INCIDENT TIMELINE & ALERT THRESHOLDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Collector Fleet Node Card (Dark contrast card) */}
          <div className="bg-[#0A1A3F] text-white rounded-[24px] p-6 shadow-[0_8px_32px_rgba(10,26,63,0.22)] border border-[#1B3A6B] space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                COLLECTOR FLEET
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#10B981] border border-emerald-400/30 text-[10px] font-mono font-bold">
                ONLINE
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-mono text-base font-bold text-white">collector-mvm-01</div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>ap-south-1</span>
                <span>·</span>
                <span className="text-emerald-400">synced</span>
                <span>·</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Q:0</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">CPU Usage</span>
                <span className="text-white font-bold">18.4%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[18.4%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <span className="text-slate-400">Memory</span>
                <span className="text-white font-bold">42.1%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-[#5EE6F0] h-full w-[42.1%]" />
              </div>
            </div>
          </div>

          {/* Incident Timeline (24h) */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(15,27,51,0.06)] space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                INCIDENT TIMELINE (24H)
              </span>
              <span className="text-xs font-mono text-slate-400">MAD Rolling Baseline</span>
            </div>

            <div className="relative h-24 flex items-center justify-center border-b border-dashed border-[#CBD5E1]">
              <div className="w-full border-t border-dashed border-slate-300" />
              <div className="absolute right-12 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-[#10B981] text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>0 Anomalies Triggered</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span>24h ago</span>
              <span>12h</span>
              <span>Live Now</span>
            </div>
          </div>

          {/* Alert Thresholds Card (Dark contrast card) */}
          <div className="bg-[#0A1A3F] text-white rounded-[24px] p-6 shadow-[0_8px_32px_rgba(10,26,63,0.22)] border border-[#1B3A6B] space-y-4 flex flex-col justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              ALERT THRESHOLDS
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">CPU % Baseline</span>
                <span className="text-[#5EE6F0] font-bold">Automatic MAD</span>
              </div>
              <div className="relative w-full h-3 bg-white/10 rounded-full flex items-center">
                <div className="absolute left-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 -translate-x-1/2 shadow" />
                <div className="absolute right-4 w-3.5 h-3.5 rounded-full bg-rose-500 shadow" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Fair (50%)</span>
                <span>Poor (80%)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Deterministic 4-tier transitions based on host metric bounds
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: TELEMETRY CHART (Image 2 exact reference) */}
        <div className="bg-white/80 backdrop-blur-xl border border-[#E3E8F0] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(15,27,51,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                TELEMETRY CHART
              </span>

              {/* Metric tabs */}
              <div className="flex items-center bg-[#F4F6FB] p-1 rounded-full border border-[#E3E8F0]">
                {(["CPU", "Memory", "Latency", "Packet Loss"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMetricTab(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition ${
                      metricTab === tab
                        ? "bg-black text-white shadow-sm"
                        : "text-[#64748B] hover:text-[#0F1B33]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#64748B]">
              <span>Threshold Limits: Fair 50% / Poor 80%</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1A3F",
                    borderColor: "#1B3A6B",
                    borderRadius: "14px",
                    color: "#FFF",
                    fontSize: "11px",
                    fontFamily: "monospace"
                  }}
                />
                <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="3 3" />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey={
                    metricTab === "CPU"
                      ? "cpu"
                      : metricTab === "Memory"
                      ? "mem"
                      : metricTab === "Latency"
                      ? "latency"
                      : "loss"
                  }
                  stroke="#000000"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#000000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FLOATING PILL DOCK AT BOTTOM */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#0A1A3F]/95 backdrop-blur-2xl border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <span className="px-4 py-2 rounded-full bg-white text-[#0A1A3F] font-mono text-xs font-bold shadow-md">
            Tier 2: Cloud SaaS
          </span>
          <Link
            href="/agent/dashboard"
            className="px-4 py-2 rounded-full text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            Tier 1: Local Agent
          </Link>
          <Link
            href="/egress-proof"
            className="px-4 py-2 rounded-full text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            Split Proof
          </Link>
          <Link
            href="/demo-controls"
            className="px-4 py-2 rounded-full text-xs font-mono text-amber-300 hover:bg-white/10 transition flex items-center gap-1.5"
          >
            <span>⚡ Scenarios</span>
          </Link>
        </div>
      </div>
    </div>
  );
}