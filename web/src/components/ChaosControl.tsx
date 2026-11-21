"use client";

import React, { useState } from "react";
import { ShieldAlert, WifiOff, RefreshCw, Zap, KeyRound, CheckCircle2 } from "lucide-react";

export function ChaosControl({ onActionCompleted }: { onActionCompleted?: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = async (action: string, endpoint: string, body: any = {}) => {
    setLoading(action);
    setLastAction(null);
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/v1/agent/chaos/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setLastAction(`Executed: ${action} (${data.status || "OK"})`);
      if (onActionCompleted) onActionCompleted();
    } catch (err: any) {
      setLastAction(`Failed ${action}: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-[#131C2E] border border-[#1E2C44] rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live Demo Control Panel (One-Click Triggers)
          </span>
        </div>
        {lastAction && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lastAction}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Inject Secret */}
        <button
          onClick={() =>
            handleAction(
              "Inject Secret",
              "inject-secret",
              { secret: "MasterDbPassword999! and sk-canary-judge-verification-token-001" }
            )
          }
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 rounded-lg text-xs font-medium transition disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          {loading === "Inject Secret" ? "Injecting..." : "1. Inject Secret"}
        </button>

        {/* Kill Connection */}
        <button
          onClick={() => handleAction("Kill Connection", "kill-connection")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition disabled:opacity-50"
        >
          <WifiOff className="w-4 h-4 text-rose-400" />
          {loading === "Kill Connection" ? "Severing..." : "2. Kill SaaS (Outbox)"}
        </button>

        {/* Restore Connection */}
        <button
          onClick={() => handleAction("Restore Connection", "restore-connection")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading === "Restore Connection" ? "animate-spin" : ""}`} />
          {loading === "Restore Connection" ? "Draining..." : "3. Restore & Replay"}
        </button>

        {/* Sample Telemetry Now */}
        <button
          onClick={() => handleAction("Sample Telemetry", "collect-now")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-medium transition disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          {loading === "Sample Telemetry" ? "Sampling..." : "4. Sample Host Now"}
        </button>
      </div>
    </div>
  );
}
