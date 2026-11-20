"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
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
  Zap,
  Shield
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
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between p-4 sm:p-6 pb-24 font-sans select-none relative overflow-x-hidden">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto w-full space-y-4 z-10">
        {/* TOP STATUS BAR (High-contrast Black & White) */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3">
            <span className="font-extrabold font-mono text-xl tracking-wider text-white">
              SEENIL
            </span>
            <span className="text-xs font-mono text-zinc-500 uppercase">Chaos Scenarios</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-[0.08em] text-zinc-400 font-bold">
              TRANSPORT:
            </span>
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold ${
                isOutage
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOutage ? "bg-rose-500" : "bg-emerald-400 animate-pulse"
                }`}
              />
              {isOutage ? `SEVERED (Outbox Depth: ${outboxDepth})` : "ONLINE (Direct Ingestion)"}
            </span>
          </div>
        </div>

        {/* HERO BANNER CARD (Pitch-black luxury) */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-7 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                INTERACTIVE CHAOS SUITE
              </span>
              <span className="text-xs text-zinc-600 font-mono">·</span>
              <span className="text-xs text-white font-mono font-semibold">
                JUDGE EVALUATION TOOLBAR
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              One-Click Invariant &amp; Telemetry Stress Triggers
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Execute live failure injection, canary credential planting, delayed packet reordering, and CPU thread runaways directly against the local Python collector daemon on port 8765.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <Link
              href="/egress-proof"
              className="px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg shrink-0"
            >
              <span>Inspect Egress Proof</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="p-4 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-mono flex items-center justify-between px-6 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white font-bold px-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* 6 HIGH-CONTRAST INTERACTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Inject Secret */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Inject Secret</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Writes raw canary credentials to host&apos;s local auth.log. Redacted before egress.
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
              className="w-full h-11 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{activeButton === "Inject Secret" ? "Injecting..." : "Inject Secret"}</span>
            </button>
          </div>

          {/* 2. Kill Connection */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Kill Connection</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
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
              className="w-full h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{activeButton === "Kill Connection" ? "Severing..." : "Kill Connection"}</span>
            </button>
          </div>

          {/* 3. Restore Connection */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Restore Connection</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
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
              className="w-full h-11 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{activeButton === "Restore Connection" ? "Restoring..." : "Restore Connection"}</span>
            </button>
          </div>

          {/* 4. Send Late Event */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Send Late Event</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
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
              className="w-full h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{activeButton === "Send Late Event" ? "Dispatching..." : "Send Late Event"}</span>
            </button>
          </div>

          {/* 5. Spike CPU */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Spike CPU</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
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
              className="w-full h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{activeButton === "Spike CPU" ? "Spiking..." : "Spike CPU"}</span>
            </button>
          </div>

          {/* 6. Egress Shortcut */}
          <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Cryptographic Egress Audit</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Inspect raw local SQLite entries vs sanitized cloud payloads with SHA-256 match.
              </p>
            </div>

            <Link
              href="/egress-proof"
              className="w-full h-11 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Open Split Proof Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* LIVE TERMINAL STREAM CARD */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] overflow-hidden flex flex-col shadow-[0_16px_50px_rgba(0,0,0,0.8)]">
          <div className="px-6 py-4 bg-[#000000] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-white uppercase">
                LIVE AGENT &amp; EVALUATION ACTION LOG
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold">STREAM ACTIVE</span>
            </div>
          </div>

          <div className="p-6 max-h-60 overflow-y-auto space-y-2 font-mono text-xs bg-[#000000]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <span className="text-zinc-600 text-[11px] shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "warn"
                      ? "text-amber-400"
                      : "text-zinc-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
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
          <Link
            href="/agent/dashboard"
            className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            Tier 1: Local Agent
          </Link>
          <Link
            href="/egress-proof"
            className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            Split Proof
          </Link>
          <span className="px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold shadow-md">
            ⚡ Scenarios
          </span>
        </div>
      </div>
    </div>
  );
}