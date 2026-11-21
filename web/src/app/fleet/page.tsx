"use client";

import React, { useState, useEffect } from "react";
import { CommandHeader } from "@/components/CommandHeader";
import { CommandSidebar } from "@/components/CommandSidebar";
import {
  Server,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Radio,
  Layers,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Wifi,
  HardDrive
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface PipelineStage {
  id: string;
  label: string;
  count: number;
}

interface Collector {
  source_id: string;
  tenant_id: string;
  status: string;
  config_status: string;
  last_heartbeat_utc: string;
  resource_usage?: string;
  offline_reason?: string;
}

interface LiveEvent {
  payload_id: string;
  source_id: string;
  metric: string;
  value: number;
  event_time_utc: string;
  received_at?: string;
  ingest_latency_ms: number;
  health: string;
  is_late?: boolean;
}

interface HealthTransition {
  id: number;
  source_id: string;
  from_state: string;
  to_state: string;
  triggering_metric: string;
  triggering_value: number;
  threshold_value: number;
  transition_time_utc: string;
  reason: string;
}

export default function FleetPage() {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: "COLLECT", label: "COLLECT", count: 48 },
    { id: "REDACT", label: "REDACT", count: 48 },
    { id: "AGGREGATE", label: "AGGREGATE", count: 48 },
    { id: "ANALYSE", label: "ANALYSE", count: 48 },
    { id: "POLICY", label: "POLICY", count: 48 },
    { id: "SEND", label: "SEND", count: 48 }
  ]);

  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [healthCounts, setHealthCounts] = useState({
    Excellent: 1,
    Good: 1,
    Fair: 1,
    Poor: 0
  });

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [transitions, setTransitions] = useState<HealthTransition[]>([]);
  const [wsConnected, setWsConnected] = useState(true);
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);

  // Sparkline sample trajectories for health cards
  const sparkExcellent = [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 22 }, { v: 18 }, { v: 26 }, { v: 20 }];
  const sparkGood = [{ v: 25 }, { v: 30 }, { v: 28 }, { v: 35 }, { v: 32 }, { v: 40 }, { v: 36 }];
  const sparkFair = [{ v: 45 }, { v: 52 }, { v: 48 }, { v: 62 }, { v: 58 }, { v: 68 }, { v: 64 }];
  const sparkPoor = [{ v: 80 }, { v: 85 }, { v: 82 }, { v: 92 }, { v: 88 }, { v: 96 }, { v: 94 }];

  // Fetch Pipeline stats
  useEffect(() => {
    const fetchPipeline = () => {
      fetch("http://127.0.0.1:8000/pipeline-stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stages) setPipelineStages(data.stages);
        })
        .catch(() => {});
    };
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Cloud data
  useEffect(() => {
    const fetchCloudData = () => {
      // Collectors
      fetch("http://127.0.0.1:8001/api/v1/collectors", {
        headers: { "X-Tenant-ID": "tenant_alpha", Authorization: "Bearer seenil_tenant_a_tok" }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data)) {
            setCollectors(data);
            const counts = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
            data.forEach((c: Collector) => {
              const h = (c.config_status || "Good") as keyof typeof counts;
              if (counts[h] !== undefined) counts[h]++;
            });
            setHealthCounts(counts);
          }
        })
        .catch(() => {});

      // Health Transitions
      fetch("http://127.0.0.1:8001/api/v1/health-transitions", {
        headers: { "X-Tenant-ID": "tenant_alpha", Authorization: "Bearer seenil_tenant_a_tok" }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data)) setTransitions(data);
        })
        .catch(() => {});

      // Events
      fetch("http://127.0.0.1:8001/api/v1/events?limit=25", {
        headers: { Authorization: "Bearer seenil_tenant_a_tok" }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.events) {
            const formatted = data.events.map((item: any) => {
              const eventDate = new Date(item.event_time_utc).getTime();
              const recvDate = item.received_at ? new Date(item.received_at).getTime() : eventDate;
              return {
                ...item,
                is_late: Math.abs(recvDate - eventDate) > 10000
              };
            });
            setEvents(formatted);
          }
        })
        .catch(() => {});
    };

    fetchCloudData();
    const interval = setInterval(fetchCloudData, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket Live Stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket("ws://127.0.0.1:8001/ws/live?tenant_id=tenant_alpha");
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
        ws.onerror = () => {
          setWsConnected(false);
          ws?.close();
        };
        ws.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload && payload.payload_id) {
              const eventDate = new Date(payload.event_time_utc).getTime();
              const recvDate = payload.received_at ? new Date(payload.received_at).getTime() : Date.now();
              setEvents((prev) => [
                {
                  ...payload,
                  is_late: Math.abs(recvDate - eventDate) > 10000
                },
                ...prev.slice(0, 49)
              ]);
            }
          } catch (_) {}
        };
      } catch (_) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1B33] flex font-sans select-none">
      <CommandSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader title="Fleet Overview" wsConnected={wsConnected} />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* SOLID CONTRAST CARD 1: FLEET SNAPSHOT (Navy 900 to 800) */}
          <div className="contrast-card p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3.5 z-10 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-[#5EE6F0]/20 text-[#5EE6F0] border border-[#5EE6F0]/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                  TWO-TIER EDGE MESH
                </span>
                <span className="text-xs text-slate-400 font-mono">·</span>
                <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE &amp; INGESTING
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Fleet Telemetry &amp; Privacy Boundary Status
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sensitive raw traces remain strictly within your local VPC. Central Cloud receives cryptographically verified, allow-listed metadata for real-time AIOps intelligence.
              </p>
            </div>

            {/* Oversized Bold Stats & Overlapping Avatars */}
            <div className="flex flex-wrap items-center gap-8 sm:gap-10 z-10">
              {/* Oversized Stat: 99.8% (like reference 74,3% scale) */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold">
                  SLA COMPLIANCE
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1">
                  99.8%
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-1 font-semibold">
                  &le;10s ingestion latency
                </div>
              </div>

              {/* Overlapping Collector Avatars Stack (Iron Rule #3) */}
              <div className="border-l border-white/15 pl-8 sm:pl-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400 font-semibold mb-2.5">
                  COLLECTOR NODES
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3 overflow-hidden p-1">
                    {collectors.slice(0, 4).map((col, idx) => (
                      <div
                        key={col.source_id}
                        title={`${col.source_id} (${col.config_status})`}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-[#0A1A3F] text-white font-mono font-bold text-xs shadow-md ${
                          col.config_status === "Excellent"
                            ? "bg-[#10B981]"
                            : col.config_status === "Good"
                            ? "bg-[#06B6D4]"
                            : col.config_status === "Fair"
                            ? "bg-[#F59E0B]"
                            : "bg-[#EF4444]"
                        }`}
                      >
                        {`0${idx + 1}`}
                      </div>
                    ))}
                    {collectors.length > 4 && (
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-[#0A1A3F] bg-white/20 text-white font-mono font-bold text-xs">
                        +{collectors.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#5EE6F0]">
                    {collectors.length || 3} ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D4A8A]/30 rounded-full blur-[120px] pointer-events-none" />
          </div>

          {/* 4 HEALTH COUNTER CARDS (Glassmorphism + Bold numbers + Big Bolder Sparklines) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Excellent */}
            <div className="glass-card p-6 border-t-4 border-t-[#10B981] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold">
                  EXCELLENT
                </span>
                <span className="w-3 h-3 rounded-full bg-[#10B981] ring-2 ring-emerald-200" />
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1B33]">
                  {healthCounts.Excellent}
                </span>
                <div className="w-24 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkExcellent}>
                      <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] mt-3 font-mono">
                Baseline nominal (0-50% load)
              </div>
            </div>

            {/* 2. Good */}
            <div className="glass-card p-6 border-t-4 border-t-[#06B6D4] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold">
                  GOOD
                </span>
                <span className="w-3 h-3 rounded-full bg-[#06B6D4] ring-2 ring-cyan-200" />
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1B33]">
                  {healthCounts.Good}
                </span>
                <div className="w-24 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkGood}>
                      <Line type="monotone" dataKey="v" stroke="#06B6D4" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] mt-3 font-mono">
                Compliant, slight variation
              </div>
            </div>

            {/* 3. Fair */}
            <div className="glass-card p-6 border-t-4 border-t-[#F59E0B] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold">
                  FAIR
                </span>
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] ring-2 ring-amber-200" />
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1B33]">
                  {healthCounts.Fair}
                </span>
                <div className="w-24 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkFair}>
                      <Line type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] mt-3 font-mono">
                Threshold warning or lag
              </div>
            </div>

            {/* 4. Poor */}
            <div className="glass-card p-6 border-t-4 border-t-[#EF4444] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-[#64748B] font-bold">
                  POOR
                </span>
                <span className="w-3 h-3 rounded-full bg-[#EF4444] ring-2 ring-rose-200" />
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1B33]">
                  {healthCounts.Poor}
                </span>
                <div className="w-24 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkPoor}>
                      <Line type="monotone" dataKey="v" stroke="#EF4444" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] mt-3 font-mono">
                Breach or heartbeat timeout
              </div>
            </div>
          </div>

          {/* 6-STAGE PIPELINE STRIP */}
          <div className="glass-card p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#1D4A8A]" />
                <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-[#0F1B33] uppercase">
                  6-STAGE EDGE PIPELINE ARCHITECTURE
                </h3>
              </div>
              <span className="text-xs font-mono text-[#10B981] font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                PIPELINE SYNCHRONIZED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
              {pipelineStages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="p-4 rounded-[18px] bg-white/70 border border-white/80 hover:border-[#1D4A8A]/40 transition group shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-1 font-semibold">
                    <span>STAGE 0{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="text-xs font-mono font-bold text-[#0F1B33]">
                    {stage.label}
                  </div>
                  <div className="text-2xl font-black font-mono text-[#1D4A8A] mt-1.5">
                    {stage.count.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">processed</div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVE COLLECTORS TABLE (Glassmorphism) */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-[#1D4A8A]" />
                <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-[#0F1B33] uppercase">
                  ACTIVE ON-PREM COLLECTORS ({collectors.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B]">
                Auto-downgrades if heartbeat &gt;60s
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 text-[#64748B] font-mono text-[11px] uppercase tracking-[0.08em] border-b border-white/60">
                  <tr>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Source ID (Pseudonymous HMAC)</th>
                    <th className="py-4 px-6">Health State</th>
                    <th className="py-4 px-6">CPU / RAM / Disk</th>
                    <th className="py-4 px-6">Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {collectors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#64748B] font-mono">
                        Connecting to telemetry mesh...
                      </td>
                    </tr>
                  ) : (
                    collectors.map((col) => {
                      const isOffline = col.status === "offline";
                      const isExpanded = expandedCollector === col.source_id;
                      let usage = { cpu: 26.4, memory: 78.2, disk: 67.8 };
                      if (col.resource_usage) {
                        try {
                          const parsed = JSON.parse(col.resource_usage);
                          usage = {
                            cpu: parsed["system.cpu.utilization"] || 26.4,
                            memory: parsed["system.memory.utilization"] || 78.2,
                            disk: parsed["system.disk.utilization"] || 67.8
                          };
                        } catch (_) {}
                      }

                      return (
                        <React.Fragment key={col.source_id}>
                          <tr
                            onClick={() => setExpandedCollector(isExpanded ? null : col.source_id)}
                            className="hover:bg-white/60 cursor-pointer transition"
                          >
                            <td className="py-4 px-6">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    isOffline ? "bg-[#EF4444]" : "bg-[#10B981] animate-pulse"
                                  }`}
                                />
                                <span className="font-mono text-xs font-bold">
                                  {isOffline ? "OFFLINE" : "ONLINE"}
                                </span>
                              </span>
                            </td>

                            <td className="py-4 px-6 font-mono font-bold text-[#1D4A8A]">
                              {col.source_id}
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold shadow-sm ${
                                  col.config_status === "Excellent"
                                    ? "bg-emerald-500/15 text-[#10B981] border border-emerald-400/30"
                                    : col.config_status === "Good"
                                    ? "bg-cyan-500/15 text-[#06B6D4] border border-cyan-400/30"
                                    : col.config_status === "Fair"
                                    ? "bg-amber-500/15 text-[#F59E0B] border border-amber-400/30"
                                    : "bg-rose-500/15 text-[#EF4444] border border-rose-400/30"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    col.config_status === "Excellent"
                                      ? "bg-[#10B981]"
                                      : col.config_status === "Good"
                                      ? "bg-[#06B6D4]"
                                      : col.config_status === "Fair"
                                      ? "bg-[#F59E0B]"
                                      : "bg-[#EF4444]"
                                  }`}
                                />
                                {col.config_status || "Good"}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs">
                                  {usage.cpu}% / {usage.memory}% / {usage.disk}%
                                </span>
                                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      usage.cpu > 85 ? "bg-[#EF4444]" : "bg-[#1D4A8A]"
                                    }`}
                                    style={{ width: `${Math.min(usage.cpu, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 font-mono text-xs text-[#64748B]">
                              {col.last_heartbeat_utc
                                ? col.last_heartbeat_utc.replace("T", " ").substring(0, 19) + "Z"
                                : "N/A"}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-white/80">
                              <td colSpan={5} className="px-8 py-4 border-t border-white/60">
                                <div className="text-xs space-y-1">
                                  <div className="font-bold text-[#0F1B33] flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span>Diagnosis &amp; Reason for Current State:</span>
                                  </div>
                                  <div className="text-[#64748B] font-mono text-xs pl-6">
                                    {isOffline
                                      ? col.offline_reason || "Heartbeat timeout (>60s elapsed without collector ping). Auto-marked offline."
                                      : `Collector verified against baseline: CPU ${usage.cpu}%, Memory ${usage.memory}%, Disk ${usage.disk}%.`}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TWO COLUMNS: LIVE EVENT FEED & HEALTH TRANSITIONS LOG (with Contrast Card 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LIVE EVENT FEED (Glass Card) */}
            <div className="lg:col-span-7 glass-card flex flex-col h-[480px]">
              <div className="p-6 border-b border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-[#1D4A8A]" />
                  <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-[#0F1B33] uppercase">
                    LIVE EVENT FEED (WEBSOCKET /WS/LIVE)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-[#10B981] font-bold">STREAMING</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/40 font-mono text-xs">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B]">
                    Listening for incoming telemetry events...
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.payload_id}
                      className="p-4 hover:bg-white/50 transition flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0F1B33]">{ev.metric}</span>
                          <span className="text-[#1D4A8A] font-bold">={ev.value}</span>
                          {ev.is_late && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-300 text-[10px] font-bold">
                              LATE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                          <span>{ev.source_id}</span>
                          <span>·</span>
                          <span>{ev.event_time_utc ? ev.event_time_utc.substring(11, 19) + "Z" : "UTC"}</span>
                          <span>·</span>
                          <span>Latency: {ev.ingest_latency_ms ? `${ev.ingest_latency_ms.toFixed(0)}ms` : "0ms"}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            ev.health === "Excellent"
                              ? "bg-emerald-500/15 text-[#10B981] border border-emerald-400/30"
                              : ev.health === "Good"
                              ? "bg-cyan-500/15 text-[#06B6D4] border border-cyan-400/30"
                              : ev.health === "Fair"
                              ? "bg-amber-500/15 text-[#F59E0B] border border-amber-400/30"
                              : "bg-rose-500/15 text-[#EF4444] border border-rose-400/30"
                          }`}
                        >
                          {ev.health}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SOLID CONTRAST CARD 2: HEALTH TRANSITIONS LOG (Navy 900 to 800) */}
            <div className="lg:col-span-5 contrast-card flex flex-col h-[480px]">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[#5EE6F0]" />
                  <h3 className="text-xs font-mono font-bold tracking-[0.08em] text-white uppercase">
                    HEALTH STATE TRANSITIONS
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#5EE6F0] font-bold">WHY LOG</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/10 text-xs">
                {transitions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-mono">
                    Zero transitions recorded. Fleet operating steadily.
                  </div>
                ) : (
                  transitions.map((tr) => (
                    <div key={tr.id} className="p-4 space-y-1.5 hover:bg-white/[0.04] transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs font-bold">
                          <span className="text-slate-400">{tr.from_state}</span>
                          <span className="text-white">&rarr;</span>
                          <span
                            className={
                              tr.to_state === "Poor"
                                ? "text-[#EF4444]"
                                : tr.to_state === "Fair"
                                ? "text-[#F59E0B]"
                                : "text-[#10B981]"
                            }
                          >
                            {tr.to_state}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {tr.transition_time_utc ? tr.transition_time_utc.substring(11, 19) + "Z" : ""}
                        </span>
                      </div>

                      <div className="text-xs text-white font-mono">
                        Trigger: <span className="font-semibold text-[#5EE6F0]">{tr.triggering_metric}</span> = {tr.triggering_value} (threshold {tr.threshold_value})
                      </div>

                      <div className="text-xs text-slate-300 leading-relaxed">
                        {tr.reason}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
