"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy, useLocale } from "@/components/chrome/locale-provider";
import { browserRecognizer, createDictation, requestMicrophone, waveAction, type DictationError } from "@/lib/speech-dictation";

type AttachKind = "photo" | "logo" | "reference";

export function MintAsk({
  value,
  onChange,
  preview,
  warning,
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
  warning?: string;
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
  const locale = useLocale();
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const dictation = useRef<ReturnType<typeof createDictation> | null>(null);
  const formRef = useRef(t.form);
  formRef.current = t.form;

  useEffect(() => {
    document.documentElement.dataset.hydrated = "yes";
    dictation.current = createDictation({
      locale,
      getRecognizer: browserRecognizer,
      requestMic: requestMicrophone,
      readText: () => valueRef.current,
      onText: (next) => onChangeRef.current(next),
      onListening: setListening,
      onError: (code) => setMicNote(micMessage(code, formRef.current)),
    });
  }, [locale]);

  useEffect(() => {
    const field = box.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  }, [value]);

  function dictate() {
    setMicNote("");
    void dictation.current?.toggle();
  }

  function onWave() {
    const action = waveAction({ listening, text: value, canSend });
    if (action === "send" || (warning && value.trim() && !listening)) {
      onSend();
      return;
    }
    dictate();
  }

  const chips: { kind: AttachKind; label: string }[] = [
    attached.photo ? { kind: "photo", label: t.form.askPhotoReady } : null,
    attached.logo ? { kind: "logo", label: t.form.askLogoReady } : null,
    attached.reference ? { kind: "reference", label: t.form.askReferenceReady } : null,
  ].filter((item): item is { kind: AttachKind; label: string } => Boolean(item));

  return (
    <div data-mint-ask className="max-w-xl space-y-3">
      <p className="text-sm text-slate-500">{t.form.askLead}</p>
      <div className={`relative flex gap-2 rounded-[28px] bg-[#1C1C1E] px-2 py-2 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] ${value.length > 42 ? "items-end" : "items-center"}`}>
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
          rows={value.trim() ? Math.min(5, Math.max(1, Math.ceil(value.length / 26))) : 1}
          value={value}
          placeholder={t.form.askPlaceholder}
          aria-label={t.form.askPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend || warning) onSend();
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-[#9A9AA3]"
        />
        <button
          type="button"
          aria-label={t.form.askMic}
          data-dictate="mic"
          aria-pressed={listening}
          onClick={dictate}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/10 ${listening ? "text-[#8EB4FF]" : "text-white/90"}`}
        >
          <MicIcon />
        </button>
        <button
          type="button"
          aria-label={t.form.askSend}
          data-dictate="wave"
          aria-pressed={listening}
          onClick={onWave}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#315BFF] text-white ${listening ? "opacity-80" : ""}`}
        >
          <WaveIcon />
        </button>
      </div>
      <p data-dictate-status className={`empty:hidden text-sm ${listening ? "text-[#315BFF]" : "text-slate-500"}`}>
        {listening ? t.form.askListening : micNote}
      </p>
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
      {warning ? <p className="text-sm font-semibold text-[#1E293B]">{warning}</p> : null}
      {preview && !warning ? <p className="text-sm text-slate-600">{preview}</p> : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={confirmMint} onChange={(event) => onConfirmMint(event.target.checked)} />
        {t.form.confirm}
      </label>
      {loading ? <p className="text-sm font-medium text-[#6D28D9]">{t.form.generating}</p> : null}
    </div>
  );
}

function micMessage(
  code: DictationError,
  form: {
    askNoMic: string;
    askMicDenied: string;
    askNoSpeech: string;
    askNoCapture: string;
    askMicNetwork: string;
    askMicError: string;
  },
) {
  if (code === "unavailable") return form.askNoMic;
  if (code === "not-allowed") return form.askMicDenied;
  if (code === "no-speech") return form.askNoSpeech;
  if (code === "audio-capture") return form.askNoCapture;
  if (code === "network") return form.askMicNetwork;
  return form.askMicError;
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
