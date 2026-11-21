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
  Flame,
  Network,
  Activity,
  Layers,
  Cpu,
  Server,
  Database,
  Globe,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface CandidateCause {
  metric: string;
  source_node: string;
  first_seen_utc: string;
  peak_value: number;
  baseline_median: number;
  mad_z_score: number;
  composite_score: number;
  temporal_score: number;
  magnitude_score: number;
  topology_score: number;
  cascade_score: number;
  rationale: string;
}

interface EvidenceStep {
  step_order: number;
  timestamp_utc: string;
  time_offset_s: string;
  source_node: string;
  metric: string;
  observed_value: number;
  mad_z_score: number;
  severity: string;
  role: string;
  alert_context: string;
}

interface TopologyNode {
  id: string;
  name: string;
  type: string;
  tier: string;
  status: string;
  metrics?: Record<string, any>;
  is_known?: boolean;
}

interface TopologyEdge {
  from: string;
  to: string;
  type: string;
  is_known?: boolean;
  latency_ms?: number;
}

interface RCADossier {
  incident_id: string;
  tenant_id: string;
  severity: string;
  correlation_score: number;
  primary_probable_cause: CandidateCause;
  alternative_causes: CandidateCause[];
  confidence_score: number;
  confidence_pct: number;
  confidence_rating: string;
  contributing_metrics: string[];
  evidence_timeline: EvidenceStep[];
  investigation_steps: string[];
  ai_explanation: {
    summary: string;
    observed_facts: string[];
    leading_hypothesis: string;
    alternative_hypotheses: Array<{
      hypothesis: string;
      score: number;
      rejection_reason: string;
    }>;
    confidence_assessment: string;
    generator: string;
    trust_boundary: string;
  };
  topology_subgraph?: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  };
}

