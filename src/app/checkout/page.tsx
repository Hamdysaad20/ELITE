import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { addLocaleToPathname } from "@/i18n/routing";

export default async function CheckoutRedirectPage() {
  const locale = await getLocale();
  redirect(addLocaleToPathname("/order", locale));
}
