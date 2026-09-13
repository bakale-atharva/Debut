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
import { Plus, Search, Trophy } from "lucide-react";
import { ConvexClientProvider } from "@/components/convex-client-provider";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>
            <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-background/80 p-4 backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
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
              <div className="flex items-center gap-3">
                <Link
                  href="/search"
                  className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary sm:flex"
                >
                  <Search className="size-3.5" />
                  Search
                </Link>
                <Link
                  href="/leaderboard"
                  className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary sm:flex"
                >
                  <Trophy className="size-3.5" />
                  Leaderboard
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex rounded-full gap-1"
                  render={<Link href="/submit" />}
                  nativeButton={false}
                >
                  <Plus className="size-3.5" />
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
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
