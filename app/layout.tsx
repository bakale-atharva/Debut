import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Trophy } from "lucide-react";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { HeaderSearch } from "@/components/header-search";
import { Button } from "@/components/ui/button";
import "./globals.css";

const clerkAppearance = {
  variables: {
    colorPrimary: "#5B4FE8",
    colorBackground: "#FAF9FC",
    colorText: "#171521",
    colorDanger: "#DC2626",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans)",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Debut",
  description:
    "An app for listing newly launched products, inspired by Sonny Sangha and vibecoded using Claude.",
  other: {
    "theme-color": "oklch(0.984 0.004 301.4)",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light dark" }}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>
            <a
              href="#main"
              className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Skip to content
            </a>
            <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/70 bg-background/80 p-4 backdrop-blur-sm">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <defs>
                    <linearGradient id="spotlight-dot" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--signal)" />
                      <stop offset="100%" stopColor="var(--primary)" />
                    </linearGradient>
                  </defs>
                  <circle cx="9" cy="9" r="9" fill="url(#spotlight-dot)" />
                </svg>
                Debut
              </Link>
              <div className="flex flex-1 justify-center px-2">
                <Suspense fallback={<div className="h-8 w-full max-w-sm" />}>
                  <HeaderSearch />
                </Suspense>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href="/leaderboard"
                  className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary sm:flex"
                >
                  <Trophy className="size-3.5" aria-hidden="true" />
                  Leaderboard
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex rounded-full gap-1"
                  render={<Link href="/submit" />}
                  nativeButton={false}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Submit
                </Button>
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton />
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </header>
            <div id="main" className="flex flex-1 flex-col">
              {children}
            </div>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
