import { Suspense } from "react";
import { SearchFeed } from "@/components/search-feed";

export default function SearchPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Search
      </h1>
      <Suspense>
        <SearchFeed />
      </Suspense>
    </main>
  );
}
