# Debut — Visual Redesign (Phase 1/2 surfaces only)

## Context

Debut's current UI is functionally complete for Phase 1 (submit/list/upvote) and Phase 2 (categories, topics, featured toggle, date navigation) but visually is just the unstyled shadcn/Tailwind default: an entirely grayscale palette (every color token is `oklch(x 0 0)`, zero chroma), no brand identity, no custom typography treatment, and components styled with whatever the `shadcn init` scaffold produced. The user wants a distinctive redesign informed by three Dribbble references (a time-tracker app with dark cards on gradient-mesh backgrounds; an online-course leaderboard with rank badges, streak icons, and segmented controls; a dating app with soft rounded cards and gradient pill CTAs) — mixed into an original style, not copied.

**Scope is deliberately constrained to what's actually built.** The project's `.claude/plans/PLAN.md` describes 6 phases; only Phase 1 and 2 exist in the codebase today (confirmed via git log and direct file reads — 4 real routes: home, product detail, submit, sign-in/up). Phases 3–6 (makers, real media, comments, rankings/leaderboard pages, search) have no code yet. Per the user's explicit instruction, this redesign restyles only the existing surfaces — it does not scaffold new pages or features for unbuilt phases.

Two documentation deliverables are required on acceptance, written to the repo (currently empty stubs):
- **`.claude/plans/DESIGN.md`** — a comprehensive, standalone design-system reference other agents/humans can follow for *all* future phases (per `PLAN.md`: "every phase from here on must follow DESIGN.md").
- **`.claude/plans/REDESIGN.md`** — a short checklist/record specific to this restyling pass.

## Design direction

**Concept:** reframe Debut as a daily **chart** of new launches (its real mechanic — `launchDay` + `upvoteCount` ranking, with a `dailyRankings` table already reserved in the schema for a future phase) rather than a generic SaaS card-grid. Ranking position becomes a first-class, legible UI element instead of an invisible sort order.

