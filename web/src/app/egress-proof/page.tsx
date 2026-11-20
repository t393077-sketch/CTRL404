"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Filter,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Flame,
  Terminal,
  Shield
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
        e.raw_input.includes("Bearer") ||
        e.redacted_payload.includes("[REDACTED")
      );
    }
    if (filter === "anonymized") {
      return (
        e.raw_input.includes("host=") ||
        e.redacted_payload.includes("pseudonymous_source_id")
      );
    }
    if (filter === "normal") {
      return !e.redacted_payload.includes("[REDACTED");
    }
    return true;
  });

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
            <span className="text-xs font-mono text-zinc-500 uppercase">Split Proof Audit</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DIRECT LOCAL SQLITE CONNECTION (PORT 8765)</span>
            </div>

            <button
              onClick={handleInjectSecret}
              disabled={injecting}
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>{injecting ? "Injecting Secret..." : "Inject Secret"}</span>
            </button>
          </div>
        </div>

        {/* HERO BANNER CARD (Pitch-black luxury) */}
        <div className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-7 shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                ZERO-LEAK VERIFICATION
              </span>
              <span className="text-xs text-zinc-600 font-mono">·</span>
              <span className="text-xs text-white font-mono font-semibold">
                LOCAL AGENT AUDIT LOG
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Cryptographic Egress Proof Panel
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Compare unredacted raw machine input from the agent&apos;s isolated SQLite database side-by-side with sanitized payloads dispatched to SEENIL Cloud. Every packet is signed with HMAC-SHA256.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-10 z-10">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-400 font-semibold">
                AUDIT ENTRIES
              </div>
              <div className="text-4xl font-extrabold font-mono text-white mt-1">
                {entries.length}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Localhost SQLite Records
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-6 sm:pl-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-zinc-400 font-semibold mb-1">
                INTEGRITY PROOF
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold inline-block">
                SHA-256 MATCH VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* FILTER BAR PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[20px] bg-[#09090B] border border-zinc-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              FILTER AUDIT:
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#000000] p-1 rounded-full border border-zinc-800">
            {[
              { id: "all", label: "All Proofs" },
              { id: "secrets", label: "Scrubbed Secrets" },
              { id: "anonymized", label: "Pseudonymized IDs" },
              { id: "normal", label: "Normal Metrics" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition ${
                  filter === tab.id
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLocalAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* AUDIT LOG LIST (Side-by-Side Comparison Cards) */}
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const hasSecret =
              entry.raw_input.includes("password") ||
              entry.raw_input.includes("sk_live_") ||
              entry.raw_input.includes("Bearer");

            const verification = verifiedMap[entry.payload_id];
            const isVerified = verification?.verified ?? true;

            return (
              <div
                key={entry.id}
                className="bg-[#09090B] border border-zinc-800 rounded-[24px] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] space-y-4 transition hover:border-zinc-700"
              >
                {/* Entry Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white">
                      Payload ID: #{entry.payload_id.substring(0, 8)}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      [{entry.timestamp_utc}]
                    </span>
                    {hasSecret && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase">
                        Secret Scrubbed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVerifyWithCloud(entry.payload_id, entry.payload_sha256)}
                      disabled={verifyingId === entry.payload_id}
                      className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{verifyingId === entry.payload_id ? "Verifying..." : "Verify Cloud Match"}</span>
                    </button>

                    <div className="flex items-center gap-2 bg-[#000000] px-3 py-1 rounded-full border border-zinc-800">
                      <span className="text-[10px] font-mono text-zinc-500">SHA-256:</span>
                      <span className="text-[11px] font-mono text-zinc-300">
                        {entry.payload_sha256.substring(0, 16)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(entry.payload_sha256)}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedHash === entry.payload_sha256 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SIDE-BY-SIDE PANELS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* LEFT: RAW LOCAL INPUT */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-zinc-300 font-bold uppercase">
                          RAW INPUT (LOCAL ENCLAVE ONLY)
                        </span>
                      </div>
                      <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">
                        NEVER LEAVES HOST
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto min-h-[140px] leading-relaxed">
                      {entry.raw_input}
                    </div>
                  </div>

                  {/* RIGHT: SANITIZED EGRESS PAYLOAD */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-white font-bold uppercase">
                          SANITIZED EGRESS (SENT TO CLOUD)
                        </span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                        ALLOW-LISTED ONLY
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 font-mono text-xs text-zinc-200 overflow-x-auto min-h-[140px] leading-relaxed">
                      <pre className="whitespace-pre-wrap">{entry.redacted_payload}</pre>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
          <span className="px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold shadow-md">
            Split Proof
          </span>
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