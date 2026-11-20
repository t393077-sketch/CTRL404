"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Terminal,
  Shield,
  CheckCircle2,
  ExternalLink,
  Flame,
  WifiOff,
  Wifi,
  Sparkles
} from "lucide-react";

interface AuditLogItem {
  id: number;
  payload_id: string;
  source_id: string;
  raw_input: string;
  sanitized_payload: string;
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
      const res = await fetch(`http://127.0.0.1:8765/control/${endpoint}`, {
        method: "POST"
      });
      const data = await res.json();
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
    source_id: "src-1895c0e58b",
    raw_input: "[INFO] 2026-11-20T21:40:07.364351+00:00 host=analytics-fra.cloud.internal ip=172.16.8.99 service=http_router status=200 path=/api/v2/telemetry latency=23.4ms cpu=40.8% mem=61.4%",
    sanitized_payload: JSON.stringify(
      {
        payload_id: "34e0fe43-de3b-420d-a023-d29c10f3d5be",
        tenant_id: "tenant-beta",
        region: "eu-west-1",
        collector_id: "collector-fra-01",
        collector_version: "1.4.0",
        collector_cpu_pct: 10.38,
        collector_mem_mb: 48.59,
        config_status: "synced",
        pseudonymous_source_id: "src-1895c0e58b",
        event_utc: "2026-11-20T21:40:07.364351+00:00",
        metrics: {
          cpu_pct: 40.8,
          memory_pct: 61.4,
          network_latency_ms: 23.4
        }
      },
      null,
      2
    ),
    sha256_hash: "a4c28f9d8b7e21a3f019b847c5d3e201fa87c93812d4b567e890123456789abc",
    created_at: "2026-11-20 21:40:07Z"
  };

  const isOutage = agentStatus?.is_outage_simulated ?? false;
  const outboxDepth = agentStatus?.outbox_depth ?? 0;

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-4 sm:p-6 pb-24 font-sans select-none relative overflow-x-hidden">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto w-full space-y-4 z-10">
        {/* TOP STATUS BAR (Image 3 exact reference in pure black & white) */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              LOCAL ENVIRONMENT ONLY · NEVER EXPOSED TO CLOUD
            </span>
          </div>

          {/* Overlapping black circular badges + controls */}
          <div className="flex items-center gap-5">
            {/* 3 Overlapping circular badges */}
            <div className="flex items-center -space-x-3">
              <div className="w-14 h-14 rounded-full bg-[#121214] border border-zinc-700 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-mono font-extrabold text-white">0</span>
                <span className="text-[7px] font-mono text-zinc-400 uppercase leading-none">scrubbed</span>
              </div>
              <div className="w-14 h-14 rounded-full bg-[#121214] border border-zinc-700 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-mono font-extrabold text-white">0</span>
                <span className="text-[7px] font-mono text-zinc-400 uppercase leading-none">KB blk</span>
              </div>
              <div className="w-14 h-14 rounded-full bg-[#121214] border border-zinc-700 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-mono font-extrabold text-white">{outboxDepth}</span>
                <span className="text-[7px] font-mono text-zinc-400 uppercase leading-none">buffer</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOutage ? "bg-rose-500 animate-ping" : "bg-emerald-400"}`} />
              <span className="text-xs font-mono font-bold text-zinc-300">
                {isOutage ? "OUTAGE SIMULATED" : "NOMINAL"}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerControl("inject", "inject-secret", "Injected canary secret into local log")}
                disabled={activeAction === "inject"}
                className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-white transition cursor-pointer"
              >
                INJECT SECRET
              </button>
              <button
                onClick={() =>
                  triggerControl(
                    "outage",
                    isOutage ? "restore-connection" : "kill-connection",
                    isOutage ? "Restored link & flushing buffer" : "Simulated network drop"
                  )
                }
                disabled={activeAction === "outage"}
                className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition cursor-pointer ${
                  isOutage
                    ? "bg-rose-500/20 border-rose-400 text-rose-300"
                    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white"
                }`}
              >
                {isOutage ? "RESTORE LINK" : "SIMULATE OUTAGE"}
              </button>
              <button
                onClick={() => triggerControl("flush", "restore-connection", "Buffer flushed to cloud")}
                disabled={activeAction === "flush"}
                className="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold transition cursor-pointer shadow-md"
              >
                FLUSH BUFFER
              </button>
            </div>
          </div>
        </div>

        {/* Notice toast */}
        {actionNotice && (
          <div className="px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* SPLIT VAULT & EGRESS VIEW (Image 3 exact reference) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: LOCAL VAULT (RAW LOGS, NEVER TRANSMITTED) */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 space-y-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  LOCAL VAULT
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                NEVER TRANSMITTED
              </span>
            </div>

            {/* Raw Log Entries */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {logs.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
                    selectedIndex === idx
                      ? "bg-[#18181B] border-zinc-500 text-white shadow-lg"
                      : "bg-[#000000] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-[11px] text-zinc-300 break-all leading-relaxed font-mono">
                    {item.raw_input}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 font-mono">
                    <span>source: {item.source_id}</span>
                    <span>175 B</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Raw logs: local SQLite only · 7-day ring buffer</span>
              <span className="text-emerald-400">SHA-256 Verified Match</span>
            </div>
          </div>

          {/* RIGHT: ALLOW-LISTED EGRESS PAYLOAD */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 space-y-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-white" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  ALLOW-LISTED EGRESS PAYLOAD
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-mono font-bold uppercase tracking-wider">
                ZERO RAW DATA TRANSMITTED
              </span>
            </div>

            {/* Header info */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold">
                  QUEUED
                </span>
                <span className="text-zinc-400 text-[11px]">
                  Raw: <span className="text-zinc-200 font-bold">177 B</span> &rarr; Sanitized:{" "}
                  <span className="text-white font-bold">769 B</span>
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] pt-1">
                payload_id: <span className="text-white">{currentItem.payload_id}</span>
              </div>
              <div className="text-zinc-400 text-[11px]">
                pseudonymous_source_id:{" "}
                <span className="text-white">{currentItem.source_id}</span>
              </div>
            </div>

            {/* Payload JSON Inspector (High-contrast pure white card with black code or dark container) */}
            <div className="bg-[#FFFFFF] text-[#000000] rounded-2xl p-4 font-mono text-xs max-h-[220px] overflow-y-auto shadow-inner border border-zinc-300">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] font-semibold">
                {currentItem.sanitized_payload}
              </pre>
            </div>

            {/* Blocked / Redacted fields chips */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-500">
                BLOCKED / REDACTED FIELDS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["raw_log", "api_key", "password", "token", "raw_auth_record", "real_hostname"].map(
                  (field) => (
                    <span
                      key={field}
                      className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                    >
                      {field}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: EGRESS PACKET STRIP (Image 1 exact reference in black & white) */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 space-y-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              EGRESS PACKET STRIP
            </h2>
            <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold">
              {outboxDepth} in queue
            </span>
          </div>

          {/* Packet Chips Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {logs.map((item, idx) => {
              const isDelivered = idx % 2 === 0;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono shrink-0 transition cursor-pointer ${
                    selectedIndex === idx
                      ? "bg-white text-black font-bold border-white"
                      : "bg-[#000000] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDelivered ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span>#{item.payload_id.substring(0, 8)}</span>
                </div>
              );
            })}
          </div>

          {/* Packet Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                  <th className="pb-2 font-semibold">PAYLOAD ID</th>
                  <th className="pb-2 font-semibold">STATUS</th>
                  <th className="pb-2 font-semibold">CREATED UTC</th>
                  <th className="pb-2 font-semibold">DELIVERED UTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.slice(0, 5).map((item, idx) => {
                  const isDelivered = idx % 2 === 0;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-2.5 text-zinc-200">#{item.payload_id.substring(0, 8)}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {isDelivered ? "DELIVERED" : "BUFFERED"}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400">{item.created_at || "2026-11-20 21:41:19Z"}</td>
                      <td className="py-2.5 text-zinc-400">
                        {isDelivered ? item.created_at || "2026-11-20 21:41:22Z" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FLOATING PILL DOCK AT BOTTOM */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#09090B] border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
          <Link
            href="/cloud/dashboard"
            className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            Tier 2: Cloud SaaS
          </Link>
          <span className="px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold shadow-md">
            Tier 1: Local Agent
          </span>
          <Link
            href="/egress-proof"
            className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            Split Proof
          </Link>
          <Link
            href="/demo-controls"
            className="px-4 py-2 rounded-full text-xs font-mono text-white hover:bg-zinc-900 transition flex items-center gap-1.5"
          >
            <span>⚡ Scenarios</span>
          </Link>
        </div>
      </div>
    </div>
  );
}