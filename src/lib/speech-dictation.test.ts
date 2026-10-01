import { describe, expect, it } from "vitest";
import { createDictation, mergeTranscript, waveAction, type SpeechRecognizer } from "@/lib/speech-dictation";

function fakeRecognizer() {
  const session: SpeechRecognizer & { emit: (text: string, isFinal?: boolean) => void; started: boolean } = {
    lang: "",
    interimResults: false,
    continuous: false,
    onresult: null,
    onerror: null,
    onend: null,
    started: false,
    start() {
      this.started = true;
    },
    stop() {
      this.onend?.();
    },
    emit(text: string, isFinal = true) {
      const result = Object.assign([{ transcript: text }], { isFinal });
      this.onresult?.({ results: [result] });
    },
  };
  return session;
}

describe("speech dictation", () => {
  it("appends a heard sentence without doubling spaces", () => {
    expect(mergeTranscript("", "  affiche anniversaire  ")).toBe("affiche anniversaire");
    expect(mergeTranscript("Promo robes", "à Cotonou")).toBe("Promo robes à Cotonou");
    expect(mergeTranscript("Déjà là", "   ")).toBe("Déjà là");
  });

  it("uses the wave button to dictate, stop, or send", () => {
    expect(waveAction({ listening: false, text: "", canSend: false })).toBe("dictate");
    expect(waveAction({ listening: true, text: "salut", canSend: true })).toBe("stop");
    expect(waveAction({ listening: false, text: "salut", canSend: true })).toBe("send");
    expect(waveAction({ listening: false, text: "salut", canSend: false })).toBe("dictate");
  });

  it("writes the transcript into the field after the microphone is allowed", async () => {
    const session = fakeRecognizer();
    const seen: string[] = [];
    let listening = false;
    let error = "";
    const dictation = createDictation({
      locale: "fr",
      getRecognizer: () => session,
      requestMic: async () => {},
      readText: () => "Affiche",
      onText: (value) => seen.push(value),
      onListening: (value) => {
        listening = value;
      },
      onError: (code) => {
        error = code;
      },
    });
    await dictation.toggle();
    expect(session.started).toBe(true);
    expect(session.lang).toBe("fr-FR");
    expect(session.interimResults).toBe(true);
    expect(listening).toBe(true);
    session.emit("anniversaire de Awa");
    expect(seen).toEqual(["Affiche anniversaire de Awa"]);
    expect(error).toBe("");
    session.stop();
    expect(listening).toBe(false);
  });

  it("explains a missing recognizer and a refused microphone", async () => {
    const errors: string[] = [];
    const missing = createDictation({
      locale: "en",
      getRecognizer: () => null,
      requestMic: async () => {},
      readText: () => "",
      onText: () => {},
      onListening: () => {},
      onError: (code) => errors.push(code),
    });
    await missing.toggle();
    const refused = createDictation({
      locale: "fr",
      getRecognizer: () => fakeRecognizer(),
      requestMic: async () => {
        throw new DOMException("denied", "NotAllowedError");
      },
      readText: () => "",
      onText: () => {},
      onListening: () => {},
      onError: (code) => errors.push(code),
    });
    await refused.toggle();
    expect(errors).toEqual(["unavailable", "not-allowed"]);
  });
});
