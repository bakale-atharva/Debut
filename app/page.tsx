import { ProductFeed } from "@/components/product-feed";
import { TrendingWidget } from "@/components/trending-widget";
import { LeaderboardWidget } from "@/components/leaderboard-widget";
import { RecentDiscussionWidget } from "@/components/recent-discussion-widget";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {"Today's chart"}
          </h1>
          <div className="mt-6">
            <ProductFeed />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-8 md:w-64 md:shrink-0">
          <TrendingWidget />
          <LeaderboardWidget />
          <RecentDiscussionWidget />
        </aside>
      </div>
    </main>
  );
}
