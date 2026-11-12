import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Open_Sans, JetBrains_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"] });
const sans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Unshelved",
  description: "One search over university technology: NSF awards and patents, linked.",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="bg-band text-band-ink">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-3 leading-none">
              <span className="text-[22px] font-extrabold tracking-[-0.01em]">Unshelved<span className="text-[#f2a36f]">.</span></span>
              <span className="hidden sm:inline lg:hidden 2xl:inline whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.08em] text-band-ink-2">Tech discovery for VentureWell</span>
            </Link>
            <nav className="flex items-center gap-5 whitespace-nowrap text-[14px] font-semibold text-band-ink-2">
              <Link href="/?t=patent" className="hover:text-band-ink hidden xl:inline">Patents</Link>
              <Link href="/?t=research,icorps,iucrc,sbir,sttr" className="hover:text-band-ink hidden xl:inline">NSF awards</Link>
              <Link href="/landscape" className="hover:text-band-ink hidden sm:inline">Landscape</Link>
              <Link href="/centers" className="hover:text-band-ink hidden lg:inline">IUCRC centers</Link>
              <Link href="/universities" className="hover:text-band-ink hidden lg:inline">Universities</Link>
              <Link href="/pipeline" className="hover:text-band-ink hidden md:inline">Pipeline</Link>
              <Link href="/venturewell" className="h-8 px-3 inline-flex items-center rounded-[2px] bg-[#d47a42] text-white hover:bg-[#c0621f]">For VentureWell</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        {modal}
        <footer className="border-t border-rule mt-24">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-8 py-8 flex flex-col sm:flex-row gap-3 justify-between text-[13px] text-ink-3">
            <p>Patent data: Google Patents Public Datasets (IFI CLAIMS), CC BY 4.0. Awards: NSF.</p>
            <p>A demo for VentureWell. Powering innovators from idea to impact. Data since 2021.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
