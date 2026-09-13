import { Suspense } from "react";
import { LeaderboardFeed } from "@/components/leaderboard-feed";

export default function LeaderboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Leaderboard</h1>
      <Suspense>
        <LeaderboardFeed />
      </Suspense>
    </main>
  );
}
