import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  getDirection,
  isLocale,
  localeCookieName,
  type Locale,
} from "./config";

export function getRequestLocale(): Locale {
  const headerLocale = headers().get("x-locale");
  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = cookies().get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  return defaultLocale;
}

export function getRequestDirection() {
  return getDirection(getRequestLocale());
}
