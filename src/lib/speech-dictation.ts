export type DictationError = "unavailable" | "not-allowed" | "no-speech" | "audio-capture" | "network" | "unknown";

export type SpeechResult = ArrayLike<{ transcript: string }> & { isFinal?: boolean };

export type SpeechRecognizer = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function mergeTranscript(current: string, heard: string) {
  const next = heard.replace(/\s+/g, " ").trim();
  if (!next) return current;
  const base = current.trim();
  return base ? `${base} ${next}` : next;
}

export function waveAction(state: { listening: boolean; text: string; canSend: boolean }) {
  if (state.listening) return "stop" as const;
  if (!state.text.trim() || !state.canSend) return "dictate" as const;
  return "send" as const;
}

export function browserRecognizer(): SpeechRecognizer | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRecognizer;
    webkitSpeechRecognition?: new () => SpeechRecognizer;
  };
  const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export async function requestMicrophone() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Microphone unavailable", "NotFoundError");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of stream.getTracks()) track.stop();
}

export function createDictation(options: {
  locale: "fr" | "en";
  getRecognizer: () => SpeechRecognizer | null;
  requestMic: () => Promise<void>;
  readText: () => string;
  onText: (value: string) => void;
  onListening: (value: boolean) => void;
  onError: (code: DictationError) => void;
}) {
  let session: SpeechRecognizer | null = null;
  let listening = false;

  function finish() {
    listening = false;
    options.onListening(false);
  }

  return {
    get listening() {
      return listening;
    },
    async toggle() {
      if (listening) {
        session?.stop();
        finish();
        return;
      }
      const next = options.getRecognizer();
      if (!next) {
        options.onError("unavailable");
        finish();
        return;
      }
      try {
        await options.requestMic();
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        options.onError(name === "NotFoundError" || name === "NotReadableError" ? "audio-capture" : "not-allowed");
        finish();
        return;
      }
      const base = options.readText().trim();
      session = next;
      session.lang = options.locale === "en" ? "en-US" : "fr-FR";
      session.interimResults = true;
      session.continuous = false;
      session.onresult = (event) => {
        let spoken = "";
        for (let index = 0; index < event.results.length; index += 1) {
          spoken += `${event.results[index]?.[0]?.transcript ?? ""} `;
        }
        options.onText(mergeTranscript(base, spoken));
      };
      session.onerror = (event) => {
        const code = event.error;
        if (code === "not-allowed" || code === "service-not-allowed") options.onError("not-allowed");
        else if (code === "audio-capture") options.onError("audio-capture");
        else if (code === "network") options.onError("network");
        else if (code === "no-speech") options.onError("no-speech");
        else if (code !== "aborted") options.onError("unknown");
        finish();
      };
      session.onend = () => finish();
      listening = true;
      options.onListening(true);
      session.start();
    },
  };
}
