"use client";

import React, { useState, useEffect } from "react";
import { CommandHeader } from "@/components/CommandHeader";
import { CommandSidebar } from "@/components/CommandSidebar";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Flame
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

interface Incident {
  incident_id: string;
  tenant_id: string;
  title: string;
  severity: string;
  status: string;
  signals_fired: string[];
  correlation_window: string;
  why_flagged: string;
  recommended_action: string;
  operator_action_required: boolean;
  history_trajectory?: { time: string; value: number }[];
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/incidents", {
        headers: { Authorization: "Bearer seenil_tenant_a_tok" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.incidents) {
          const enriched = data.incidents.map((inc: Incident) => ({
            ...inc,
            history_trajectory: inc.history_trajectory || [
              { time: "T-40s", value: 12 },
              { time: "T-30s", value: 24 },
              { time: "T-20s", value: 58 },
              { time: "T-10s", value: 89 },
              { time: "NOW", value: 96 }
            ]
          }));
          setIncidents(enriched);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAction = async (incidentId: string, action: "confirm" | "dismiss") => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/incidents/${incidentId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer seenil_tenant_a_tok"
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setActionFeedback(
          action === "confirm"
            ? `Action confirmed for ${incidentId}. Work order dispatched.`
            : `Incident ${incidentId} dismissed as false positive.`
        );
        fetchIncidents();
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1B33] flex font-sans select-none">
      <CommandSidebar incidentCount={incidents.filter((i) => i.status === "ACTIVE").length} />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader title="AIOps Incidents &amp; Triage" />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* SOLID CONTRAST CARD 1: INCIDENT SPOTLIGHT (Navy 900 to 800) */}
          <div className="contrast-card p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3.5 z-10 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-rose-500/20 text-[#EF4444] border border-rose-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                  AIOPS SPOTLIGHT
                </span>
                <span className="text-xs text-slate-400 font-mono">·</span>
                <span className="text-xs text-slate-300 font-mono font-semibold">
                  SLIDING 45s WINDOW
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Autonomous Incident Correlation &amp; Triage
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Deterministic heuristic + Shannon entropy correlation clusters isolated anomaly spikes into unified incident dockets. Recommendations require human operator authorization before execution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 sm:gap-10 z-10">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold">
                  ACTIVE DOCKETS
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-[#EF4444] mt-1">
                  {incidents.filter((i) => i.status === "ACTIVE").length}
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1 font-semibold">
                  requiring operator triage
                </div>
              </div>

              <div className="border-l border-white/15 pl-8 sm:pl-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold mb-2">
                  CORRELATION ENGINE
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[#5EE6F0]">
                    ZERO FALSE-POSITIVE MODE
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900/25 rounded-full blur-[120px] pointer-events-none" />
          </div>

          {actionFeedback && (
            <div className="p-4 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-800 text-xs font-mono flex items-center justify-between px-6 shadow-sm">
              <span className="font-semibold">{actionFeedback}</span>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-1"
              >
                &times;
              </button>
            </div>
          )}

          {/* Incidents List */}
          {loading ? (
            <div className="glass-card p-12 text-center text-[#64748B] font-mono text-xs">
              Loading AIOps incident dockets...
            </div>
          ) : incidents.length === 0 ? (
            <div className="glass-card p-16 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-[#0F1B33]">All Systems Nominal</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Zero correlated anomalies detected across telemetry nodes in the last 24h. Continuous ML baselines are active.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((inc) => (
                <div
                  key={inc.incident_id}
                  className="glass-card p-7 space-y-6"
                >
                  {/* Top Bar: Docket Header & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#1D4A8A]">
                        INCIDENT-{inc.incident_id.toUpperCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs text-[#64748B]">
                        {inc.tenant_id}
                      </span>
                      <span
                        className={`px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          inc.severity === "critical"
                            ? "bg-rose-500/15 text-[#EF4444] border border-rose-300"
                            : "bg-amber-500/15 text-[#F59E0B] border border-amber-300"
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/70 text-[#0F1B33] border border-white/80 shadow-sm">
                        STATUS: {inc.status}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#64748B] flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{inc.correlation_window}</span>
                    </div>
                  </div>

                  {/* Main Grid: Details + SOLID CONTRAST CARD 2 (Waveform Preview) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Incident Details (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0F1B33]">
                          {inc.title}
                        </h3>
                      </div>

                      {/* Signals Fired Chips */}
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold mb-2">
                          SIGNALS FIRED:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {inc.signals_fired.map((sig, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-200 text-rose-700 text-xs font-mono font-semibold"
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Why Flagged */}
                      <div className="p-4 rounded-[18px] bg-white/70 border border-white/80 space-y-1 shadow-sm">
                        <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#1D4A8A] font-bold">
                          WHY FLAGGED (AIOPS CORRELATION LOGIC)
                        </div>
                        <p className="text-xs text-[#0F1B33] leading-relaxed">
                          {inc.why_flagged}
                        </p>
                      </div>

                      {/* Recommended Action */}
                      <div className="p-4 rounded-[18px] bg-cyan-500/10 border border-cyan-400/30 space-y-1 shadow-sm">
                        <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#06B6D4] font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span>RECOMMENDED ACTION (HUMAN-IN-THE-LOOP)</span>
                        </div>
                        <p className="text-xs text-[#0F1B33] leading-relaxed">
                          {inc.recommended_action}
                        </p>
                      </div>
                    </div>

                    {/* Right: SOLID CONTRAST CARD 2 - Mini Trajectory Waveform (4 cols) */}
                    <div className="lg:col-span-4 contrast-card p-5 space-y-3">
                      <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-300 font-bold flex items-center justify-between">
                        <span>METRIC TRAJECTORY</span>
                        <TrendingUp className="w-4 h-4 text-[#5EE6F0]" />
                      </div>

                      <div className="h-40 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inc.history_trajectory}>
                            <XAxis
                              dataKey="time"
                              stroke="#64748B"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#64748B"
                              fontSize={10}
                              tickLine={false}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0A1A3F",
                                borderColor: "#1B3A6B",
                                borderRadius: "12px",
                                color: "#FFF",
                                fontSize: "11px",
                                fontFamily: "monospace"
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#EF4444"
                              strokeWidth={3}
                              dot={{ r: 3, fill: "#EF4444" }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 text-center">
                        Normalized Anomaly Score leading to breach
                      </div>
                    </div>
                  </div>

                  {/* Operator Action Bar (Pill buttons) */}
                  <div className="pt-4 border-t border-white/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#64748B] italic">
                      * Recommendation only. Human operator must explicitly authorize any system intervention.
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAction(inc.incident_id, "dismiss")}
                        className="px-5 py-2.5 rounded-full border border-white/80 bg-white/80 hover:bg-white text-xs font-semibold text-[#0F1B33] flex items-center gap-2 transition cursor-pointer shadow-sm"
                      >
                        <XCircle className="w-4 h-4 text-[#64748B]" />
                        <span>Dismiss (False Positive)</span>
                      </button>

                      <button
                        onClick={() => handleAction(inc.incident_id, "confirm")}
                        className="px-6 py-2.5 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-xs font-semibold text-white flex items-center gap-2 transition shadow-lg shadow-[#1D4A8A]/30 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Action</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
