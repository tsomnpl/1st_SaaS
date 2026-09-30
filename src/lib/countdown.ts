/**
 * FlyerMint countdown zone: Africa/Lome (UTC+0, no daylight saving).
 * Benin is UTC+1. One zone keeps the label identical on the server and for every user.
 * The browser clock is never used.
 */
export const FLYERMINT_TIMEZONE = "Africa/Lome";

export type CountdownType = "DAYS" | "TOMORROW" | "TODAY" | "TONIGHT" | "WEEKEND" | "PAST";

export type EventCountdown = {
  type: CountdownType;
  value?: number;
  label: string;
  eventDate: string;
  timezone: string;
};

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

type Civil = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

export function civilParts(date: Date, timeZone: string): Civil {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const bag = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    weekday: String(bag.weekday),
  };
}

function dayNumber(parts: Pick<Civil, "year" | "month" | "day">) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function zoneOffsetMinutes(instant: Date, timeZone: string) {
  const parts = civilParts(instant, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = zoneOffsetMinutes(guess, timeZone);
  const instant = new Date(guess.getTime() - offset * 60_000);
  const corrected = zoneOffsetMinutes(instant, timeZone);
  if (corrected !== offset) {
    return new Date(guess.getTime() - corrected * 60_000);
  }
  return instant;
}

function parseTime(value: string | undefined) {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return null;
  const match = text.match(/^(\d{1,2})(?:\s*[h:]\s*(\d{2})?)?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseDateParts(value: string | undefined, now: Date, timeZone: string) {
  const text = value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  }
  const numeric = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (numeric) {
    return { year: Number(numeric[3]), month: Number(numeric[2]), day: Number(numeric[1]) };
  }
  const named = text.match(/^(\d{1,2})\s+([a-zàâäéèêëîïôùûüç]+)(?:\s+(\d{4}))?$/);
  if (!named) return null;
  const month = MONTHS[named[2]];
  if (!month) return null;
  const year = named[3] ? Number(named[3]) : civilParts(now, timeZone).year;
  return { year, month, day: Number(named[1]) };
}

export function parseEventInstant(
  dateText: string | undefined,
  timeText: string | undefined,
  now: Date,
  timeZone = FLYERMINT_TIMEZONE,
) {
  const date = parseDateParts(dateText, now, timeZone);
  if (!date) return null;
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) return null;
  const time = parseTime(timeText);
  const instant = zonedTimeToUtc(date.year, date.month, date.day, time?.hour ?? 0, time?.minute ?? 0, timeZone);
  const check = civilParts(instant, timeZone);
  if (check.year !== date.year || check.month !== date.month || check.day !== date.day) return null;
  return { instant, hasTime: Boolean(time) };
}

function labelFor(type: CountdownType, value?: number) {
  if (type === "DAYS") return `Plus que ${value} jours`;
  if (type === "TOMORROW") return "Demain";
  if (type === "TODAY") return "Aujourd'hui";
  if (type === "TONIGHT") return "Ce soir";
  if (type === "WEEKEND") return "Ce week-end";
  return "Événement passé";
}

export function getEventCountdown(eventDate: Date, now: Date, timezone = FLYERMINT_TIMEZONE, hasTime = false): EventCountdown {
  const event = civilParts(eventDate, timezone);
  const current = civilParts(now, timezone);
  const diff = dayNumber(event) - dayNumber(current);
  const eventDateLabel = `${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}`;

  let type: CountdownType = "DAYS";
  let value: number | undefined;

  if (diff < 0) {
    type = "PAST";
  } else if (diff === 0 && hasTime && (event.hour < current.hour || (event.hour === current.hour && event.minute <= current.minute))) {
    type = "PAST";
  } else if (diff === 0 && hasTime && event.hour >= 17) {
    type = "TONIGHT";
  } else if (diff === 0) {
    type = "TODAY";
  } else if (diff === 1) {
    type = "TOMORROW";
  } else if (current.weekday === "Fri" && diff === 2) {
    type = "WEEKEND";
  } else {
    type = "DAYS";
    value = diff;
  }

  const countdown: EventCountdown = {
    type,
    label: labelFor(type, value),
    eventDate: eventDateLabel,
    timezone,
  };
  if (value !== undefined) countdown.value = value;
  return countdown;
}

export function countdownForBrief(
  brief: { date?: string; time?: string },
  now = new Date(),
  timezone = FLYERMINT_TIMEZONE,
): EventCountdown | null {
  const parsed = parseEventInstant(brief.date, brief.time, now, timezone);
  if (!parsed) return null;
  return getEventCountdown(parsed.instant, now, timezone, parsed.hasTime);
}

const TEMPORAL_DOMAINS = new Set([
  "Evenementiel",
  "Mariage",
  "Anniversaire",
  "Musique",
  "Education & Formation",
  "Religion & Culture",
  "Associations",
  "Sport",
]);

const QUIET_DOMAINS = new Set([
  "Immobilier",
  "Finance & Fintech",
  "Sante & Clinique",
  "Agriculture",
  "Automobile",
  "Emploi & Recrutement",
]);

export function countdownFitsPoster(
  domain: string,
  visualType: string,
  objective: string,
  countdown: EventCountdown | null,
) {
  if (!countdown || countdown.type === "PAST") return false;
  const hint = `${visualType} ${objective}`.toLowerCase();
  const temporalHint = /evenement|événement|concert|soiree|soirée|festival|formation|conference|conférence/.test(hint);
  if (QUIET_DOMAINS.has(domain) && !temporalHint) return false;
  return TEMPORAL_DOMAINS.has(domain) || temporalHint;
}
