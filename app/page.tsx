import { Suspense } from "react";
import { ProductFeed } from "@/components/product-feed";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{"Today's chart"}</h1>
      <Suspense>
        <ProductFeed />
      </Suspense>
    </main>
  );
}
