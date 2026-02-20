import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import LegalFooterLinks from "@/components/LegalFooterLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '"Zlata the Goat" - a puppet and musical performance for Hanukkah',
  description: 'A touching, joyful and slightly bittersweet performance based on a story by Isaac Bashevis Singer and Jewish parables. With puppets, shadows, live music and Hanukkah magic.',
  icons: {
    icon: [
      { url: '/favicon.png?v=2', sizes: 'any' },
      { url: '/favicon.png?v=2', type: 'image/png' },
    ],
    apple: '/favicon.png?v=2',
    shortcut: '/favicon.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-700/60 bg-slate-950/90 px-4 py-4 text-xs text-slate-300">
            <LegalFooterLinks />
          </footer>
        </div>
      </body>
    </html>
  );
}
