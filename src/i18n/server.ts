import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  getDirection,
  isLocale,
  localeCookieName,
  type Locale,
} from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale");
  if (isLocale(headerLocale)) return headerLocale;

  const cookiesList = await cookies();
  const cookieLocale = cookiesList.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  return defaultLocale;
}

export async function getRequestDirection() {
  return getDirection(await getRequestLocale());
}
