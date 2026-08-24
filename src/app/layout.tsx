import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteNav, SideNav } from "@/components/site-nav";
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
  title: "Neuro Atlas",
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
          <div className="mx-auto flex w-full max-w-[88rem] flex-1 items-stretch gap-8 px-4 sm:px-6">
            <SideNav />
            <main className="min-w-0 flex-1 py-8">{children}</main>
          </div>
          <footer className="border-t border-border">
            <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-4 py-6 text-xs text-faint sm:px-6">
              <span>Neuro Atlas — a work in progress.</span>
              <span className="tnum">v0.2</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