**Palette — "spotlight at dusk"** (a deliberate gold/indigo duotone tied to the "debut/stage" concept, distinct from all three references' literal colors while informed by their attitude):

| Token | Hex | Role |
|---|---|---|
| Ink | `#171521` | text, dark-mode surfaces (warm violet-black, not flat `#111`) |
| Paper | `#FAF9FC` | background (cool near-white, not the cliché warm cream) |
| Signal (gold) | `#E8A33D` | momentum/featured/rank-1 accent — **fills, borders, rings only, never bare text** (fails AA as text on Paper — a darker `--signal-text` variant is defined for the rare case literal gold text is needed) |
| Current (indigo) | `#5B4FE8` | primary actions, links, brand |
| Muted | `#6B6775` | secondary text |
| Hairline | `#E7E4ED` | dividers/borders |

Exact oklch conversions for every token (light + dark `:root`/`.dark` blocks, plus a curated 5-hue set replacing the grayscale `--chart-1..5` used by the product monogram) are specified below and will be written verbatim into `DESIGN.md`.

**Typography:** keep Geist Sans/Geist Mono (already configured, no new font dependency). Geist Sans for all reading/UI text. Geist Mono is used **strictly for numeric/stat data** — chart-position numerals, upvote counts, the date-nav label — never for labels or body copy. This is a deliberate, content-grounded typographic contrast, not decoration.

**Layout, per surface** (details in the file-by-file section):
- **Home feed** — not a grid of identical cards. A numbered chart list: flat hairline-divided rows (no per-row box/shadow), a Geist Mono rank numeral (01, 02, 03…) on the left, logo, name/tagline, pricing pill, and a compact pill-shaped "boost" upvote control on the right that fills gold when active. Top-3 rows get a restrained gold accent on the numeral. Featured/All becomes a segmented pill control (indigo fill on the active segment). Category pills: solid indigo when active, hairline-outline when inactive (replacing the current solid-grey-blob look).
- **Product detail** — hero with logo (soft gold ring when `isFeatured`), prominent boost button, pricing pill + a real "Visit website" icon link (replacing the literal `↗` unicode arrow with `lucide-react`'s `ExternalLink`), description, category/topic pills matching the feed's pill system.
- **Submit** — the one place a boxed `Card` is correct (a single focused container, not a repeated grid): wrap the form, group fields into sections, replace the 2-column checkbox grid with pill toggle buttons matching the category-pill visual language, restyle topic chips consistently, pill-shaped CTA button.
- **Header** — sticky, hairline border + subtle backdrop blur (no heavy shadow), wordmark plus a small inline-SVG "spotlight dot" mark (gold→indigo gradient circle, no external asset needed), "Submit" becomes a pill button with a plus icon instead of a plain text link.
- **Sign-in/up** — theme via Clerk's `appearance` prop at the `ClerkProvider` level (not per-page) so the header's `SignInButton`/`SignUpButton` modals and `UserButton` dropdown pick up the same colors/radius/font as the full-page widgets — avoids a half-themed Clerk UI.

This synthesizes the three references without copying any one directly: the gradient-mesh reference informs one restrained gradient accent (the header's spotlight-dot mark) rather than a loud full-bleed background; the leaderboard informs the rank-numeral/segmented-control/pill-badge system; the dating app informs the soft rounded card (used only for the submit form) and pill-shaped gradient-adjacent CTA buttons.

---

## Exact tokens for `app/globals.css`

All existing semantic keys are value-only edits (every component already consumes `bg-primary`, `border-input`, `ring-ring`, etc. — never raw colors — so no component logic needs to change just to recolor). Two new keys are added: `--signal` / `--signal-foreground` (+ `@theme inline` lines so `bg-signal`/`text-signal-foreground` utilities exist), and `--signal-text` for the rare AA-safe literal-gold-text case.

**`:root` (light):**
```
--background: oklch(0.984 0.004 301.4);   /* Paper */
--foreground: oklch(0.204 0.024 291.8);   /* Ink */
--card: oklch(0.995 0.002 301);
--card-foreground: oklch(0.204 0.024 291.8);
--popover: oklch(0.995 0.002 301);
--popover-foreground: oklch(0.204 0.024 291.8);
--primary: oklch(0.535 0.222 279.3);      /* Current/indigo */
--primary-foreground: oklch(0.984 0.004 301.4);
--secondary: oklch(0.955 0.006 301);
--secondary-foreground: oklch(0.204 0.024 291.8);
--muted: oklch(0.955 0.006 301);
--muted-foreground: oklch(0.522 0.022 298.7);
--accent: oklch(0.93 0.03 279);
--accent-foreground: oklch(0.204 0.024 291.8);
--destructive: oklch(0.577 0.245 27.325);  /* unchanged */
--border: oklch(0.924 0.012 301.3);        /* Hairline */
--input: oklch(0.924 0.012 301.3);
--ring: oklch(0.62 0.19 279);
--signal: oklch(0.765 0.140 72.9);         /* NEW: gold — fills/borders/rings only */
--signal-foreground: oklch(0.204 0.024 291.8);
--signal-text: oklch(0.50 0.14 72.9);      /* NEW: AA-safe gold for literal text, ~5.84:1 on Paper */
--radius: 0.75rem;                          /* bumped from 0.625rem to fit the softer, pill-heavy direction */
--chart-1: oklch(0.62 0.13 279);  /* indigo */
--chart-2: oklch(0.62 0.13 340);  /* rose/plum */
--chart-3: oklch(0.62 0.13 195);  /* teal */
--chart-4: oklch(0.66 0.14 73);   /* gold/amber */
--chart-5: oklch(0.60 0.13 235);  /* sky blue */
```

**`.dark`:**
```
--background: oklch(0.16 0.022 291.8);
--foreground: oklch(0.94 0.006 300);
--card: oklch(0.204 0.024 291.8);          /* = light-mode Ink value, as an elevated surface */
--card-foreground: oklch(0.94 0.006 300);
--popover: oklch(0.204 0.024 291.8);
--popover-foreground: oklch(0.94 0.006 300);
--primary: oklch(0.60 0.19 279);
--primary-foreground: oklch(0.98 0.005 301);
--secondary: oklch(0.27 0.02 291);
--secondary-foreground: oklch(0.94 0.006 300);
--muted: oklch(0.27 0.02 291);
--muted-foreground: oklch(0.68 0.02 298);
--accent: oklch(0.30 0.05 279);
--accent-foreground: oklch(0.94 0.006 300);
--destructive: oklch(0.704 0.191 22.216);  /* unchanged */
--border: oklch(0.96 0.01 300 / 12%);
--input: oklch(0.96 0.01 300 / 16%);
--ring: oklch(0.68 0.17 279);
--signal: oklch(0.765 0.140 72.9);
--signal-foreground: oklch(0.18 0.02 291.8);
--signal-text: oklch(0.78 0.13 73);        /* lighter than light-mode variant; tune visually during impl */
--chart-1..5: identical to light values (monogram hue shouldn't shift with theme)
--sidebar-primary: oklch(0.60 0.19 279);   /* was a stray unused blue; aligned to new indigo for consistency */
```

Note: no dark-mode *toggle* exists in the UI today (only the unreachable `.dark` class selector). This pass keeps the dark tokens correct and coherent but does not add a toggle — that would be a new feature, out of the "restyle what's built" scope. Verify dark tokens by manually applying `class="dark"` via devtools during testing.

**Contrast note to carry into `DESIGN.md`:** gold (`--signal`) on Paper is only ~2.06:1 — fails AA. It must only be used as a fill/border/ring (ink-on-gold is 8.35:1, excellent), never as literal text color, unless using the separate darkened `--signal-text` token (~5.84:1 on Paper).

---

## File-by-file plan (in build-safe order)

1. **`app/globals.css`** — full token value replacement above. No structural change to the file's shape.
2. **`components/ui/button.tsx`** — add one new CVA variant, `boost`, matching the file's existing style exactly:
   ```ts
   boost:
     "bg-signal text-signal-foreground hover:bg-signal/90 aria-expanded:bg-signal focus-visible:border-signal/60 focus-visible:ring-signal/40",
   ```
   No new size needed — pill shapes and header/CTA treatments are achieved by composing existing sizes with `className` overrides (e.g. `rounded-full`), not new CVA branches. No changes needed to `card.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx` — they're 100% token-driven and re-theme automatically from step 1.
3. **Primitives verification pass** — visually spot-check `card.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `checkbox.tsx` re-theme correctly before touching any consumer; cheapest point to catch a miswired token.
4. **`components/product-logo.tsx`** — the `% 5` hash now points at the curated hue set from step 1 (likely zero code change for the color itself); simplify the `colorIndex === 1 ? foreground : background` text-color branch since all curated hues are mid-tone and can share one consistent text color; add an optional `featured?: boolean` prop that renders a soft gold ring (`ring-2 ring-signal ring-offset-2 ring-offset-background`) — consumed only by the product detail hero, not feed rows, per the design direction.
5. **`components/product-card.tsx` + `components/product-feed.tsx` — edited together** (coupled: rank becomes a required prop passed from parent to child):
   - `product-feed.tsx`: switch the list wrapper to `divide-y divide-border` and pass `rank={i + 1}` / `isTop3={i < 3}` per product; restyle the All/Featured toggle as a segmented control with indigo fill on the active segment; restyle the date-nav label with `font-mono tabular-nums`; category pills need no code change beyond verifying they render indigo now (already `bg-primary`/`bg-secondary`).
   - `product-card.tsx`: accept `rank`/`isTop3` props; drop the `Card`/`CardContent` wrapper for a flat row (`flex items-center gap-4 py-4`, no self-border since the parent's `divide-y` handles dividers); add the rank numeral (`font-mono tabular-nums text-muted-foreground`, using `text-signal-text` — the AA-safe darkened gold — as a restrained accent when `isTop3`); swap the upvote button to `variant="boost"` (was `"default"`) when upvoted, `rounded-full flex-row` layout instead of the current `flex-col`.
   - Reuses existing `Doc<"products">` typing and the existing `useMutation(api.upvotes.toggle)` call — no Convex changes.
6. **`app/page.tsx`** — trivial: bump the `h1` to the new hero type scale (`text-3xl font-semibold tracking-tight` or similar), no structural change.
7. **`app/product/[slug]/page.tsx`** — pass `featured={product.isFeatured}` into `ProductLogo`; replace the literal `"Visit website ↗"` string with an `<ExternalLink>` icon from `lucide-react` (already a dependency); replace the `"← Back"` text arrow with a `ChevronLeft`/`ArrowLeft` icon; align category/topic pill classNames with whatever final pattern step 5 lands on so both surfaces share one literal pattern; swap upvote button to `variant="boost"`.
8. **`app/submit/page.tsx`** — wrap the form in `<Card><CardContent className="flex flex-col gap-6">`; group fields into labeled sections; replace the `Checkbox` grid with pill toggle buttons (`aria-pressed`, same visual language as the feed's category pills, same max-3 disable/dim behavior as today); restyle topic chips to match; CTA button gets `rounded-full` — **copy suggestion: relabel "Submit" → "List it"** (more specific/active-voice per the app's own "chart/listing" framing) — applied as the default in this pass, easy to rename back if the user prefers "Submit."
9. **`app/layout.tsx`** — header becomes `sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-sm`; wordmark gets a small inline-SVG gold→indigo gradient circle mark; "Submit" nav link becomes a pill `Button` with a `Plus` icon; add `appearance` to `<ClerkProvider>`:
   ```ts
   appearance={{
     variables: {
       colorPrimary: "#5B4FE8",
       colorBackground: "#FAF9FC",
       colorText: "#171521",
       colorDanger: /* existing destructive hex equivalent */,
       borderRadius: "0.75rem",
       fontFamily: "var(--font-geist-sans)",
     },
   }}
   ```
   This is provider-level (not per sign-in/up page) so the header's `SignInButton`/`SignUpButton` modals and `UserButton` dropdown all pick up the same theme, not just the two full-page widgets.
10. **`app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`** — no structural changes expected; the provider-level `appearance` from step 9 covers them.

---

## Documentation deliverables (written first, before code, on acceptance)

**`.claude/plans/DESIGN.md`** — full sections: purpose/scope, brand concept & principles, color system (full token table + the gold-contrast usage rule), typography (full type scale + the mono-for-numerals-only rule with explicit examples/non-examples), spacing/radius/layout rules (incl. when a boxed `Card` is allowed vs. not), elevation/shadow rules, iconography rules (lucide-react only; explicit ban on unicode arrow glyphs, citing the `↗`/`←` fixes), motion/interaction principles (hover/press timing, the boost button's fill transition, reduced-motion note), component-by-component specs (button variant table, card, form-field chrome, the unified pill/badge/chip system, chart-numeral treatment, boost-control treatment, logo/monogram spec, header spec), page-level specs (brief cross-references, not restatement), forward-looking notes for Phases 3–6 so future work stays consistent, and a do/don't quick-reference checklist.

**`.claude/plans/REDESIGN.md`** — short: scope note (Phase 1/2 only), a checkbox per file in the order above, the flagged copy decision ("List it"), a verification checklist (mirrors below), and an explicit out-of-scope list (Phases 3–6, no new routes, no dark-mode toggle UI).

---

## Verification

1. `pnpm lint` and `pnpm build` — required since `ProductCard`'s prop signature changes; catches any type error before manual testing.
2. Light mode, all 5 routes: `/` (row layout, numerals, restrained top-3 accent, segmented toggle, category pills, mono date label), `/product/[slug]` (gold ring only when `isFeatured`, icon-based back/visit-website links), `/submit` (card container, sectioned form, pill category toggles, topic chips, CTA), `/sign-in`, `/sign-up` (Clerk widget colors/radius/font match the app, including the header's modal variants).
3. Dark tokens: manually apply `class="dark"` via devtools (no reachable in-app toggle exists) and confirm the palette still reads correctly — this pass guarantees the tokens are defined and correct, not that a user can reach dark mode.
4. Upvote interaction on both the feed row and detail page: gold fill only when `viewerHasUpvoted`, live count updates with no refresh, signed-out state still renders correctly through `SignInButton`.
5. Filters: category pill active (solid indigo) vs. inactive (hairline outline) contrast, segmented All/Featured control's indigo fill, date-nav prev/next incl. `disabled` state at `day >= today`.
6. Mobile width (~375–390px): feed row doesn't overflow (numeral/logo/name-tagline truncation/pricing pill/boost button all fit), header doesn't collide/wrap ugly, submit card padding reads fine narrow.

### Critical files
- `app/globals.css`
- `components/ui/button.tsx`
- `components/product-logo.tsx`
- `components/product-card.tsx`
- `components/product-feed.tsx`
- `app/page.tsx`
- `app/product/[slug]/page.tsx`
- `app/submit/page.tsx`
- `app/layout.tsx`
- `.claude/plans/DESIGN.md` (new content)
- `.claude/plans/REDESIGN.md` (new content)