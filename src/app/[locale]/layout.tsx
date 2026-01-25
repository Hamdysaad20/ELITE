import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ClientBody from "@/app/ClientBody";
import { ErrorBoundary } from "@/components/ui";
import { locales, type Locale } from "@/i18n/config";

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: Locale };
};

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorBoundary>
        <ClientBody>{children}</ClientBody>
      </ErrorBoundary>
    </NextIntlClientProvider>
  );
}
