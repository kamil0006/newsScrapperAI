import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Sans } from "next/font/google";
import { CategoryHideToast } from "@/components/CategoryHideToast";
import { getLocale } from "@/lib/i18n/locale";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "newsScrapperAI",
  description: "Twój codzienny przegląd newsów z tech, AI i gier — posortowany przez AI.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang="pl"
      data-theme="dark"
      className={`${sourceSerif.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col sm:flex-row bg-bg text-text">
        {children}
        <CategoryHideToast locale={locale} />
      </body>
    </html>
  );
}
