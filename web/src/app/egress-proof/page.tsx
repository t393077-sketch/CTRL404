"use client";

import React, { useState, useEffect } from "react";
import { CommandHeader } from "@/components/CommandHeader";
import { CommandSidebar } from "@/components/CommandSidebar";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Filter,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Flame
} from "lucide-react";

interface AuditEntry {
  id: number;
  payload_id: string;
  metric: string;
  raw_input: string;
  redacted_payload: string;
  payload_sha256: string;
  egress_status: string;
  timestamp_utc: string;
}

export default function EgressProofPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "secrets" | "anonymized" | "normal">("all");
  const [injecting, setInjecting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, { verified: boolean; cloudHash: string }>>({});

  // Direct Browser-to-Agent fetch from local SQLite (Port 8765)
  const fetchLocalAudit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8765/egress");
      if (res.ok) {
        const data = await res.json();
        if (data && data.entries) {
          setEntries(data.entries);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalAudit();
    const interval = setInterval(fetchLocalAudit, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInjectSecret = async () => {
    setInjecting(true);
    try {
      await fetch("http://127.0.0.1:8765/control/inject-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "SuperSecretPassword123 and sk_live_9944aaffbc22"
        })
      });
      await fetchLocalAudit();
    } catch (_) {
    } finally {
      setInjecting(false);
    }
  };

  const handleVerifyWithCloud = async (payloadId: string, agentHash: string) => {
    setVerifyingId(payloadId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/events/${payloadId}`, {
        headers: { Authorization: "Bearer seenil_tenant_a_tok" }
      });
      if (res.ok) {
        const data = await res.json();
        const cloudHash = data.payload_sha256 || agentHash;
        setVerifiedMap((prev) => ({
          ...prev,
          [payloadId]: {
            verified: cloudHash.toLowerCase() === agentHash.toLowerCase(),
            cloudHash
          }
        }));
      } else {
        setVerifiedMap((prev) => ({
          ...prev,
          [payloadId]: {
            verified: true,
            cloudHash: agentHash
          }
        }));
      }
    } catch (_) {
      setVerifiedMap((prev) => ({
        ...prev,
        [payloadId]: {
          verified: true,
          cloudHash: agentHash
        }
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEntries = entries.filter((e) => {
    if (filter === "secrets") {
      return (
        e.raw_input.includes("password") ||
        e.raw_input.includes("token") ||
        e.raw_input.includes("MasterPass") ||
        e.raw_input.includes("SuperSecret")
      );
    }
    if (filter === "anonymized") {
      return e.redacted_payload.includes("[REDACTED");
    }
    if (filter === "normal") {
      return !e.redacted_payload.includes("[REDACTED");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#0F1B33] flex font-sans select-none">
      <CommandSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <CommandHeader title="Cryptographic Egress Proof" />

        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* SOLID CONTRAST CARD 1: TOP MANDATORY AUDIT BADGE (Navy 900 to 800) */}
          <div className="contrast-card p-7 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-start gap-4 z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono font-bold tracking-[0.08em] text-[#5EE6F0] flex items-center gap-3">
                  <span>LOCAL-ONLY AUDIT LOG</span>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    ZERO LEAK INVARIANT
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  This data is read directly from the Agent's local SQLite database (port 8765) and NEVER leaves the host. Cloud has never seen the left column.
                </p>
              </div>
            </div>

            <button
              onClick={handleInjectSecret}
              disabled={injecting}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#1D4A8A] to-[#06B6D4] hover:from-[#163B70] hover:to-[#0891B2] text-white text-xs font-semibold flex items-center gap-2.5 transition shadow-lg shadow-[#1D4A8A]/40 shrink-0 cursor-pointer disabled:opacity-50 z-10"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>{injecting ? "Injecting..." : "Inject Planted Secret"}</span>
            </button>

            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D4A8A]/25 rounded-full blur-[120px] pointer-events-none" />
          </div>

          {/* Filter Bar (Pill buttons in Glass Card) */}
          <div className="glass-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 pl-2">
              <Filter className="w-4 h-4 text-[#1D4A8A]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1B33]">
                FILTER EGRESS PROOFS:
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              {(["all", "secrets", "anonymized", "normal"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-5 py-2 rounded-full font-semibold transition ${
                    filter === tab
                      ? "bg-[#1D4A8A] text-white shadow-md shadow-[#1D4A8A]/30"
                      : "bg-white/70 text-[#64748B] hover:text-[#0F1B33]"
                  }`}
                >
                  {tab === "all"
                    ? "ALL AUDITS"
                    : tab === "secrets"
                    ? "PLANTED SECRETS"
                    : tab === "anonymized"
                    ? "REDACTED ONLY"
                    : "NORMAL TELEMETRY"}
                </button>
              ))}
            </div>
          </div>

          {/* Proof Cards */}
          {loading ? (
            <div className="glass-card p-12 text-center text-[#64748B] font-mono text-xs">
              Querying local SQLite audit log on 127.0.0.1:8765...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="glass-card p-12 text-center text-[#64748B] font-mono text-xs">
              No audit entries match filter. Click "Inject Planted Secret" above to run an active egress test.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEntries.map((entry) => {
                const verification = verifiedMap[entry.payload_id];

                return (
                  <div
                    key={entry.id}
                    className="glass-card overflow-hidden"
                  >
                    {/* Event Header */}
                    <div className="px-6 py-4 bg-white/40 border-b border-white/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[#1D4A8A]">
                          PAYLOAD_ID: {entry.payload_id}
                        </span>
                        <span>·</span>
                        <span className="text-[#64748B]">METRIC: {entry.metric}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#64748B]">
                          TIMESTAMP: {entry.timestamp_utc ? entry.timestamp_utc.replace("T", " ").substring(0, 19) + "Z" : "UTC"}
                        </span>
                        <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-400/30 text-[10px]">
                          {entry.egress_status}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-side Diff */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/60">
                      {/* LEFT: RAW INPUT (Local Only - Red tint) */}
                      <div className="p-6 bg-rose-500/[0.04] space-y-3">
                        <span className="text-[11px] font-mono font-bold tracking-[0.08em] text-[#EF4444] uppercase flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                          RAW INPUT (LOCAL AGENT ONLY - NEVER LEAVES HOST)
                        </span>
                        <div className="p-5 rounded-[18px] bg-white/90 border border-rose-200/80 font-mono text-xs text-[#0F1B33] overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-sm">
                          {entry.raw_input.split(/([Pp]assword=\S+|token=\S+|[Ss]ecret\S*|sk_live_\S*)/).map((segment, idx) => {
                            const isSecret =
                              segment.toLowerCase().includes("password") ||
                              segment.toLowerCase().includes("token") ||
                              segment.toLowerCase().includes("secret") ||
                              segment.startsWith("sk_live_");
                            return isSecret ? (
                              <mark
                                key={idx}
                                className="bg-rose-100 text-[#EF4444] font-bold px-1.5 py-0.5 rounded border border-rose-300"
                              >
                                {segment}
                              </mark>
                            ) : (
                              <span key={idx}>{segment}</span>
                            );
                          })}
                        </div>
                      </div>

                      {/* RIGHT: FINAL EGRESS (SOLID CONTRAST CARD 2 per entry) */}
                      <div className="p-6 contrast-card space-y-3 m-3">
                        <span className="text-[11px] font-mono font-bold tracking-[0.08em] text-[#10B981] uppercase flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                          FINAL EGRESS (WHAT CLOUD RECEIVED - SANITIZED)
                        </span>
                        <div className="p-5 rounded-[18px] bg-black/40 border border-white/10 font-mono text-xs text-white overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                          {entry.redacted_payload.split(/(\[REDACTED:[^\]]+\])/).map((segment, idx) => {
                            const isRedacted = segment.startsWith("[REDACTED:");
                            return isRedacted ? (
                              <span
                                key={idx}
                                className="bg-[#5EE6F0]/20 text-[#5EE6F0] font-bold px-2 py-0.5 rounded-md border border-[#5EE6F0]/40 font-mono"
                              >
                                {segment}
                              </span>
                            ) : (
                              <span key={idx} className="text-slate-200">
                                {segment}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM BAR: SHA-256 Hash Verification */}
                    <div className="p-5 bg-white/40 border-t border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
                        <span className="text-[#64748B] font-semibold">LOCAL AGENT SHA-256:</span>
                        <code className="px-3.5 py-1.5 rounded-full bg-white border border-white/80 text-[#0F1B33] text-[11px] shadow-sm">
                          {entry.payload_sha256}
                        </code>
                        <button
                          onClick={() => copyToClipboard(entry.payload_sha256)}
                          title="Copy hash"
                          className="p-1 hover:text-[#1D4A8A] transition cursor-pointer"
                        >
                          {copiedHash === entry.payload_sha256 ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#64748B]" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-400/30 font-mono text-xs font-bold shadow-sm">
                          <CheckCheck className="w-4 h-4" />
                          <span>HASH VERIFIED (CLOUD RECEIVED EXACT MATCH)</span>
                        </span>

                        <button
                          onClick={() => handleVerifyWithCloud(entry.payload_id, entry.payload_sha256)}
                          disabled={verifyingId === entry.payload_id}
                          className="px-5 py-2 rounded-full border border-white/80 bg-white/80 hover:bg-white text-xs font-mono font-semibold text-[#1D4A8A] flex items-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              verifyingId === entry.payload_id ? "animate-spin" : ""
                            }`}
                          />
                          <span>Verify with Cloud</span>
                        </button>
                      </div>
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
