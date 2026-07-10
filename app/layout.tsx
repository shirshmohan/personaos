import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

/**
 * Instrument Serif carries the display voice. Self-hosted at build time by
 * next/font, so there is no runtime request to Google and no layout shift.
 * One weight — it is used with restraint, never for body copy.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Persona OS",
    template: "%s · Persona OS",
  },
  description:
    "A personal operating system that happens to have a public face.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrumentSerif.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
