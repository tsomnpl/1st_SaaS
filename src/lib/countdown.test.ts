import { describe, expect, it } from "vitest";
import {
  FLYERMINT_TIMEZONE,
  countdownFitsPoster,
  countdownForBrief,
  getEventCountdown,
  parseEventInstant,
} from "./countdown";

const lome = FLYERMINT_TIMEZONE;

function at(iso: string) {
  return new Date(iso);
}

describe("event countdown", () => {
  it("uses Africa/Lome and never a negative day count", () => {
    const now = at("2026-09-27T12:00:00.000Z");
    const event = parseEventInstant("2026-09-30", undefined, now, lome);
    expect(event).not.toBeNull();
    const countdown = getEventCountdown(event!.instant, now, lome, false);
    expect(countdown).toMatchObject({ type: "DAYS", value: 3, label: "Plus que 3 jours", timezone: "Africa/Lome" });
    expect(countdown.label.includes("-")).toBe(false);
  });

  it("covers 7, 3, 2 days, tomorrow, today, tonight, weekend and past", () => {
    const monday = at("2026-09-21T10:00:00.000Z");
    expect(countdownForBrief({ date: "2026-09-28" }, monday)).toMatchObject({ type: "DAYS", value: 7, label: "Plus que 7 jours" });
    expect(countdownForBrief({ date: "2026-09-24" }, monday)).toMatchObject({ type: "DAYS", value: 3, label: "Plus que 3 jours" });
    expect(countdownForBrief({ date: "2026-09-23" }, monday)).toMatchObject({ type: "DAYS", value: 2, label: "Plus que 2 jours" });
    expect(countdownForBrief({ date: "2026-09-22" }, monday)).toMatchObject({ type: "TOMORROW", label: "Demain" });
    expect(countdownForBrief({ date: "2026-09-21" }, monday)).toMatchObject({ type: "TODAY", label: "Aujourd'hui" });
    expect(countdownForBrief({ date: "2026-09-21", time: "19h" }, at("2026-09-21T15:00:00.000Z"))).toMatchObject({
      type: "TONIGHT",
      label: "Ce soir",
    });
    expect(countdownForBrief({ date: "2026-09-27" }, at("2026-09-25T10:00:00.000Z"))).toMatchObject({
      type: "WEEKEND",
      label: "Ce week-end",
    });
    expect(countdownForBrief({ date: "2026-09-20" }, monday)).toMatchObject({
      type: "PAST",
      label: "Événement passé",
    });
  });

  it("keeps a whole day when no hour is given, and marks a passed hour as past", () => {
    const evening = at("2026-09-21T22:00:00.000Z");
    expect(countdownForBrief({ date: "21 septembre" }, evening)?.type).toBe("TODAY");
    expect(countdownForBrief({ date: "21 septembre 2026", time: "19:00" }, evening)?.type).toBe("PAST");
  });

  it("recalculates when the date or the clock changes", () => {
    const first = countdownForBrief({ date: "30 septembre 2026" }, at("2026-09-27T08:00:00.000Z"));
    const nextDay = countdownForBrief({ date: "30 septembre 2026" }, at("2026-09-28T08:00:00.000Z"));
    const moved = countdownForBrief({ date: "2 octobre 2026" }, at("2026-09-27T08:00:00.000Z"));
    expect(first?.label).toBe("Plus que 3 jours");
    expect(nextDay?.label).toBe("Plus que 2 jours");
    expect(moved?.value).toBe(5);
  });

  it("changes the label when the zone changes the civil day", () => {
    const now = at("2026-09-27T12:00:00.000Z");
    const event = parseEventInstant("2026-09-28", "02:00", now, "Africa/Lome");
    expect(event).not.toBeNull();
    const lomeLabel = getEventCountdown(event!.instant, now, "Africa/Lome", true);
    const ahead = getEventCountdown(event!.instant, now, "Pacific/Kiritimati", true);
    expect(lomeLabel.type).toBe("TOMORROW");
    expect(ahead.type).not.toBe("TOMORROW");
  });

  it("does not invent a countdown for an unreadable date", () => {
    expect(countdownForBrief({ date: "bientot" }, at("2026-09-27T12:00:00.000Z"))).toBeNull();
  });

  it("puts the countdown on a temporal poster and keeps it off a quiet listing", () => {
    const countdown = countdownForBrief({ date: "2026-09-30" }, at("2026-09-27T12:00:00.000Z"));
    expect(countdownFitsPoster("Evenementiel", "Affiche", "Remplir la salle", countdown)).toBe(true);
    expect(countdownFitsPoster("Immobilier", "Affiche", "Vendre un appartement", countdown)).toBe(false);
    expect(countdownFitsPoster("Immobilier", "Affiche", "Concert de lancement", countdown)).toBe(true);
    expect(countdownFitsPoster("Evenementiel", "Affiche", "Soiree", countdownForBrief({ date: "2026-09-01" }, at("2026-09-27T12:00:00.000Z")))).toBe(false);
  });
});
