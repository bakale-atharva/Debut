import { ProductFeed } from "@/components/product-feed";
import { formatDisplayDate, todayInIST } from "@/lib/dates";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">{"Today's launches"}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDisplayDate(todayInIST())}
        </p>
      </div>
      <ProductFeed />
    </main>
  );
}
