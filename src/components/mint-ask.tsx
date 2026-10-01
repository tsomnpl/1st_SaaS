"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/components/chrome/locale-provider";

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognizer = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type AttachKind = "photo" | "logo" | "reference";

export function MintAsk({
  value,
  onChange,
  preview,
  attached,
  canReference,
  confirmMint,
  onConfirmMint,
  loading,
  canSend,
  onSend,
  onAttach,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  preview: string;
  attached: { photo: boolean; logo: boolean; reference: boolean };
  canReference: boolean;
  confirmMint: boolean;
  onConfirmMint: (value: boolean) => void;
  loading: boolean;
  canSend: boolean;
  onSend: () => void;
  onAttach: (kind: AttachKind, file?: File) => void;
  onClear: (kind: AttachKind) => void;
}) {
  const t = useCopy();
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<SpeechRecognizer | null>(null);

  useEffect(() => {
    const field = box.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  }, [value]);

  function dictate() {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    const host = window as Window & {
      SpeechRecognition?: new () => SpeechRecognizer;
      webkitSpeechRecognition?: new () => SpeechRecognizer;
    };
    const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
    if (!Ctor) {
      setMicNote(t.form.askNoMic);
      return;
    }
    const session = new Ctor();
    session.lang = document.documentElement.lang === "en" ? "en-US" : "fr-FR";
    session.interimResults = false;
    session.onresult = (event) => {
      const heard = event.results[event.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      if (!heard) return;
      onChange(value ? `${value.trim()} ${heard}` : heard);
    };
    session.onerror = () => setListening(false);
    session.onend = () => setListening(false);
    recognition.current = session;
    setMicNote("");
    setListening(true);
    session.start();
  }

  const chips: { kind: AttachKind; label: string }[] = [
    attached.photo ? { kind: "photo", label: t.form.askPhotoReady } : null,
    attached.logo ? { kind: "logo", label: t.form.askLogoReady } : null,
    attached.reference ? { kind: "reference", label: t.form.askReferenceReady } : null,
  ].filter((item): item is { kind: AttachKind; label: string } => Boolean(item));

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{t.form.askLead}</p>
      <div className="relative flex items-end gap-2 rounded-full bg-[#1C1C1E] px-2 py-2 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          aria-label={t.form.askAttach}
          aria-expanded={menu}
          onClick={() => setMenu((open) => !open)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/90 hover:bg-white/10"
        >
          <PlusIcon />
        </button>
        {menu ? (
          <div className="absolute bottom-16 left-2 z-20 w-44 rounded-2xl border border-white/10 bg-[#2A2A2E] p-1 text-sm shadow-xl">
            <AttachChoice label={t.form.askPhoto} onFile={(file) => onAttach("photo", file)} onDone={() => setMenu(false)} />
            <AttachChoice label={t.form.askLogo} onFile={(file) => onAttach("logo", file)} onDone={() => setMenu(false)} />
            {canReference ? (
              <AttachChoice
                label={t.form.askReference}
                onFile={(file) => onAttach("reference", file)}
                onDone={() => setMenu(false)}
              />
            ) : null}
          </div>
        ) : null}
        <textarea
          ref={box}
          rows={1}
          value={value}
          placeholder={t.form.askPlaceholder}
          aria-label={t.form.askPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-[#9A9AA3]"
        />
        <button
          type="button"
          aria-label={t.form.askMic}
          aria-pressed={listening}
          onClick={dictate}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10 ${listening ? "text-[#8EB4FF]" : "text-white/90"}`}
        >
          <MicIcon />
        </button>
        <button
          type="button"
          aria-label={t.form.askSend}
          disabled={!canSend}
          onClick={onSend}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#315BFF] text-white disabled:opacity-40"
        >
          <WaveIcon />
        </button>
      </div>
      {listening ? <p className="text-sm text-[#315BFF]">{t.form.askListening}</p> : null}
      {micNote ? <p className="text-sm text-slate-500">{micNote}</p> : null}
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.kind}
              type="button"
              onClick={() => onClear(chip.kind)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {chip.label} ×
            </button>
          ))}
        </div>
      ) : null}
      {preview ? <p className="text-sm text-slate-600">{preview}</p> : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={confirmMint} onChange={(event) => onConfirmMint(event.target.checked)} />
        {t.form.confirm}
      </label>
      {loading ? <p className="text-sm font-medium text-[#6D28D9]">{t.form.generating}</p> : null}
    </div>
  );
}

function AttachChoice({
  label,
  onFile,
  onDone,
}: {
  label: string;
  onFile: (file?: File) => void;
  onDone: () => void;
}) {
  return (
    <label className="block cursor-pointer rounded-xl px-3 py-2 font-medium hover:bg-white/10">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          onDone();
        }}
      />
    </label>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="7" width="3.2" height="10" rx="1.6" />
      <rect x="14.8" y="5" width="3.2" height="14" rx="1.6" />
    </svg>
  );
}
