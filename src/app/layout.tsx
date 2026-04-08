import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import { getDirection } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

const cabinCondensed = localFont({
  src: [
    {
      path: "../fonts/CabinCondensed-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CabinCondensed-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/CabinCondensed-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cabin-condensed",
  display: "swap",
});

const calistoga = localFont({
  src: [
    {
      path: "../fonts/Calistoga-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-calistoga",
  display: "swap",
});

const cairo = localFont({
  src: [
    {
      path: "../fonts/Cairo-Variable.ttf",
      weight: "200 1000",
      style: "normal",
    },
  ],
  variable: "--font-cairo",
  display: "swap",
});

const bebasNeue = localFont({
  src: [
    {
      path: "../fonts/BebasNeue-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-bebas",
  display: "swap",
});

// Readex Pro — modern geometric Arabic display font
// Sharp, bold, highly readable at large sizes (pairs with Bebas for EN/AR headings)
const readexPro = localFont({
  src: [
    {
      path: "../fonts/ReadexPro-Variable.ttf",
      weight: "160 700",
      style: "normal",
    },
  ],
  variable: "--font-readex",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: "/logo.png",
        sizes: "32x32",
        type: "image/png",
        rel: "icon",
      },
      {
        url: "/logo.png",
        sizes: "16x16",
        type: "image/png",
        rel: "icon",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        sizes: "180x180",
        type: "image/png",
        rel: "apple-touch-icon",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const direction = getDirection(locale);
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${cabinCondensed.variable} ${calistoga.variable} ${cairo.variable} ${bebasNeue.variable} ${readexPro.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
