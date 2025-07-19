import type { Metadata } from "next";
import { Cabin_Condensed, Calistoga } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

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

export const metadata: Metadata = {
  title: "Elite Coffee - Premium Coffee Experience",
  description: "Experience the finest coffee at Elite Coffee. Located in Faiyum, Governorate Club.",
  icons: {
    icon: [
      {
        url: '/logo.png',
        sizes: '32x32',
        type: 'image/png',
        rel: 'icon',
      },
      {
        url: '/logo.png',
        sizes: '16x16',
        type: 'image/png',
        rel: 'icon',
      },
    ],
    apple: [
      {
        url: '/logo.png',
        sizes: '180x180',
        type: 'image/png',
        rel: 'apple-touch-icon',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cabinCondensed.variable} ${calistoga.variable}`}>
      <body className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
