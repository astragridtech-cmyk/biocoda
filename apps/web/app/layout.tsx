import type { Metadata } from "next";
import { Inter, Spectral, Poppins } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@biocoda/shared";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Spectral serif for marketing display headlines and stat figures (landing handoff).
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Poppins for the BioCoda wordmark.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME}: 30-year BNG habitat monitoring`,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spectral.variable} ${poppins.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
