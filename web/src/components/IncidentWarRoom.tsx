"use client";

import React, { useState } from "react";
import {
  Flame,
  ShieldAlert,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  RotateCcw,
  Hash,
} from "lucide-react";

export interface IncidentSignal {
  metric: string;
  value: number;
  health: string;
  category: string;
  severity: string;
  alert_context: string;
  mad_z_score: number;
  timestamp_utc: string;
}

export interface IncidentItem {
  incident_id: string;
  tenant_id: string;
  title: string;
  severity: string;
  status: string;
  source_nodes: string[];
  signals: IncidentSignal[];
  root_cause_explanation: string;
  recommended_action: string;
  remediation_policy: string;
  created_at_utc: string;
  remediation_audit?: any;
}

interface IncidentWarRoomProps {
  incidents: IncidentItem[];
  onRemediate: (incidentId: string) => Promise<void>;
}

export function IncidentWarRoom({ incidents, onRemediate }: IncidentWarRoomProps) {
  const [selectedId, setSelectedId] = useState<string | null>(incidents[0]?.incident_id || null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  const selectedIncident = incidents.find((i) => i.incident_id === selectedId) || incidents[0];

  const handleExecute = async (id: string) => {
    setRemediatingId(id);
    try {
      await onRemediate(id);
    } finally {
      setTimeout(() => setRemediatingId(null), 1000);
    }
  };

  return (
    <div className="bg-slate-950/70 rounded-2xl border border-white/[0.08] p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono tracking-wide uppercase">
                AIOps Incident War Room
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {incidents.filter((i) => i.status === "active").length} ACTIVE INCIDENTS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Multi-signal clustering across 60s sliding window with explainable root-cause paths.
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          BASELINE ENGINE: <span className="text-cyan-400 font-bold">MODIFIED Z-SCORE (MAD &gt; 3.0)</span>
        </div>
      </div>

      {/* Main War Room Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Incidents List (40%) */}
        <div className="lg:col-span-5 space-y-2.5">
          {incidents.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-mono">
              All infrastructure baselines normal. No correlated incidents.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.incident_id === inc.incident_id;
              const isCritical = inc.severity === "critical";
              const isResolved = inc.status === "resolved";

              return (
                <div
                  key={inc.incident_id}
                  onClick={() => setSelectedId(inc.incident_id)}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900/90 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "bg-slate-900/40 border-white/[0.06] hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isResolved
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : isCritical
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {isResolved ? "RESOLVED" : inc.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inc.incident_id}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white leading-snug">
                    {inc.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-white/[0.04]">
                    <span>{inc.source_nodes.join(", ")}</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      {inc.signals.length} Signals Correlated &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Deep Diagnostic & 1-Click Autonomous Action (60%) */}
        {selectedIncident && (
          <div className="lg:col-span-7 bg-slate-900/60 rounded-xl border border-white/[0.08] p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  EXPLAINABLE ROOT CAUSE &amp; MITIGATION
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedIncident.created_at_utc.replace("T", " ").substring(0, 19)} UTC
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                {selectedIncident.title}
              </h3>
            </div>

            {/* AI Root Cause Inference Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Activity className="w-3.5 h-3.5" />
                <span>Explainable Diagnostic Path (Metadata Only):</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedIncident.root_cause_explanation}
              </p>
            </div>

            {/* Correlated Signals Breakdown */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Correlated Signals &amp; MAD Anomaly Deviations:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedIncident.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-cyan-300 font-bold">{sig.metric}</span>
                      <span className="text-slate-500 text-[10px] ml-2">
                        {sig.alert_context}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{sig.value}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Z: +{sig.mad_z_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action & Autonomous Remediation Runbook */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
              <div>
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  AUTONOMOUS OPS RECOMMENDATION
                </div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {selectedIncident.recommended_action}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Policy: {selectedIncident.remediation_policy}
                </div>
              </div>

              {/* Action Button or Audit Hash Confirmation */}
              {selectedIncident.status === "resolved" ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1 text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>POLICY EXECUTED &amp; INCIDENT RESOLVED</span>
                  </div>
                  {selectedIncident.remediation_audit && (
                    <div className="text-[10px] text-slate-400 pt-1 space-y-0.5">
                      <div>
                        HASH: <span className="text-slate-200">{selectedIncident.remediation_audit.execution_hash}</span>
                      </div>
                      <div>
                        OPERATOR: <span className="text-cyan-300">{selectedIncident.remediation_audit.executed_by}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleExecute(selectedIncident.incident_id)}
                  disabled={remediatingId === selectedIncident.incident_id}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>
                    {remediatingId === selectedIncident.incident_id
                      ? "EXECUTING RUNBOOK & VERIFYING HASH..."
                      : "EXECUTE AUTONOMOUS REMEDIATION RUNBOOK"}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
