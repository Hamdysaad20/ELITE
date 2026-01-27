import type { Metadata } from "next";
import { Cabin_Condensed, Calistoga, Cairo } from "next/font/google";
import "./globals.css";
import { getDirection } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";

const cabinCondensed = Cabin_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cabin-condensed",
});

const calistoga = Calistoga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-calistoga",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
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

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${cabinCondensed.variable} ${calistoga.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
