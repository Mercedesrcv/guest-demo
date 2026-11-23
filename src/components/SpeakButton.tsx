"use client";

import { useRef, useState } from "react";

/**
 * Plays a scripted message with ElevenLabs Text to Speech.
 * If the API is not configured it falls back to the browser's voice,
 * so the demo never breaks.
 */
export function SpeakButton({
  text,
  lang = "es",
  label = "Escuchar",
}: {
  text: string;
  lang?: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [engine, setEngine] = useState<"elevenlabs" | "browser" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function play() {
    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts_unavailable");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      setEngine("elevenlabs");
      setState("playing");
      await audio.play();
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.onend = () => setState("idle");
        setEngine("browser");
        setState("playing");
        window.speechSynthesis.speak(u);
      } else {
        setState("idle");
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={play}
        disabled={state !== "idle"}
        className="inline-flex items-center gap-2 rounded-full border border-teal-700/30 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900 transition hover:bg-teal-100 disabled:opacity-60"
      >
        <span aria-hidden>{state === "playing" ? "🔊" : "▶"}</span>
        {state === "loading" ? "Preparando voz…" : state === "playing" ? "Reproduciendo…" : label}
      </button>
      {engine === "browser" && (
        <span className="text-xs text-slate-500">
          Voz del navegador (configura ElevenLabs para la voz del hotel)
        </span>
      )}
    </div>
  );
}
