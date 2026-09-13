# Debut — Product Hunt Clone: Phased Implementation Plan

## Context

We're building "Debut," a Product Hunt clone, on top of an existing Next.js 16.3.5 + React 19.2.8 + Convex + Clerk + shadcn (Base UI "base-nova" style) scaffold. Auth (Clerk) and backend hosting (Convex) are already wired server-side, but no data model, no Convex functions, and no real app UI exist yet — `app/page.tsx` is still Create Next App boilerplate. The user wants to avoid painful schema migrations later, so **the full Convex schema is designed once, up front, covering every planned feature** — but the actual Convex functions and UI are still built incrementally, phase by phase, so each phase ends in something runnable and testable in the browser before the next begins.

Key decisions from user feedback that shape this plan:
- **Logos are generated, not uploaded.** No file-upload flow for logos in the early phases — each product gets a deterministic SVG "monogram" (colored shape + initials, hashed from the product's slug) rendered directly in a React component. No skill is needed for this — it's a small parametric code component, not a one-off art asset, so it's just built directly. Real logo *upload* stays possible later since the schema reserves an optional `logoStorageId`.
- **Schema is finalized once, for all phases**, including tables/fields that later phases will populate (categories, topics, makers, comments, daily rankings, search index).
- **`launchDay` (IST) exists from Phase 1** — the homepage feed is day-scoped from day one, matching Product Hunt's actual daily-drop mechanic, not deferred to the rankings phase.
- **Slugs exist from Phase 1** — product URLs are `/product/<slug>`, not raw Convex IDs, avoiding a future breaking URL change.

---

## Styling requirement (mandatory)

A `DESIGN.md` file lives alongside this plan at `.claude/plans/DESIGN.md` and contains the styling instructions for this app — visual direction, components, tokens, whatever it specifies. **Every phase from here on must follow `.claude/plans/DESIGN.md`.** Before writing or changing any UI in a phase, read it first; where it conflicts with defaults used earlier in this plan (or with plain shadcn/Tailwind defaults), `DESIGN.md` wins.

---

## Full Convex Schema (`convex/schema.ts`) — built once, in Phase 1

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  topics: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    tagline: v.string(),
    description: v.string(),
    websiteUrl: v.string(),
    pricingType: v.union(v.literal("free"), v.literal("freemium"), v.literal("paid")),
    logoSeed: v.string(),                              // deterministic seed for generated SVG monogram
    logoStorageId: v.optional(v.id("_storage")),        // reserved for future real-logo upload
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
    submitterId: v.id("users"),
    launchDay: v.string(),                              // "YYYY-MM-DD" in IST
    upvoteCount: v.number(),                             // denormalized counter
    isFeatured: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_launchDay_and_upvoteCount", ["launchDay", "upvoteCount"])
    .index("by_upvoteCount", ["upvoteCount"])
    .index("by_submitter", ["submitterId"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["launchDay", "pricingType"],
    }),

  productCategories: defineTable({
    productId: v.id("products"),
    categoryId: v.id("categories"),
  })
    .index("by_product", ["productId"])
    .index("by_category", ["categoryId"]),

  productTopics: defineTable({
    productId: v.id("products"),
    topicId: v.id("topics"),
  })
    .index("by_product", ["productId"])
    .index("by_topic", ["topicId"]),

  makers: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    role: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  upvotes: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
  })
    .index("by_product_and_user", ["productId", "userId"])
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    productId: v.id("products"),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("comments")),
    body: v.string(),
    upvoteCount: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_parent", ["parentCommentId"]),

  commentUpvotes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
  }).index("by_comment_and_user", ["commentId", "userId"]),

  dailyRankings: defineTable({
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    periodKey: v.string(),        // "2026-09-12" | "2026-W37" | "2026-09"
    productId: v.id("products"),
    rank: v.number(),
    upvoteCountAtClose: v.number(),
  })
    .index("by_period_and_key", ["period", "periodKey"])
    .index("by_product", ["productId"]),
});
```

Notes on why this shape satisfies the Convex guidelines (`convex/_generated/ai/guidelines.md`):
- All ownership/identity fields (`submitterId`, `authorId`, `userId`) are `v.id("users")`, never a raw client-supplied ID — the `users` row is always resolved server-side from `ctx.auth.getUserIdentity()`.
- `upvoteCount` on both `products` and `comments` is a denormalized counter maintained transactionally inside mutations — never derived via `.collect().length`.
- Every relationship that needs a fast lookup has a named compound index (`by_product_and_user`, `by_launchDay_and_upvoteCount`, etc.).
- IST dates are computed with fixed UTC+5:30 arithmetic (`new Date(Date.now() + 5.5*60*60*1000).toISOString().slice(0,10)`), not `Intl`/timezone-db, since Convex's runtime has limited ICU support — deterministic and dependency-free.

---

**Workflow note:** all work commits directly to `master` — no feature branches.

## Phase 0 — Housekeeping (do first)

**Fix the font regression from `shadcn init` first.** `app/globals.css` line 10 has:
```css
--font-sans: var(--font-sans);   /* circular — resolves to nothing */
```
`app/layout.tsx` sets the Geist font's CSS variable as `--font-geist-sans` (via `Geist({ variable: "--font-geist-sans", ... })`), but the `@theme inline` block never references it — it self-references the not-yet-defined `--font-sans`, so `font-sans` falls back to the browser default font. Line 11 already does this correctly for mono (`--font-mono: var(--font-geist-mono);`). Fix:
```css
--font-sans: var(--font-geist-sans);
```
One-line change, no other font wiring is broken.

Then commit the pending uncommitted state so every phase starts from a clean tree:
- `git add app/globals.css package.json pnpm-lock.yaml components.json components/ lib/ convex/auth.config.ts`
- Commit as `chore: initialize shadcn/ui and fix font variable, add Convex auth config`

## Tooling & Testing Policy (applies to every phase)

- **Testing stays minimal.** No exhaustive test suites per phase — verify each phase manually in the browser per its Verification section, plus a small number of targeted `convex-test` cases only where correctness is easy to get subtly wrong (e.g. the upvote toggle's idempotency/race behavior in Phase 1). Do not build broad test coverage as a goal in itself.
- **Use ESLint, and keep every dependency at its latest version — never downgrade to work around a conflict.** This project is intentionally on bleeding-edge majors (ESLint 10 flat-config-only, Next 16, React 19). If `pnpm lint` fails because a plugin/config hasn't caught up to ESLint 10 yet (e.g. a peer-dependency warning or a plugin resolving against an older ESLint), the fix is to update the *other* package, adjust `eslint.config.mjs` for the new flat-config shape, or find the current compatible replacement — not to pin ESLint back to an older major. Surface the specific incompatibility if one blocks progress rather than silently downgrading anything.
- Run `pnpm lint` (and `pnpm build` for a type-check pass, since `tsc` isn't run standalone here) at the end of each phase before considering it done.

## Phase 1 — Vertical slice: submit → list → upvote (detailed)

**Goal:** a signed-in user can submit a product, see it on a day-scoped homepage feed ranked by upvotes, open its detail page, and toggle an upvote in real time.

### 1. Convex↔Clerk client bridge
- `components/convex-client-provider.tsx` (new, client component): instantiate `ConvexReactClient` once at module scope, wrap children in `ConvexProviderWithClerk` from `convex/react-clerk` using Clerk's `useAuth`. Verified: `convex` package exports `./react-clerk`.
- Edit `app/layout.tsx`: wrap `{children}` (and header, since it'll need Convex data later) in `<ConvexClientProvider>`, nested inside the existing `<ClerkProvider>`.

### 2. Shared Convex helpers
- `convex/lib/utils.ts` (new): `todayInIST()`, `slugify(name)`, `generateUniqueSlug(ctx, name)` (checks `products.by_slug`, appends `-2`, `-3`, ... on collision).
- `convex/users.ts` (new): `getOrCreateUser(ctx, identity)` plain helper (looks up `users.by_token`, inserts if missing); `currentUser` public `query` returning the caller's own user doc or `null`.

### 3. Convex functions
- `convex/products.ts`:
  - `create` mutation — args `{ name, tagline, description, websiteUrl, pricingType }`; requires auth; resolves `submitterId` via `getOrCreateUser`; computes `slug`, `logoSeed` (= slug), `launchDay` (today IST); inserts with `upvoteCount: 0`, `isFeatured: false`.
  - `list` query — args `{ day: v.optional(v.string()) }` (defaults to today IST); uses `by_launchDay_and_upvoteCount` index, `.order("desc")`, `.take(50)`; annotates each result with `viewerHasUpvoted` via an O(1) `by_product_and_user` lookup per product (bounded to 50, so within guideline limits).
  - `getBySlug` query — args `{ slug }`; uses `by_slug` index.
- `convex/upvotes.ts`:
  - `toggle` mutation — args `{ productId }`; requires auth; resolves caller's `userId`; checks `upvotes.by_product_and_user`; inserts+patches `upvoteCount += 1` or deletes+patches `upvoteCount -= 1`, all inside the one transactional mutation (atomic, no race).

### 4. UI
Install shadcn components (this project uses the `shadcn` package, not `shadcn-ui`):
```bash
pnpm dlx shadcn@latest add card input textarea label select form
```
(`button` already installed.)

- `components/product-logo.tsx` (new): deterministic SVG monogram — hash `logoSeed` to pick one of the theme's existing `--chart-1`..`--chart-5` CSS vars as background, render the product's first 1–2 initials centered. No upload, no external asset.
- `components/product-card.tsx` (new): shadcn `Card` + `ProductLogo` + name/tagline/pricing badge/upvote button (`useMutation(api.upvotes.toggle)`) + link to `/product/[slug]`.
- `components/product-feed.tsx` (new): `useQuery(api.products.list, {})`; renders `ProductCard` list; loading/empty states.
- `app/page.tsx` (replace boilerplate): renders `<ProductFeed />` plus a heading showing today's date.
- `app/product/[slug]/page.tsx` (new): resolves `slug` from params (Next 16 async params — `await params` in a server wrapper, or `use()` in a client component), queries `products.getBySlug`, shows full detail + upvote button.
- `app/submit/page.tsx` (new): shadcn `Form`/`Input`/`Textarea`/`Select` (pricing: Free/Freemium/Paid); gated behind sign-in (`<Show when="signed-out">` prompts sign-in, matching the existing layout pattern); on submit calls `products.create`, then `router.push` to the new product's detail page.
- `app/layout.tsx`: add a nav link to `/submit` in the header.

### 5. Dev workflow convenience
Add `concurrently` as a dev dependency and a unified script so testing during development doesn't require two manual terminals:
```json
"dev": "concurrently -n frontend,backend \"pnpm frontend\" \"pnpm backend\""
```

---

## Phase 2 — Categories & Topics, Featured/All, Date Navigation
- Seed `categories` (AI, SaaS, Dev Tools, Hardware, etc.) via a one-time internal mutation.
- Submission form: category picker (writes `productCategories` rows) + free-form topic tag input (creates `topics` on the fly, writes `productTopics`).
- Homepage: category filter chips, Featured/All toggle (`isFeatured` flag), prev/next day navigator using `by_launchDay_and_upvoteCount`.

## Phase 3 — Makers & Real Media
- Maker multi-select on submission (search `users` by name — small enough to `.collect()` + client-filter at this scale) writing `makers` rows.
- Real gallery image upload (`generateUploadUrl` + `ctx.storage.getUrl()`) and optional real `logoStorageId` upload as an override to the generated monogram; `videoUrl` field; `next.config.ts` `images.remotePatterns` for the Convex storage domain.

## Phase 4 — Comments & Discussion
- `comments`/`commentUpvotes` functions (threaded via `parentCommentId`, denormalized `upvoteCount` same pattern as products).
- Detail-page comment thread UI; maker-authored comments visually highlighted (check `authorId` against the product's `makers` rows).

## Phase 5 — Rankings & Awards
- Convex cron at midnight IST (`18:30` UTC, since IST = UTC+5:30) snapshots `dailyRankings` per `day`/`week`/`month` `periodKey`, ranking by `upvoteCount` within each `launchDay` group.
- "Product of the Day/Week/Month" badges on cards/detail pages, category-specific leaderboard pages (join `dailyRankings` with `productCategories`).

## Phase 6 — Search & Discovery
- Search bar backed by the `search_products` search index (already in schema).
- Filter sidebar combining category/date/pricing.
- "Similar Products" via shared `productCategories`/`productTopics` overlap.
- Trending section using `upvotes`' built-in `_creationTime` system field to count recent-window upvotes per product (no schema change needed).

---

## Verification (end of Phase 1)

1. `pnpm dev` (after adding the unified script) — confirm both Convex dev (schema push, function codegen) and Next dev start cleanly, no TypeScript errors in `convex/_generated`.
2. In the browser: sign in via Clerk, visit `/submit`, submit a product, confirm redirect to `/product/<slug>`.
3. Visit `/` (homepage) — confirm the new product appears, ranked correctly if multiple products exist, with a generated SVG logo, correct pricing badge, and today's date shown.
4. Click upvote on the card — confirm the count increments in real time (no page refresh) and toggling again decrements it back; confirm a second browser/session (or signed-out state) doesn't let the same user double-upvote.
5. Open the product detail page directly via its slug URL — confirm it matches the feed state (upvote count, upvoted-by-viewer state) live.
6. Sign out — confirm `/submit` shows a sign-in prompt instead of the form, and the upvote button on cards reflects the signed-out state appropriately.