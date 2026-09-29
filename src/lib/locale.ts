import { cookies } from "next/headers";
import { copy, parseLocale, LOCALE_COOKIE, type Copy, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function getDictionary(): Promise<{ locale: Locale; t: Copy }> {
  const locale = await getLocale();
  return { locale, t: copy[locale] };
}
