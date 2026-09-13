# Debut

Debut is a Product Hunt clone — a daily-drop product launch platform where
makers submit products, the community upvotes and discusses them, and
rankings reset each day (IST). It's built as a vibecoding exercise on top of
Next.js + Convex + Clerk, with Claude doing the implementation phase by
phase from a hand-written plan.

## Stack

| Layer          | Choice                                                        |
| -------------- | -------------------------------------------------------------- |
| Framework      | [Next.js](https://nextjs.org) 16 (App Router, React 19)        |
| Backend        | [Convex](https://convex.dev) — reactive DB + server functions  |
| Auth           | [Clerk](https://clerk.com), bridged to Convex via `convex/react-clerk` |
| UI components  | [shadcn/ui](https://ui.shadcn.com) on Base UI's `base-nova` style |
| Styling        | Tailwind CSS v4                                                 |
| Package manager| pnpm                                                            |

## Getting started

**Prerequisites:** a Convex deployment and a Clerk application, wired
together per [`convex/auth.config.ts`](convex/auth.config.ts) (Convex trusts
Clerk-issued JWTs as the identity provider).

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` with:

   ```
   # Convex
   CONVEX_DEPLOYMENT=
   NEXT_PUBLIC_CONVEX_URL=
   NEXT_PUBLIC_CONVEX_SITE_URL=
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY=
   CLERK_FRONTEND_API_URL=

   # Clerk Redirects
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   ```

   `CONVEX_DEPLOYMENT`/`NEXT_PUBLIC_CONVEX_URL` come from `npx convex dev`
   on first run; the Clerk values come from your Clerk application's API
   Keys page.

3. Run the backend and frontend (currently two separate scripts — there's
   no unified `dev` script yet):

   ```bash
   pnpm backend   # convex dev — pushes convex/schema.ts, generates convex/_generated
   ```

   ```bash
   pnpm frontend  # next dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). Sign in via Clerk,
   then visit `/submit` to post a product.

## Data model

The Convex schema ([`convex/schema.ts`](convex/schema.ts)) was designed once,
up front, to cover every planned feature and avoid painful migrations later
— even though the functions and UI that populate it are still being built
incrementally, phase by phase.

```
users              tokenIdentifier, name, avatarUrl?, email?
categories         name, slug
topics             name, slug

products           name, slug, tagline, description, websiteUrl,
                    pricingType: "free" | "freemium" | "paid",
                    logoSeed, logoStorageId?, galleryStorageIds?, videoUrl?,
                    submitterId -> users, launchDay ("YYYY-MM-DD", IST),
                    upvoteCount, isFeatured
                    + full-text search index over `name`

productCategories  productId -> products, categoryId -> categories
productTopics      productId -> products, topicId -> topics
makers             productId -> products, userId -> users, role?

upvotes            productId -> products, userId -> users
comments           productId -> products, authorId -> users,
                    parentCommentId? -> comments, body, upvoteCount
commentUpvotes     commentId -> comments, userId -> users

dailyRankings      period: "day" | "week" | "month", periodKey,
                    productId -> products, rank, upvoteCountAtClose
```

Every table that needs a fast lookup has a named compound index (e.g.
`by_product_and_user` on `upvotes`, `by_launchDay_and_upvoteCount` on
`products`) — see the schema file for the full list.

Design choices baked into the schema:
- **Day-scoped from day one.** `launchDay` (computed with fixed UTC+5:30
  arithmetic, not `Intl`, since Convex's runtime has limited ICU support)
  drives the homepage feed, matching Product Hunt's actual daily-drop
  mechanic instead of being bolted on later.
- **Slugs from day one.** Products are addressed at `/product/<slug>`, never
  a raw Convex ID, so the URL scheme never has to change.
- **Generated, not uploaded, logos.** Each product gets a deterministic SVG
  "monogram" — a colored square plus the product's initials, both derived by
  hashing `logoSeed` (currently just the slug) — rendered client-side by
  [`components/product-logo.tsx`](components/product-logo.tsx). No upload
  pipeline needed for the early phases. Real logo upload stays possible
  later via the reserved, currently-unused `logoStorageId` field.
- **Denormalized counters.** `upvoteCount` (on both `products` and
  `comments`) is maintained transactionally inside mutations — e.g.
  [`convex/upvotes.ts`](convex/upvotes.ts)'s `toggle` inserts/deletes the
  `upvotes` row and patches the counter in the same mutation — never derived
  with `.collect().length`.
- **Server-resolved identity.** Every ownership field (`submitterId`,
  `authorId`, `userId`) is a `v.id("users")` resolved from
  `ctx.auth.getUserIdentity()` server-side (see
  [`convex/users.ts`](convex/users.ts)'s `getOrCreateUser`/`getViewerUserId`),
  never trusted from client-supplied arguments.

See [`convex/_generated/ai/guidelines.md`](convex/_generated/ai/guidelines.md)
for the full set of Convex conventions this project follows.

## Backend functions (current)

| File | Exports | Notes |
| --- | --- | --- |
| `convex/users.ts` | `getOrCreateUser`, `getViewerUserId` (helpers), `currentUser` (query) | Resolves/creates the caller's `users` row from their Clerk identity |
| `convex/products.ts` | `create`, `list`, `getBySlug` | `create` writes `productCategories`/`productTopics` rows too (max 3 categories, 5 topics); `list` takes `day` (required) plus optional `categorySlug`/`featuredOnly`, and annotates each result with `viewerHasUpvoted` |
| `convex/upvotes.ts` | `toggle` | Atomic insert/delete + counter patch, one transaction — no race between concurrent togglers |
| `convex/categories.ts` | `list` (query), `seed` (internal mutation) | `seed` is idempotent — safe to re-run, skips existing slugs. Seeded set: AI, SaaS, Dev Tools, Hardware, Design, Productivity, Marketing, Fintech, Health & Fitness, Education |
| `convex/topics.ts` | `getOrCreateTopic` (helper) | Topics are created on the fly from free-form submission input |
| `convex/lib/utils.ts` | `todayInIST`, `slugify`, `generateUniqueSlug` | Shared helpers; slug collisions get `-2`, `-3`, ... suffixes |

## Frontend routes (current)

- `/` — home feed ([`app/page.tsx`](app/page.tsx) +
  [`components/product-feed.tsx`](components/product-feed.tsx)): date
  navigator (prev/next day, capped at today, via
  [`lib/dates.ts`](lib/dates.ts)), an All/Featured toggle, and category
  filter chips, all driving `products.list`
- `/product/[slug]` — product detail page, backed by `products.getBySlug`
- `/submit` — submission form (name, tagline, description, URL, pricing,
  up to 3 categories, up to 5 free-form topics), gated behind Clerk sign-in
- `/sign-in`, `/sign-up` — Clerk's catch-all auth pages

Shared UI: `components/product-card.tsx`, `components/product-feed.tsx`,
`components/product-logo.tsx` (the generated monogram), plus shadcn
primitives under `components/ui/`. `components/convex-client-provider.tsx`
wires `ConvexProviderWithClerk` (Clerk's `useAuth` feeds Convex's auth
state) around the app in `app/layout.tsx`.

## Roadmap

Built phase by phase, each ending in something runnable and testable in the
browser before the next begins. The schema above already covers every
phase; only the functions and UI land incrementally.

1. **Vertical slice** ✅ — submit a product, see it on a day-scoped homepage
   feed ranked by upvotes, open its detail page, toggle an upvote in real
   time.
2. **Categories & Topics, Featured/All, date navigation** ✅ — category
   tagging on submission, category filter chips and an All/Featured toggle
   on the homepage, and prev/next day navigation.
3. **Makers & real media** — maker multi-select on submission (writes
   `makers` rows), real gallery/logo image uploads via Convex file storage,
   `videoUrl` on the detail page.
4. **Comments & discussion** — threaded comments (`comments`/
   `commentUpvotes`) with maker-authored comments visually highlighted.
5. **Rankings & awards** — a midnight-IST cron snapshotting
   `dailyRankings` per day/week/month, plus "Product of the Day/Week/Month"
   badges and category leaderboards.
6. **Search & discovery** — a search bar backed by the `search_products`
   full-text index already in the schema, a combined filter sidebar,
   "similar products" via shared category/topic overlap, and a trending
   section using upvotes' `_creationTime`.

## Tooling & testing policy

- `pnpm lint` — ESLint 10, flat-config only. Dependencies stay on their
  latest major (Next 16, React 19, ESLint 10); if a plugin hasn't caught up
  yet, the fix is to update or replace that plugin — not to downgrade
  ESLint.
- `pnpm build` — production build; also serves as the type-check pass,
  since `tsc` isn't run standalone here.
- **Testing stays intentionally minimal.** No broad test suites per phase —
  each phase is verified manually in the browser, plus a small number of
  targeted `convex-test` cases only where correctness is easy to get subtly
  wrong (e.g. the upvote toggle's idempotency/race behavior).

## Workflow note

Phases land as pull requests against `master` (see PR #1 and #2 in the
commit history) rather than long-lived branches.
