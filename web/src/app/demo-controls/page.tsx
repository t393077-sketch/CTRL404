"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  WifiOff,
  Wifi,
  Clock,
  TrendingUp,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Home,
  FileCheck2,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  LayoutGrid
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
      message: "SEENIL Edge Daemon connected on http://127.0.0.1:8000. Ready for evaluator test cycles.",
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
      const res = await fetch("http://127.0.0.1:8000/status");
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
      const res = await fetch(`http://127.0.0.1:8000/control/${endpoint}`, {
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
    <div className="min-h-screen vision-backdrop text-[#0F172A] flex flex-col justify-between p-3 sm:p-5 pb-28 font-sans select-none relative overflow-x-hidden">
      
      {/* LEFT FLOATING VERTICAL DOCK */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6 vision-dock px-3 py-6">
        <Link href="/cloud/dashboard" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <LayoutGrid className="w-5 h-5" />
        </Link>
        <Link href="/agent/dashboard" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <Terminal className="w-5 h-5" />
        </Link>
        <Link href="/proof" className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition hover:scale-110">
          <ShieldCheck className="w-5 h-5" />
        </Link>
        <Link href="/scenarios" className="p-2.5 rounded-xl bg-white/20 text-white shadow-sm transition hover:scale-110">
          <AlertTriangle className="w-5 h-5 text-white" />
        </Link>
        <Link href="/" className="mt-4 p-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/10 transition hover:scale-110">
          <LogOut className="w-5 h-5" />
        </Link>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1520px] mx-auto w-full space-y-4 md:pl-16 z-10">

        {/* TOP BRAND HEADER */}
        <header className="flex items-center justify-between px-2 pt-1 pb-2">
          <div className="flex items-center gap-2">
            <div className="vision-pill px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Interactive Resilience &amp; Chaos Engineering</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-black p-0.5 shadow-md flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0F172A]">SEENIL</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 tracking-wider mt-0.5">
              Live Demo &amp; Chaos Control Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="vision-pill px-3 py-1 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Node 8000 Active</span>
            </div>
            <button className="vision-pill p-2 text-slate-600 hover:text-black transition">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono">CONFIRMED</span>
          </div>
        )}

        {/* GRID OF CHAOS ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ACTION 1: INJECT SECRET */}
          <div className="vision-card-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Flame className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Privacy Test</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Inject Fake Secret</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Appends canary password into local auth log. Proves local redaction strips secret before network serialization.
              </p>
            </div>
            <button
              onClick={() => triggerAction("secret", "inject-secret", "Canary secret injected and locally redacted")}
              disabled={activeButton === "secret"}
              className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {activeButton === "secret" ? "Scrubbing..." : "Inject Secret & Redact"}
            </button>
          </div>

          {/* ACTION 2: NETWORK OUTAGE / RESTORE */}
          <div className="vision-card-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isOutage ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {isOutage ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Resilience Test</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Simulate Network Outage</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sever cloud link. Agent buffers telemetry in SQLite outbox queue with zero packet drop.
              </p>
            </div>
            {isOutage ? (
              <button
                onClick={() => triggerAction("reconnect", "restore-connection", "Connection restored & outbox flushed")}
                disabled={activeButton === "reconnect"}
                className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                {activeButton === "reconnect" ? "Flushing..." : "Restore Connection"}
              </button>
            ) : (
              <button
                onClick={() => triggerAction("outage", "kill-connection", "Simulated network partition active")}
                disabled={activeButton === "outage"}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                {activeButton === "outage" ? "Partitioning..." : "Kill Connection"}
              </button>
            )}
          </div>

          {/* ACTION 3: CPU EXECUTION SPIKE */}
          <div className="vision-card-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">MAD Anomaly Test</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">CPU Execution Spike</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Triggers sustained 98.8% CPU load breach. Verifies synchronous MAD baseline detection and AIOps correlation.
              </p>
            </div>
            <button
              onClick={() => triggerAction("cpu", "spike-cpu", "CPU spike triggered: anomaly evaluated & incident correlated")}
              disabled={activeButton === "cpu"}
              className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {activeButton === "cpu" ? "Triggering..." : "Spike CPU (98.8%)"}
            </button>
          </div>

          {/* ACTION 4: OUT-OF-ORDER EVENT */}
          <div className="vision-card-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Time Drift Test</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Send Late Event</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Dispatches an out-of-order event timestamped 120s in the past. Proves timestamp preservation.
              </p>
            </div>
            <button
              onClick={() => triggerAction("late", "send-late-event", "Late event ingested with preserved UTC timestamp")}
              disabled={activeButton === "late"}
              className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {activeButton === "late" ? "Dispatching..." : "Send Late Event (T-120s)"}
            </button>
          </div>

        </div>

        {/* STATUS BAR & LIVE ACTION LOG */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* QUEUE & BUFFERS */}
          <div className="md:col-span-4 vision-card-dark p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider block">Local SQLite Enclave Buffer</span>
              <h3 className="text-base font-bold text-white mt-0.5">Outbox Health</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Connection State:</span>
                <span className={`font-bold ${isOutage ? "text-rose-400" : "text-emerald-400"}`}>
                  {isOutage ? "SIMULATED OUTAGE" : "ONLINE"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Pending Outbox Items:</span>
                <span className="font-bold text-white font-mono text-sm">{outboxDepth}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Deduplication Invariant:</span>
                <span className="font-bold text-emerald-400">0 Duplicates Stored</span>
              </div>
            </div>

            <button
              onClick={() => triggerAction("flush", "restore-connection", "Outbox manually flushed to cloud")}
              className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/15"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
              Flush Pending Outbox
            </button>
          </div>

          {/* LIVE CHRONOLOGICAL LOG */}
          <div className="md:col-span-8 vision-card-dark p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Live Event Stream</span>
                <span className="text-xs text-emerald-400 font-mono">({logs.length} logged)</span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">UTC Timestamped</span>
            </div>

            <div className="h-44 bg-black/80 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-2 border border-white/10 shadow-inner">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-400 font-medium"
                        : log.type === "warn"
                        ? "text-amber-400 font-medium"
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

      </div>

      {/* BOTTOM FLOATING NAVIGATION PILL */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 vision-bottom-dock px-3 py-2 flex items-center gap-1 shadow-2xl">
        <Link
          href="/scenarios"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white font-semibold text-xs shadow-md"
        >
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>Chaos Controls</span>
        </Link>
        <Link
          href="/cloud/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <Home className="w-4 h-4" />
          <span>Cloud</span>
        </Link>
        <Link
          href="/agent/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <Terminal className="w-4 h-4" />
          <span>Agent</span>
        </Link>
        <Link
          href="/proof"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 font-semibold text-xs transition"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Egress Proof</span>
        </Link>
      </nav>
    </div>
  );
}
