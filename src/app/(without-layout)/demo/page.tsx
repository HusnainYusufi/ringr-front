"use client";

import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3087/api/v1";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

export default function DemoPage() {
  const clientRef = useRef<RetellWebClient | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    clientRef.current = new RetellWebClient();

    const client = clientRef.current;

    client.on("call_started", () => {
      setStatus("active");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    });

    client.on("call_ended", () => {
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    client.on("error", (err) => {
      console.error("Retell error:", err);
      setStatus("error");
      setErrorMsg(typeof err === "string" ? err : "Call failed. Please try again.");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      client.stopCall();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startCall() {
    setStatus("connecting");
    setErrorMsg("");
    setDuration(0);

    try {
      const res = await fetch(`${API}/voice/web-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Could not start call");
      const body = await res.json();
      const accessToken = body.data?.accessToken ?? body.accessToken;

      await clientRef.current!.startCall({
        accessToken,
        sampleRate: 24000,
      });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect");
    }
  }

  function endCall() {
    clientRef.current?.stopCall();
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020d1a]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Ringr</span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
          Live Demo
        </span>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">

          {/* Headline */}
          <h1 className="mb-3 text-4xl font-bold leading-tight text-white">
            Talk to Ringr AI
          </h1>
          <p className="mb-12 text-lg text-white/50">
            Book a vet, dentist, or mechanic appointment by voice — just speak naturally.
          </p>

          {/* Call orb */}
          <div className="mb-10 flex flex-col items-center gap-6">
            <div className="relative">
              {/* Pulse rings when active */}
              {status === "active" && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
                  <div className="absolute inset-[-12px] animate-ping rounded-full bg-primary opacity-10" style={{ animationDelay: "0.3s" }} />
                </>
              )}

              <button
                onClick={status === "active" ? endCall : startCall}
                disabled={status === "connecting"}
                className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 disabled:opacity-60 ${
                  status === "active"
                    ? "bg-red-500 hover:bg-red-600 scale-105"
                    : status === "connecting"
                    ? "bg-primary/60 cursor-wait"
                    : status === "ended"
                    ? "bg-primary/70 hover:bg-primary"
                    : "bg-primary hover:bg-primary/90 hover:scale-105"
                }`}
              >
                {status === "connecting" ? (
                  <svg className="h-10 w-10 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : status === "active" ? (
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                  </svg>
                ) : (
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Status text */}
            <div className="h-8">
              {status === "idle" && (
                <p className="text-white/40">Tap to start a demo call</p>
              )}
              {status === "connecting" && (
                <p className="animate-pulse text-primary">Connecting to AI…</p>
              )}
              {status === "active" && (
                <p className="font-mono text-2xl font-bold text-white">{fmt(duration)}</p>
              )}
              {status === "ended" && (
                <div className="flex flex-col items-center gap-1">
                  <p className="font-semibold text-green-400">Call ended</p>
                  <button onClick={() => setStatus("idle")} className="text-sm text-white/40 hover:text-white/70">
                    Start another call →
                  </button>
                </div>
              )}
              {status === "error" && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm text-red-400">{errorMsg}</p>
                  <button onClick={() => setStatus("idle")} className="text-sm text-white/40 hover:text-white/70">
                    Try again →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conversation hints */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
              Try saying
            </p>
            <ul className="space-y-2">
              {[
                "I need a vet appointment for my dog",
                "Book me a dentist near M5V 3A8",
                "I need my car serviced urgently",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="mt-0.5 text-primary">›</span>
                  <span>&ldquo;{s}&rdquo;</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-white/20">
        © {new Date().getFullYear()} Ringr · AI-powered voice booking
      </footer>
    </div>
  );
}
