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
  title: "Brewhaus - Life Begins After Coffee",
  description: "Enjoy handcrafted drinks, cozy cafés, and friendly baristas at Brewhaus.",
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