interface IncidentItem {
  incident_id: string;
  tenant_id: string;
  title: string;
  severity: string;
  status: string;
  source_nodes: string[];
  signals: any[];
  root_cause_explanation: string;
  recommended_action: string;
  remediation_policy: string;
  created_at_utc: string;
  correlation_score: number;
  rca?: RCADossier;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [expandedRca, setExpandedRca] = useState<Record<string, boolean>>({});
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/incidents", {
        headers: { "X-Tenant-ID": "tenant_alpha", Authorization: "Bearer seenil_tenant_a_tok" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.incidents) {
          setIncidents(data.incidents);
          // Default first incident expanded
          if (data.incidents.length > 0) {
            setExpandedRca((prev) => ({
              ...prev,
              [data.incidents[0].incident_id]: true
            }));
          }
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

  const toggleRca = (id: string) => {
    setExpandedRca((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
        setConfirmingAction(null);
        setActionFeedback(
          action === "confirm"
            ? `Remediation action confirmed for ${incidentId}. Automated runbook executed.`
            : `Incident ${incidentId} dismissed as false positive.`
        );
        fetchIncidents();
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1B33] flex font-sans select-none">
      <CommandSidebar incidentCount={incidents.filter((i) => i.status === "active").length} />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader title="AIOps Topology-Aware Incident Intelligence & RCA" />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* TOP BANNER: SPOTLIGHT */}
          <div className="contrast-card p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 z-10 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-rose-500/20 text-[#EF4444] border border-rose-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                  AIOPS INCIDENT INTELLIGENCE
                </span>
                <span className="text-xs text-slate-400 font-mono">·</span>
                <span className="text-xs text-slate-300 font-mono font-semibold">
                  SLIDING 90s CORRELATION WINDOW
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Topology-Aware AI Root Cause Analysis
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Correlates multi-signal metric anomalies (CPU, RAM, latency, retries) across infrastructure dependencies. Identifies primary probable causes and downstream symptom cascades without exposing raw logs or customer secrets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 sm:gap-10 z-10">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold">
                  ACTIVE DOCKETS
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-[#EF4444] mt-1">
                  {incidents.filter((i) => i.status === "active").length}
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1 font-semibold">
                  requiring operator review
                </div>
              </div>

              <div className="border-l border-white/15 pl-8 sm:pl-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold mb-2">
                  CORRELATION ENGINE
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[#5EE6F0]">
                    TOPOLOGY &amp; MAD GROUNDED
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900/25 rounded-full blur-[120px] pointer-events-none" />
          </div>

          {actionFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-800 text-xs font-mono flex items-center justify-between px-6 shadow-sm">
              <span className="font-semibold">{actionFeedback}</span>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* INCIDENTS LIST */}
          {loading ? (
            <div className="glass-card p-12 text-center text-[#64748B] font-mono text-xs">
              Loading topology-aware incident dossiers...
            </div>
          ) : incidents.length === 0 ? (
            <div className="glass-card p-16 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-[#0F1B33]">All Systems Nominal</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Zero correlated anomalies detected across telemetry nodes in the last 24h.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((inc) => {
                const isExpanded = expandedRca[inc.incident_id] ?? false;
                const rca = inc.rca;
                const primaryCause = rca?.primary_probable_cause;
                const aiExplanation = rca?.ai_explanation;

                return (
                  <div
                    key={inc.incident_id}
                    className="glass-card p-7 space-y-6 border border-slate-200/80 shadow-md"
                  >
                    {/* Top Bar: Docket Header & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#1D4A8A]">
                          INCIDENT-{inc.incident_id.toUpperCase()}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-xs text-[#64748B]">
                          {inc.tenant_id}
                        </span>
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            inc.severity === "critical"
                              ? "bg-rose-500/15 text-[#EF4444] border border-rose-300"
                              : "bg-amber-500/15 text-[#F59E0B] border border-amber-300"
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-slate-800 border border-slate-200 shadow-sm">
                          STATUS: {inc.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-800 border border-cyan-300">
                          {inc.correlation_score}% CORRELATED CLUSTER
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-xs font-mono text-[#64748B] flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{new Date(inc.created_at_utc).toLocaleTimeString()} UTC</span>
                        </div>
                        <button
                          onClick={() => toggleRca(inc.incident_id)}
                          className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>{isExpanded ? "Collapse RCA" : "Inspect RCA Dossier"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Incident Title */}
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0F1B33]">
                        {inc.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Affected Source Nodes: {inc.source_nodes.join(", ")}
                      </p>
                    </div>

                    {/* SECTION: PRIMARY PROBABLE CAUSE SPOTLIGHT */}
                    {primaryCause && (
                      <div className="p-5 rounded-2xl bg-[#0B1528] text-white border border-[#1E293B] space-y-4 shadow-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                              PRIMARY PROBABLE ROOT CAUSE
                            </span>
                            <span className="text-xs text-slate-400 font-mono">|</span>
                            <span className="text-xs font-mono text-cyan-400 font-semibold">
                              {rca?.confidence_pct}% Confidence ({rca?.confidence_rating})
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Transparent Multi-Dimensional Score: <strong className="text-white">{primaryCause.composite_score}%</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-slate-400">Suspected Metric</div>
                            <div className="text-sm font-bold font-mono text-[#5EE6F0] truncate">
                              {primaryCause.metric}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Peak: {primaryCause.peak_value} (Base: {primaryCause.baseline_median?.toFixed(1)})
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-slate-400">Source Host / Component</div>
                            <div className="text-sm font-bold font-mono text-white truncate">
                              {primaryCause.source_node}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-mono">
                              Temporal Precedence: {primaryCause.temporal_score * 100}%
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-slate-400">MAD Deviation Magnitude</div>
                            <div className="text-sm font-bold font-mono text-amber-400">
                              +{primaryCause.mad_z_score}σ
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Modified Z-score vs dynamic median
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-slate-400">Topology Depth</div>
                            <div className="text-sm font-bold font-mono text-purple-300">
                              Upstream Root ({primaryCause.topology_score * 100}%)
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Downstream Cascade: {primaryCause.cascade_score * 100}%
                            </div>
                          </div>
                        </div>

                        {/* AI Grounded Summary */}
                        {aiExplanation && (
                          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI-Grounded Hypothesis (Telemetry Verified)</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-mono">
                              {aiExplanation.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EXPANDABLE SECTION: FULL RCA DOSSIER */}
                    {isExpanded && rca && (
                      <div className="space-y-6 pt-2 animate-fadeIn">
                        {/* 1. FACTS VS HYPOTHESIS */}
                        {aiExplanation && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>1. Observed Facts (Grounded Telemetry)</span>
                              </div>
                              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5 font-mono">
                                {aiExplanation.observed_facts.map((fact, fIdx) => (
                                  <li key={fIdx}>{fact}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span>2. Leading Hypothesis (Not Proven Causation)</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-mono">
                                {aiExplanation.leading_hypothesis}
                              </p>
                              <div className="text-[11px] text-slate-400 italic pt-1">
                                * Hypothesis derived from temporal onset precedence and topology graph path. Requires operator verification.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. ALTERNATIVE POSSIBLE CAUSES */}
                        {rca.alternative_causes && rca.alternative_causes.length > 0 && (
                          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-slate-600" />
                                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase">
                                  Alternative Hypotheses Evaluated by Scorer
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">
                                Ranked lower by temporal precedence or dependency depth
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                                    <th className="py-2 px-3">Candidate Metric</th>
                                    <th className="py-2 px-3">Source Node</th>
                                    <th className="py-2 px-3">MAD Z-Score</th>
                                    <th className="py-2 px-3">Candidate Score</th>
                                    <th className="py-2 px-3">Ranking Rationale</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {rca.alternative_causes.map((alt, aIdx) => (
                                    <tr key={aIdx} className="hover:bg-slate-50">
                                      <td className="py-2.5 px-3 font-semibold text-slate-800">{alt.metric}</td>
                                      <td className="py-2.5 px-3 text-slate-600">{alt.source_node}</td>
                                      <td className="py-2.5 px-3 text-amber-600">+{alt.mad_z_score}σ</td>
                                      <td className="py-2.5 px-3 font-bold text-slate-700">{alt.composite_score}%</td>
                                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{alt.rationale}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 3. EVENT CORRELATION & TOPOLOGY SUBGRAPH */}
                        {rca.topology_subgraph && (
                          <div className="p-5 rounded-2xl bg-[#08101E] text-white border border-slate-800 space-y-4 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Network className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
                                  Infrastructure Dependency Graph &amp; Incident Path
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                Directed Graph: Upstream Root &rarr; Downstream Services
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {rca.topology_subgraph.nodes.map((node) => {
                                const isRoot = node.id === primaryCause?.source_node;
                                return (
                                  <div
                                    key={node.id}
                                    className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 transition ${
                                      isRoot
                                        ? "bg-rose-500/10 border-rose-500/50 shadow-inner"
                                        : node.status === "degraded"
                                        ? "bg-amber-500/10 border-amber-500/40"
                                        : "bg-white/5 border-white/10"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                        {node.tier}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                          isRoot
                                            ? "bg-rose-500/30 text-rose-300"
                                            : node.status === "degraded"
                                            ? "bg-amber-500/30 text-amber-300"
                                            : "bg-emerald-500/20 text-emerald-300"
                                        }`}
                                      >
                                        {isRoot ? "SUSPECTED ROOT" : node.status}
                                      </span>
                                    </div>
                                    <div className="font-bold text-white truncate">{node.name}</div>
                                    <div className="text-[11px] text-slate-400">ID: {node.id}</div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Edge labels */}
                            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-300 space-y-1">
                              <span className="text-[10px] uppercase text-slate-500 font-bold block">
                                Dependency Traversal Links
                              </span>
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {rca.topology_subgraph.edges.map((edge, eIdx) => (
                                  <span
                                    key={eIdx}
                                    className="px-2.5 py-1 rounded bg-white/10 border border-white/15 text-[11px]"
                                  >
                                    {edge.from} &rarr; <strong>[{edge.type}]</strong> &rarr; {edge.to}
                                    {edge.latency_ms && ` (${edge.latency_ms}ms)`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. EVIDENCE TIMELINE TABLE */}
                        {rca.evidence_timeline && rca.evidence_timeline.length > 0 && (
                          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-rose-600" />
                                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase">
                                  Supporting Evidence Timeline (Chronological Cascade)
                                </h4>
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">
                                {rca.evidence_timeline.length} Sequenced Signals
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                                    <th className="py-2 px-3">Order / Offset</th>
                                    <th className="py-2 px-3">Component</th>
                                    <th className="py-2 px-3">Metric</th>
                                    <th className="py-2 px-3">Observed Value</th>
                                    <th className="py-2 px-3">MAD Z-Score</th>
                                    <th className="py-2 px-3">Role in Incident</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {rca.evidence_timeline.map((step) => (
                                    <tr key={step.step_order} className="hover:bg-slate-50">
                                      <td className="py-2.5 px-3 font-semibold text-[#1D4A8A]">
                                        #{step.step_order} ({step.time_offset_s})
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-700">{step.source_node}</td>
                                      <td className="py-2.5 px-3 font-semibold text-slate-900">{step.metric}</td>
                                      <td className="py-2.5 px-3 text-slate-800 font-bold">{step.observed_value}</td>
                                      <td className="py-2.5 px-3 text-amber-600">+{step.mad_z_score}σ</td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            step.role.includes("Initial Trigger")
                                              ? "bg-rose-100 text-rose-700 border border-rose-300"
                                              : "bg-slate-100 text-slate-600 border border-slate-200"
                                          }`}
                                        >
                                          {step.role}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 5. RECOMMENDED INVESTIGATION STEPS */}
                        {rca.investigation_steps && (
                          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-cyan-600" />
                              <h4 className="text-xs font-mono font-bold text-slate-800 uppercase">
                                Recommended Actionable Investigation Steps
                              </h4>
                            </div>

                            <ol className="space-y-2 text-xs font-mono text-slate-700 pl-5 list-decimal">
                              {rca.investigation_steps.map((step, sIdx) => (
                                <li key={sIdx} className="leading-relaxed">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Operator Remediation Action Bar */}
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 italic font-mono">
                        Policy Runbook: <strong className="text-slate-700">{inc.remediation_policy}</strong>
                      </div>

                      {confirmingAction === inc.incident_id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-600 font-bold">
                            Confirm execution on {inc.source_nodes.join(", ")}?
                          </span>
                          <button
                            onClick={() => setConfirmingAction(null)}
                            className="px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-mono font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAction(inc.incident_id, "confirm")}
                            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold shadow cursor-pointer"
                          >
                            Authorize &amp; Execute
                          </button>
                        </div>
                      ) : inc.status === "active" ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAction(inc.incident_id, "dismiss")}
                            className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-2 transition cursor-pointer shadow-sm"
                          >
                            <XCircle className="w-4 h-4 text-slate-400" />
                            <span>Dismiss False Positive</span>
                          </button>

                          <button
                            onClick={() => setConfirmingAction(inc.incident_id)}
                            className="px-5 py-2 rounded-full bg-[#1D4A8A] hover:bg-[#163B70] text-xs font-semibold text-white flex items-center gap-2 transition shadow cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Review &amp; Approve Remediation</span>
                          </button>
                        </div>
                      ) : (
                        <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Remediated &amp; Resolved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
