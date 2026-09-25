"use client";

import { useEffect, useRef, useState } from "react";

export const LANDING_AUDIO_SRC = "/audio/landing.mp3";
const PREF_KEY = "flyermint:landing-audio";

type Pref = { volume: number; muted: boolean };

// Landing ambience only: never autoplays, never part of creation media or poster exports.
export function LandingAudio({ src = LANDING_AUDIO_SRC }: { src?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (cancelled || !response.ok || !(response.headers.get("content-type") ?? "").startsWith("audio/")) return;
        let pref: Partial<Pref> = {};
        try {
          pref = JSON.parse(window.localStorage.getItem(PREF_KEY) ?? "{}") as Partial<Pref>;
        } catch {
          pref = {};
        }
        if (typeof pref.volume === "number") setVolume(Math.min(1, Math.max(0, pref.volume)));
        if (typeof pref.muted === "boolean") setMuted(pref.muted);
        setAvailable(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted, available]);

  function savePref(next: Pref) {
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      // Preference is optional.
    }
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  if (!available) return null;

  const on = playing && !muted;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 p-1.5 pr-3 text-xs shadow-lg backdrop-blur">
      <audio ref={audioRef} src={src} loop preload="none" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mettre la musique en pause" : "Lancer la musique"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6D28D9] text-white"
      >
        <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="landing-audio-controls"
        className="font-semibold text-slate-700"
      >
        <span role="status" aria-live="polite">
          {on ? "🔊 Musique activée" : "🔇 Son désactivé"}
        </span>
      </button>
      {open ? (
        <div id="landing-audio-controls" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              savePref({ volume, muted: next });
            }}
            aria-pressed={muted}
            className="rounded-full border border-slate-200 px-2 py-1 text-slate-600"
          >
            {muted ? "Réactiver" : "Muet"}
          </button>
          <label className="flex items-center gap-1 text-slate-500">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => {
                const next = Number(event.target.value);
                setVolume(next);
                savePref({ volume: next, muted });
              }}
              className="w-20 accent-[#6D28D9] sm:w-28"
              aria-label="Volume de la musique"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
