import type { Metadata } from "next";
import {
  Cabin_Condensed,
  Calistoga,
  Cairo,
  Bebas_Neue,
  Tajawal,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import { getDirection } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

const cabinCondensed = Cabin_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cabin-condensed",
  display: "swap",
});

const calistoga = Calistoga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-calistoga",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

// Tajawal — Arabic display font for hero text
// Better kashida glyph support than Cairo at large display sizes
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-tajawal",
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
      className={`${cabinCondensed.variable} ${calistoga.variable} ${cairo.variable} ${bebasNeue.variable} ${tajawal.variable}`}
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
