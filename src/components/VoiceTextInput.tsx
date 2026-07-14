"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectLanguage, speechLocaleFor } from "@/lib/language";

export function VoiceTextInput({
  value,
  onChange,
  placeholder,
  preferredLanguage = "en",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  preferredLanguage?: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    setSupported(Boolean(SR));
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setDetected(null);
      return;
    }
    const hit = detectLanguage(value);
    setDetected(`${hit.name}`);
  }, [value]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLocaleFor(preferredLanguage);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange(transcript.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
  }, [onChange, preferredLanguage]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder ?? "Type or speak a correction…"}
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-3 pr-14 text-[15px] leading-relaxed text-[var(--ink)] outline-none transition focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--lime)]/35"
        />
        {supported && (
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            className={`btn-bounce absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-2xl ${
              listening
                ? "animate-pulse bg-[var(--citrus)] text-[var(--ink)]"
                : "bg-[var(--forest)] text-white hover:bg-[var(--forest-deep)]"
            }`}
          >
            <MicIcon listening={listening} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>
          {listening
            ? "Listening…"
            : supported
              ? "Voice or text · vernacular OK"
              : "Text input · vernacular OK"}
        </span>
        {detected && (
          <span className="rounded-2xl bg-[var(--mist)] px-2.5 py-1 font-semibold text-[var(--forest-deep)]">
            Detected: {detected}
          </span>
        )}
      </div>
    </div>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {listening ? (
        <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
      ) : (
        <>
          <path
            d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
            fill="currentColor"
          />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
