import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteNav } from "@/components/site-nav";
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
  title: "State of BCI",
  description:
    "An interactive atlas of the brain-computer interface field — milestones, capital, velocity, and the field's trajectory.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SiteHeader />
          <SiteNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
            {children}
          </main>
          <footer className="border-t border-border">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-faint sm:px-6">
              <span>State of BCI — a work in progress.</span>
              <span className="tnum">v0.2</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
