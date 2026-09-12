# Debut

Debut is a Product Hunt clone — a daily-drop product launch platform where
makers submit products, the community upvotes and discusses them, and
rankings reset each day (IST).

## Stack

- **[Next.js](https://nextjs.org)** — App Router, React 19
- **[Convex](https://convex.dev)** — reactive backend: database, server
  functions, and real-time sync
- **[Clerk](https://clerk.com)** — authentication
- **[shadcn/ui](https://ui.shadcn.com)** (Base UI "base-nova" style) —
  component library

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the app (Next.js dev server + Convex dev, concurrently):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Data model

The Convex schema (`convex/schema.ts`) is designed once, up front, to cover
every planned feature — avoiding painful migrations later — even though the
functions and UI that populate it are built incrementally. It includes:

- `users`, `products`, `categories`, `topics`
- `productCategories` / `productTopics` (many-to-many joins)
- `makers`, `upvotes`, `comments`, `commentUpvotes`
- `dailyRankings` (day/week/month leaderboard snapshots)

Notable design choices:
- Products are day-scoped via a `launchDay` field (`YYYY-MM-DD`, IST),
  matching Product Hunt's daily-drop mechanic from day one.
- Products are addressed by a unique `slug` (`/product/<slug>`), not a raw
  Convex ID.
- Product logos are generated, deterministic SVG monograms (hashed from the
  product's slug) rather than uploaded files — real logo upload is reserved
  as a future option via the optional `logoStorageId` field.
- Counters like `upvoteCount` are denormalized and maintained transactionally
  inside mutations, never derived via `.collect().length`.

See `convex/_generated/ai/guidelines.md` for the Convex conventions this
project follows.

## Roadmap

Built phase by phase, each ending in something runnable and testable in the
browser:

1. **Vertical slice** — submit a product, day-scoped homepage feed ranked by
   upvotes, product detail page, real-time upvote toggle.
2. **Categories & Topics** — category/topic tagging, Featured/All toggle,
   date navigation.
3. **Makers & Real Media** — maker attribution, real gallery/logo image
   uploads, video links.
4. **Comments & Discussion** — threaded comments with maker highlighting.
5. **Rankings & Awards** — daily/weekly/monthly "Product of the ___" badges
   and leaderboards.
6. **Search & Discovery** — full-text product search, filters, similar
   products, trending.

## Tooling

- `pnpm lint` — ESLint (flat config)
- `pnpm build` — production build, also serves as a type-check pass

Testing stays minimal: each phase is verified manually in the browser, with
targeted `convex-test` cases only where correctness is easy to get subtly
wrong (e.g. upvote toggle idempotency).
