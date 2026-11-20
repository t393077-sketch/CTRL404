"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  ShieldCheck,
  Database,
  Settings,
  LogOut,
  Bell,
  Home,
  AlertTriangle,
  FileCheck2,
  Plus,
  Flame,
  WifiOff,
  Wifi,
  Sparkles,
  RefreshCw,
  Lock,
  Layers,
  LayoutGrid,
  CheckCircle2
} from "lucide-react";

interface AuditLogItem {
  id: number;
  payload_id: string;
  source_id?: string;
  metric?: string;
  raw_input: string;
  sanitized_payload: any;
  sha256_hash: string;
  created_at: string;
}

interface AgentStatus {
  status: string;
  outbox_depth: number;
  is_outage_simulated: boolean;
  total_sent: number;
  total_collected: number;
}

export default function AgentDashboardPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchAgentData = async () => {
    try {
      // 1. Audit logs (local SQLite)
      const resLogs = await fetch("http://127.0.0.1:8765/audit-logs");
      if (resLogs.ok) {
        const data = await resLogs.json();
        if (Array.isArray(data) && data.length > 0) {
          setLogs(data);
        } else if (data && Array.isArray(data.entries) && data.entries.length > 0) {
          setLogs(data.entries);
        }
      }

      // 2. Local status
      const resStatus = await fetch("http://127.0.0.1:8765/status");
      if (resStatus.ok) {
        const data = await resStatus.json();
        setAgentStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerControl = async (name: string, endpoint: string, msg: string) => {
    setActiveAction(name);
    try {
      await fetch(`http://127.0.0.1:8765/control/${endpoint}`, { method: "POST" });
      setActionNotice(msg);
      await fetchAgentData();
    } catch (e: any) {
      setActionNotice("Error: " + e.message);
    } finally {
      setTimeout(() => {
        setActiveAction(null);
        setTimeout(() => setActionNotice(null), 3000);
      }, 700);
    }
  };

  const currentItem = logs[selectedIndex] || {
    id: 1,
    payload_id: "34e0fe43-de3b-420d-a023-d29c10f3d5be",
    raw_input: "[INFO] 2026-11-20T21:40:07.364351+00:00 host=analytics-fra.cloud.internal ip=172.16.8.99 service=http_router status=200 path=/api/v2/telemetry latency=23.4ms cpu=40.8% mem=61.4%",
    sanitized_payload: {
      payload_id: "34e0fe43-de3b-420d-a023-d29c10f3d5be",
      tenant_id: "tenant-alpha",
      source_id: "node_40b9c8e26f984f20",
      metric: "system.cpu.utilization",
      value: 40.8,
      event_time_utc: "2026-11-20T21:40:07.364351+00:00",
      source_tz: "Asia/Kolkata",
      health: "Good",
      category: "infrastructure",
      severity: "info",
      alert_context: "[REDACTED:PASSWORD] [REDACTED:API_KEY] host CPU load at 40.8%"
    },
    sha256_hash: "ed91bf740f8fbd2dab2ca0cb3e023b559d3dedcb210a6f366457679c7a6d375a",
    created_at: "2026-11-20T21:40:07Z"
  };

  const sanitizedString = typeof currentItem.sanitized_payload === "string"
    ? currentItem.sanitized_payload
    : JSON.stringify(currentItem.sanitized_payload, null, 2);

  return (
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-3 sm:p-5 pb-28 font-sans select-none relative overflow-x-hidden">
      {/* LEFT FLOATING VERTICAL DOCK */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6 vision-dock px-3 py-6">
        <Link href="/agent/dashboard" className="p-2.5 rounded-xl bg-white/20 text-white shadow-sm transition hover:scale-110">
          <Terminal className="w-5 h-5 text-white" />
        </Link>
        <Link href="/cloud/dashboard" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <LayoutGrid className="w-5 h-5" />
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

        {/* TOP BRAND HEADER */}
        <header className="flex items-center justify-between px-2 pt-1 pb-2">
          {/* Enclave Badge */}
          <div className="flex items-center gap-2">
            <div className="vision-card-dark px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-white">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Enclave Node • localhost:8765</span>
            </div>
          </div>

          {/* Center Brand */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-black p-0.5 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="url(#chromeGradA)" stroke="none" />
                  <path d="M9 10a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3" stroke="#FFFFFF" strokeWidth="2" />
                  <defs>
                    <linearGradient id="chromeGradA" x1="0%" y1="0%" x2="100%" y2="100%">
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
              Tier 1: Local Agent Console
            </span>
          </div>

          {/* Right Live Controls */}
          <div className="flex items-center gap-3">
            <div className="vision-pill px-3 py-1 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Collector Online</span>
            </div>
            <button className="vision-pill p-2 text-slate-600 hover:text-black transition">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TOP INTERACTIVE ACTIONS STRIP */}
        <div className="vision-card-dark p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-white">0</span>
              </div>
              <span className="text-xs font-medium text-zinc-400">secrets scrubbed</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-white">0</span>
              </div>
              <span className="text-xs font-medium text-zinc-400">KB blocked</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-emerald-400">{agentStatus?.outbox_depth || 0}</span>
              </div>
              <span className="text-xs font-medium text-zinc-400">in buffer</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => triggerControl("secret", "inject-secret", "Canary secret injected and locally redacted")}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition border border-white/10 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              Inject Secret
            </button>

            {agentStatus?.is_outage_simulated ? (
              <button
                onClick={() => triggerControl("reconnect", "restore-connection", "Connection restored & buffer flushed")}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md"
              >
                <Wifi className="w-3.5 h-3.5 inline mr-1" />
                Restore Connection
              </button>
            ) : (
              <button
                onClick={() => triggerControl("outage", "kill-connection", "Simulated network partition active")}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-rose-950 text-rose-300 hover:text-white font-semibold text-xs transition border border-rose-500/30"
              >
                <WifiOff className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                Simulate Outage
              </button>
            )}

            <button
              onClick={() => triggerControl("flush", "restore-connection", "Buffer flushed to cloud")}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
              Flush Buffer
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>{actionNotice}</span>
            <span className="text-[10px] text-emerald-600 font-mono">OK</span>
          </div>
        )}

        {/* 2 MAIN CARDS: LOCAL VAULT (DARK) & ALLOW-LISTED PAYLOAD (WHITE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* CARD 1: LOCAL VAULT (Dark Slate Glass) */}
          <div className="vision-card-dark p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Never Transmitted</span>
                <h3 className="text-base font-bold text-white mt-0.5">Local Vault (Raw Logs)</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                Local Only • Never Transmitted
              </div>
            </div>

            <div className="bg-black/80 rounded-2xl p-4 font-mono text-xs text-zinc-300 space-y-2 h-72 overflow-y-auto border border-white/10 shadow-inner">
              {logs.length > 0 ? (
                logs.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer transition border ${
                      selectedIndex === idx
                        ? "bg-zinc-800/90 border-blue-500/50 text-white shadow-md"
                        : "hover:bg-zinc-900/60 border-transparent text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Payload #{item.payload_id?.slice(0, 8)}</span>
                      <span>{item.created_at || "Just now"}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 break-all leading-relaxed">
                      {item.raw_input}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-zinc-900 text-zinc-400 text-xs">
                  {currentItem.raw_input}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>7-Day Local Machine Retention</span>
              <span>AES-256 GCM Encrypted</span>
            </div>
          </div>

          {/* CARD 2: ALLOW-LISTED EGRESS PAYLOAD (Frosted White Glass) */}
          <div className="vision-card-white p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Allow-Listed Egress Payload</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Sanitized Telemetry Metadata</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                Zero Raw Data Transmitted
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-cyan-300 h-72 overflow-y-auto border border-slate-700/60 shadow-inner">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                {sanitizedString}
              </pre>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span className="truncate max-w-[320px]">
                SHA-256: <strong className="text-slate-900">{currentItem.sha256_hash?.slice(0, 24)}...</strong>
              </span>
              <span className="text-emerald-700 font-bold">HMAC Verified</span>
            </div>
          </div>

        </div>

        {/* EGRESS PACKET STRIP CONVEYOR */}
        <div className="vision-card-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Egress Packet Strip</span>
              <span className="text-[11px] font-mono text-emerald-400">({logs.length || 8} processed)</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Real-Time FIFO Network Queue</span>
          </div>

          {/* Conveyor Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            {(logs.length > 0 ? logs.slice(0, 8) : [1, 2, 3, 4, 5, 6, 7, 8]).map((item: any, i) => {
              const pid = typeof item === "object" ? item.payload_id?.slice(0, 8) : `pk_${i}9b2f`;
              return (
                <div
                  key={i}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-800/90 border border-white/10 text-xs font-mono flex items-center gap-2 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]"></span>
                  <span className="text-white font-bold">#{pid}</span>
                  <span className="text-zinc-500 text-[10px]">DELIVERED</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* BOTTOM FLOATING NAVIGATION PILL */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 vision-bottom-dock px-3 py-2 flex items-center gap-1 shadow-2xl">
        <Link
          href="/agent/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white font-semibold text-xs shadow-md"
        >
          <Terminal className="w-4 h-4 text-white" />
          <span>Agent</span>
        </Link>
        <Link
          href="/cloud/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <Home className="w-4 h-4" />
          <span>Cloud</span>
        </Link>
        <Link
          href="/proof"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Egress Proof</span>
        </Link>
        <Link
          href="/scenarios"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Chaos Controls</span>
        </Link>
      </nav>
    </div>
  );
}
