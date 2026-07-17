import type { Metadata } from "next";
import "./globals.css";
import { getTheme } from "@/features/theme/server";

/**
 * Instrument Serif carries the display voice. Self-hosted at build time by
 * next/font, so there is no runtime request to Google and no layout shift.
 * One weight — it is used with restraint, never for body copy.
 */
const instrumentSerif = { variable: "" };

export const metadata: Metadata = {
  title: {
    default: "Persona OS",
    template: "%s · Persona OS",
  },
  description:
    "A personal operating system that happens to have a public face.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await getTheme();
  return (
    <html lang="en" data-theme={theme} className={instrumentSerif.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
