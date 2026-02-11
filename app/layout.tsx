import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
            <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 md:gap-6">
              <Link href="/terms" className="hover:text-slate-100 underline-offset-4 hover:underline">
                Условия
              </Link>
              <span aria-hidden="true" className="text-slate-500">|</span>
              <Link href="/privacy" className="hover:text-slate-100 underline-offset-4 hover:underline">
                Политика конфиденциальности
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
