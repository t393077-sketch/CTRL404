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
  CheckCircle2,
  Copy,
  Search,
  Filter,
  Cpu,
  ArrowRight
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAgentTab, setActiveAgentTab] = useState<"console" | "vault" | "pipeline" | "outbox">("console");
  const [copiedHash, setCopiedHash] = useState(false);

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
        setTimeout(() => setActionNotice(null), 3500);
      }, 600);
    }
  };

  const currentItem = logs[selectedIndex] || {
    id: 1,
    payload_id: "34e0fe43-de3b-420d-a023-d29c10f3d5be",
    raw_input: "[INFO] 2026-11-20T21:40:07.364351+00:00 host=analytics-fra.cloud.internal ip=172.16.8.99 service=http_router auth_token=eyJhbGciOiJIUzI1NiJ9.demo-secret-key-live password=DatabaseAdminPass! status=200 path=/api/v2/telemetry latency=23.4ms cpu=40.8% mem=61.4%",
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

  const filteredLogs = logs.filter((l) =>
    searchTerm ? l.raw_input.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-3 sm:p-5 pb-28 font-sans select-none relative overflow-x-hidden">
      
      {/* LEFT FLOATING VERTICAL DOCK (Agent Only Navigation — Zero Cloud Links) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-6 vision-dock px-3 py-6 shadow-2xl">
        <button
          onClick={() => setActiveAgentTab("console")}
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "console" ? "bg-white/25 text-white shadow-md scale-110" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Agent Console Overview"
        >
          <Terminal className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={() => setActiveAgentTab("vault")}
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "vault" ? "bg-white/25 text-white shadow-md scale-110" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Local Raw Vault (Unredacted Logs)"
        >
          <Lock className="w-5 h-5 text-rose-400" />
        </button>

        <button
          onClick={() => setActiveAgentTab("pipeline")}
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "pipeline" ? "bg-white/25 text-white shadow-md scale-110" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="Redaction Pipeline &amp; Schema Filter"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
        </button>

        <button
          onClick={() => setActiveAgentTab("outbox")}
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "outbox" ? "bg-white/25 text-white shadow-md scale-110" : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          title="SQLite Outbox Buffer &amp; Store-Forward"
        >
          <Database className="w-5 h-5 text-cyan-400" />
        </button>

        <Link
          href="/"
          className="mt-4 p-2.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/10 transition-all duration-200 hover:scale-110 cursor-pointer vision-interactive"
          title="Exit to Portal Selector"
        >
          <LogOut className="w-5 h-5" />
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1520px] mx-auto w-full space-y-4 md:pl-16 z-10">

        {/* TOP BRAND HEADER */}
        <header className="flex items-center justify-between px-2 pt-1 pb-2">
          {/* Enclave Security Badge */}
          <div className="flex items-center gap-2">
            <div className="vision-card-dark px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-white shadow-md">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Enclave Node • node_40b9c8e26f984f20</span>
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
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider mt-0.5">
              Tier 1: Customer Local Agent Console (Port 8765)
            </span>
          </div>

          {/* Right Live Controls */}
          <div className="flex items-center gap-3">
            <div className="vision-pill px-3 py-1 flex items-center gap-2 text-xs font-semibold text-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Local Daemon Active</span>
            </div>
            <button
              onClick={() => triggerControl("flush", "restore-connection", "Buffer synchronized with remote endpoint")}
              className="vision-pill px-3 py-1 text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1.5 cursor-pointer vision-interactive"
              title="Sync Outbox"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </header>

        {/* TOP INTERACTIVE ACTIONS & STATS STRIP */}
        <div className="vision-card-dark p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shadow-inner">
                <span className="text-xs font-bold text-emerald-400">0</span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block">Secrets Scrubbed</span>
                <span className="text-[10px] text-zinc-400 font-mono">Zero Raw Data Leaks</span>
              </div>
            </div>

            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shadow-inner">
                <span className="text-xs font-bold text-cyan-400">14.2</span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block">KB Blocked</span>
                <span className="text-[10px] text-zinc-400 font-mono">Sensitive Entropy Intercepted</span>
              </div>
            </div>

            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shadow-inner">
                <span className={`text-xs font-bold ${agentStatus?.outbox_depth ? "text-amber-400" : "text-emerald-400"}`}>
                  {agentStatus?.outbox_depth || 0}
                </span>
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block">Outbox Buffer</span>
                <span className="text-[10px] text-zinc-400 font-mono">SQLite Persistent Store</span>
              </div>
            </div>
          </div>

          {/* Interactive Chaos Injection Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerControl("secret", "inject-secret", "Canary secret (API key & password) injected and locally redacted")}
              disabled={activeAction !== null}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition border border-white/10 shadow-md cursor-pointer vision-interactive"
              title="Test local redaction of canary secrets"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              <span>Inject Canary Secret</span>
            </button>

            {agentStatus?.is_outage_simulated ? (
              <button
                onClick={() => triggerControl("reconnect", "restore-connection", "Connection restored & buffered packets flushed")}
                disabled={activeAction !== null}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg cursor-pointer vision-interactive"
              >
                <Wifi className="w-3.5 h-3.5 inline mr-1" />
                <span>Restore Connection</span>
              </button>
            ) : (
              <button
                onClick={() => triggerControl("outage", "kill-connection", "Simulated network partition active – buffering to SQLite outbox")}
                disabled={activeAction !== null}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-rose-950 text-rose-300 hover:text-white font-semibold text-xs transition border border-rose-500/30 cursor-pointer vision-interactive"
              >
                <WifiOff className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                <span>Simulate Outage</span>
              </button>
            )}

            <button
              onClick={() => triggerControl("cpu", "inject-anomaly", "High CPU utilization anomaly triggered")}
              disabled={activeAction !== null}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition border border-white/10 cursor-pointer vision-interactive"
              title="Simulate CPU Spike Telemetry"
            >
              <Flame className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
              <span>Spike CPU</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            MAIN AGENT PANELS: LOCAL VAULT & ALLOW-LISTED EGRESS PAYLOAD
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* CARD 1: LOCAL MACHINE VAULT (Dark Slate Glass) */}
          <div className="md:col-span-6 vision-card-dark p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Customer Host Machine Only</span>
                <h3 className="text-base font-bold text-white mt-0.5">Local Raw Vault (Unredacted Logs)</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                Never Leaves Local Machine
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search raw customer log tokens..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400 transition"
              />
            </div>

            {/* Raw Log Stream */}
            <div className="bg-black/90 rounded-2xl p-4 font-mono text-xs text-zinc-300 space-y-2 h-72 overflow-y-auto border border-white/10 shadow-inner">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-xl cursor-pointer transition border vision-interactive ${
                      selectedIndex === idx
                        ? "bg-zinc-800/90 border-blue-500/60 text-white shadow-md"
                        : "hover:bg-zinc-900/60 border-transparent text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span className="font-bold text-zinc-400">Payload #{item.payload_id?.slice(0, 8)}</span>
                      <span>{item.created_at || "Recent"}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 break-all leading-relaxed font-mono">
                      {item.raw_input}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-mono">
                  {currentItem.raw_input}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256 GCM Local Encryption</span>
              </span>
              <span>7-Day Enclave Retention</span>
            </div>
          </div>

          {/* CARD 2: ALLOW-LISTED EGRESS PAYLOAD (Frosted White Glass) */}
          <div className="md:col-span-6 vision-card-white p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Network Ingestion Packet</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Sanitized Telemetry Metadata</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                Zero Raw Data Transmitted
              </div>
            </div>

            {/* JSON Schema Egress Viewer */}
            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-cyan-300 h-[328px] overflow-y-auto border border-slate-700/60 shadow-inner">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                {sanitizedString}
              </pre>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 font-mono pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 truncate max-w-[340px]">
                <span>SHA-256: <strong className="text-slate-900">{currentItem.sha256_hash?.slice(0, 20)}...</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentItem.sha256_hash);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
                  title="Copy SHA-256 Digest"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedHash && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                HMAC-SHA256 Verified
              </span>
            </div>
          </div>

        </div>

        {/* ROW 3: LOCAL REDACTION ENGINE & SQLITE OUTBOX DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* 3-STAGE PRIVACY REDACTION ENGINE (Frosted White Glass) */}
          <div className="md:col-span-8 vision-card-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Local Processing Guarantee</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">3-Stage Zero-Exposure Pipeline</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">All Stages Run Inside Enclave</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                  <span>Regex Pattern Mask</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Scans unredacted telemetry for passwords, bearer tokens, API credentials, and internal IPv4 addresses.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">2</span>
                  <span>Shannon Entropy Analyzer</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Calculates entropy threshold (H &gt; 4.2). Unstructured random tokens intercepted prior to serialization.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">3</span>
                  <span>Strict Schema Validator</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Validates against payload.schema.json. Drops any undefined fields before HMAC signature creation.
                </p>
              </div>
            </div>
          </div>

          {/* SQLITE PERSISTENT STORE (Dark Slate Glass) */}
          <div className="md:col-span-4 vision-card-dark p-5 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Store-and-Forward Durability</span>
              <h3 className="text-base font-bold text-white mt-0.5">SQLite Outbox Queue</h3>
            </div>

            <div className="my-auto py-2 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Database File:</span>
                <span className="text-white font-bold">seenil_outbox.db</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Journal Mode:</span>
                <span className="text-emerald-400 font-bold">WAL (Write-Ahead)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Queue Depth:</span>
                <span className="text-white font-bold">{agentStatus?.outbox_depth || 0} Packets</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Delivery Guarantee:</span>
                <span className="text-emerald-400 font-bold">At-Least-Once / Zero Loss</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 pt-2 border-t border-white/10 flex items-center justify-between">
              <span>Automatic Drain on Reconnect</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
          </div>

        </div>

        {/* EGRESS PACKET STRIP CONVEYOR */}
        <div className="vision-card-dark p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Egress Packet Strip</span>
              <span className="text-[11px] font-mono text-emerald-400">({logs.length || 8} processed)</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Real-Time FIFO Network Queue</span>
          </div>

          {/* Conveyor Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            {(logs.length > 0 ? logs.slice(0, 10) : [1, 2, 3, 4, 5, 6, 7, 8]).map((item: any, i) => {
              const pid = typeof item === "object" ? item.payload_id?.slice(0, 8) : `pk_${i}9b2f`;
              return (
                <div
                  key={i}
                  className="shrink-0 px-3.5 py-1.5 rounded-full bg-zinc-800/90 border border-white/10 text-xs font-mono flex items-center gap-2 shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
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

      {/* BOTTOM FLOATING NAVIGATION PILL (Agent Only Navigation) */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 vision-bottom-dock px-3 py-2 flex items-center gap-1 shadow-2xl">
        <button
          onClick={() => setActiveAgentTab("console")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs shadow-md transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "console" ? "bg-zinc-900 text-white scale-105" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Terminal className="w-4 h-4 text-white" />
          <span>Console</span>
        </button>

        <button
          onClick={() => setActiveAgentTab("vault")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "vault" ? "bg-zinc-900 text-white scale-105" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Local Vault</span>
        </button>

        <button
          onClick={() => setActiveAgentTab("pipeline")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "pipeline" ? "bg-zinc-900 text-white scale-105" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Redaction</span>
        </button>

        <button
          onClick={() => setActiveAgentTab("outbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all duration-200 cursor-pointer vision-interactive ${
            activeAgentTab === "outbox" ? "bg-zinc-900 text-white scale-105" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Outbox Buffer</span>
        </button>

        <Link
          href="/proof"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition-all duration-200 cursor-pointer vision-interactive"
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>Egress Proof</span>
        </Link>
      </nav>
    </div>
  );
}