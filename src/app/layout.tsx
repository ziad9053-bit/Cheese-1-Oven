import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico, Lobster, Righteous, Bebas_Neue, Chewy } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontPacifico = Pacifico({ weight: '400', variable: "--font-pacifico", subsets: ["latin"] });
const fontLobster = Lobster({ weight: '400', variable: "--font-lobster", subsets: ["latin"] });
const fontRighteous = Righteous({ weight: '400', variable: "--font-righteous", subsets: ["latin"] });
const fontBebas = Bebas_Neue({ weight: '400', variable: "--font-bebas", subsets: ["latin"] });
const fontChewy = Chewy({ weight: '400', variable: "--font-chewy", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cheese 1 Oven",
  description: "Pizza and Pastry Ordering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fontPacifico.variable} ${fontLobster.variable} ${fontRighteous.variable} ${fontBebas.variable} ${fontChewy.variable} antialiased bg-black text-white font-sans overflow-hidden select-none touch-none`}
      >
        {children}
      </body>
    </html>
  );
}
