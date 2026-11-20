"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CommandHeader } from "@/components/CommandHeader";
import { CommandSidebar } from "@/components/CommandSidebar";
import {
  Sliders,
  Flame,
  WifiOff,
  Wifi,
  Clock,
  TrendingUp,
  ExternalLink,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

interface AgentStatus {
  status: string;
  outbox_depth: number;
  is_outage_simulated: boolean;
  total_sent: number;
  total_collected: number;
}

interface ActionLog {
  id: string;
  time: string;
  message: string;
  type: "success" | "warn" | "info";
}

export default function DemoControlsPage() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActionLog[]>([
    {
      id: "log-init",
      time: new Date().toISOString().substring(11, 19) + "Z",
      message: "SEENIL Edge Daemon connected on http://127.0.0.1:8765. Ready for evaluator test cycles.",
      type: "info"
    }
  ]);

  const addLog = (message: string, type: "success" | "warn" | "info" = "info") => {
    const newLog: ActionLog = {
      id: "log-" + Date.now(),
      time: new Date().toISOString().substring(11, 19) + "Z",
      message,
      type
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 30)]);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8765/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerAction = async (name: string, endpoint: string, customToast: string) => {
    setActiveButton(name);
    setToastMessage(null);
    try {
      const res = await fetch(`http://127.0.0.1:8765/control/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setToastMessage(customToast);
      addLog(`[ACTION ${name.toUpperCase()}]: ${data.message || customToast}`, "success");
      await fetchStatus();
    } catch (err: any) {
      setToastMessage(`Action failed: ${err.message}`);
      addLog(`[ERROR ${name}]: ${err.message}`, "warn");
    } finally {
      setTimeout(() => setActiveButton(null), 800);
    }
  };

  const isOutage = status?.is_outage_simulated ?? false;
  const outboxDepth = status?.outbox_depth ?? 0;

  return (
    <div className="min-h-screen text-[#0F1B33] flex font-sans select-none">
      <CommandSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader title="Evaluator Live Demo Controls" />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* CONTRAST CARD 1: EVALUATOR DEMO SUITE */}
          <div className="contrast-card p-7 shadow-[0_8px_32px_rgba(10,26,63,0.25)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 z-10 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                  INTERACTIVE CHAOS SUITE
                </span>
                <span className="text-xs text-slate-400 font-mono">·</span>
                <span className="text-xs text-[#5EE6F0] font-mono font-semibold">
                  JUDGE EVALUATION TOOLBAR
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                One-Click Verifiable Telemetry &amp; Egress Triggers
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Execute live failure injection, secret planting, and latency tests directly against the local Python collector daemon on port 8765.
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <Link
                href="/egress-proof"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#06B6D4] hover:from-[#163B70] hover:to-[#0891B2] text-white text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg shadow-[#1D4A8A]/40 shrink-0"
              >
                <span>Open Egress Proof</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#5EE6F0]" />
              </Link>
            </div>

            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-900/20 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="p-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center justify-between px-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-1"
              >
                &times;
              </button>
            </div>
          )}

          {/* Connection Status Glass Pill Bar */}
          <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold">
                NETWORK TRANSPORT STATE:
              </span>
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold ${
                  isOutage
                    ? "bg-rose-500/10 text-[#EF4444] border border-rose-300"
                    : "bg-emerald-500/10 text-[#10B981] border border-emerald-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOutage ? "bg-[#EF4444]" : "bg-[#10B981] animate-pulse"
                  }`}
                />
                {isOutage ? `SEVERED (Outbox Depth: ${outboxDepth})` : "ONLINE (Direct Ingestion)"}
              </span>
            </div>

            <div className="text-xs font-mono text-[#64748B]">
              SQLite Outbox Buffer: <span className="font-bold text-[#0F1B33]">{outboxDepth} pending packets</span>
            </div>
          </div>

          {/* 6 INTERACTIVE CONTROLS (Glass Cards with Pill Buttons) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Inject Secret */}
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-200 flex items-center justify-center text-[#EF4444]">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F1B33]">Inject Secret</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Writes raw canary credentials to host's local auth.log. Redacted before egress.
                </p>
              </div>

              <button
                onClick={() =>
                  triggerAction(
                    "Inject Secret",
                    "inject-secret",
                    "Secret injected into local auth.log. Watch Egress Proof!"
                  )
                }
                disabled={activeButton === "Inject Secret"}
                className="w-full h-11 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-[#1D4A8A]/30 cursor-pointer disabled:opacity-50"
              >
                <span>{activeButton === "Inject Secret" ? "Injecting..." : "Inject Secret"}</span>
              </button>
            </div>

            {/* 2. Kill Connection */}
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-[#F59E0B]">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F1B33]">Kill Connection</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Simulates complete network severance. Agent buffers outgoing telemetry to local SQLite.
                </p>
              </div>

              <button
                onClick={() =>
                  triggerAction(
                    "Kill Connection",
                    "kill-connection",
                    "Connection severed. Agent now buffering to local SQLite."
                  )
                }
                disabled={activeButton === "Kill Connection"}
                className="w-full h-11 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                <span>{activeButton === "Kill Connection" ? "Severing..." : "Kill Connection"}</span>
              </button>
            </div>

            {/* 3. Restore Connection */}
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-[#10B981]">
                  <Wifi className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F1B33]">Restore Connection</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Re-establishes cloud link and triggers transaction flush of buffered SQLite events.
                </p>
              </div>

              <button
                onClick={() =>
                  triggerAction(
                    "Restore Connection",
                    "restore-connection",
                    "Connection restored. Agent flushing outbox..."
                  )
                }
                disabled={activeButton === "Restore Connection"}
                className="w-full h-11 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                <span>{activeButton === "Restore Connection" ? "Restoring..." : "Restore Connection"}</span>
              </button>
            </div>

            {/* 4. Send Late Event */}
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F1B33]">Send Late Event</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Sends an out-of-order event with timestamp 120s in the past to test chronological sorting.
                </p>
              </div>

              <button
                onClick={() =>
                  triggerAction(
                    "Send Late Event",
                    "send-late-event",
                    "Event with 120s-old timestamp sent. Watch ordering on Fleet Overview!"
                  )
                }
                disabled={activeButton === "Send Late Event"}
                className="w-full h-11 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-[#1D4A8A]/30 cursor-pointer disabled:opacity-50"
              >
                <span>{activeButton === "Send Late Event" ? "Dispatching..." : "Send Late Event"}</span>
              </button>
            </div>

            {/* 5. Spike CPU */}
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-200 flex items-center justify-center text-[#EF4444]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0F1B33]">Spike CPU</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Emulates a 96.4% thread runaway to test deterministic 4-tier health state downgrade.
                </p>
              </div>

              <button
                onClick={() =>
                  triggerAction(
                    "Spike CPU",
                    "spike-cpu",
                    "CPU spiked to 96.4%. Watch health transition to Fair/Poor!"
                  )
                }
                disabled={activeButton === "Spike CPU"}
                className="w-full h-11 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-[#1D4A8A]/30 cursor-pointer disabled:opacity-50"
              >
                <span>{activeButton === "Spike CPU" ? "Spiking..." : "Spike CPU"}</span>
              </button>
            </div>

            {/* 6. Egress Shortcut */}
            <div className="contrast-card p-6 flex flex-col justify-between space-y-4 shadow-[0_8px_32px_rgba(10,26,63,0.25)]">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#5EE6F0]">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Cryptographic Egress Audit</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct browser view of raw local SQLite logs vs sanitized cloud payloads with SHA-256 match.
                </p>
              </div>

              <Link
                href="/egress-proof"
                className="w-full h-11 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>Open Egress Proof Panel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CONTRAST CARD 2: LIVE ACTION LOG STREAM (Solid Navy 900) */}
          <div className="contrast-card overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(10,26,63,0.25)]">
            <div className="px-6 py-4 bg-[#081533] border-b border-[#1B3A6B]/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-[#5EE6F0]" />
                <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-white uppercase">
                  LIVE AGENT &amp; EVALUATION ACTION LOG
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400 font-bold">STREAM ACTIVE</span>
              </div>
            </div>

            <div className="p-6 max-h-60 overflow-y-auto space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <span className="text-slate-400 text-[11px] shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "warn"
                        ? "text-amber-400"
                        : "text-[#5EE6F0]"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}