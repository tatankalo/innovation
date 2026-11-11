import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Inter_Tight, JetBrains_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"] });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Unshelved",
  description: "One search over university technology: NSF awards and patents, linked.",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="font-serif text-[22px] tracking-tight leading-none">
              Unshelved<span className="text-accent">.</span>
            </Link>
            <nav className="flex items-center gap-5 text-[14px] font-medium text-ink-2">
              <Link href="/?t=patent" className="hover:text-ink hidden sm:inline">Patents</Link>
              <Link href="/?t=research,icorps,iucrc,sbir,sttr" className="hover:text-ink hidden sm:inline">NSF awards</Link>
              <Link href="/?l=climate&o=readiness" className="hover:text-ink hidden md:inline">Climate</Link>
              <Link href="/?l=agtech&o=readiness" className="hover:text-ink hidden md:inline">Ag tech</Link>
              <Link href="/universities" className="hover:text-ink">Universities</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-rule mt-24">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8 py-8 flex flex-col sm:flex-row gap-3 justify-between text-[13px] text-ink-3">
            <p>Patent data: Google Patents Public Datasets (IFI CLAIMS), CC BY 4.0. Awards: NSF.</p>
            <p>A demo for VentureWell. Data since 2021.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
