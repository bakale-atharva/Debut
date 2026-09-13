# Debut — Design System

## 0. Purpose & scope

This file is the single source of truth for Debut's visual language. It governs every phase from here on, per `.claude/plans/PLAN.md` ("every phase from here on must follow `.claude/plans/DESIGN.md`; where it conflicts with defaults used earlier in this plan or plain shadcn/Tailwind defaults, `DESIGN.md` wins"). Read this before writing or changing any UI.

The specs below are written generally enough to guide *future* phases too (comments, maker profiles, rankings/leaderboard pages, search — see §10), but as of this writing only Phase 1 (submit/list/upvote) and Phase 2 (categories, topics, featured toggle, date navigation) exist in the codebase. Do not treat a spec here as evidence that the page/feature it describes already exists — check the codebase.

## 1. Brand concept & principles

Debut is reframed as a **daily chart of new launches**, not a generic SaaS feed. This isn't decoration — it's the app's actual mechanic (`launchDay` + `upvoteCount` ranking, with a `dailyRankings` table already reserved in the schema for a future ranking phase). Ranking position is a first-class, legible UI element, not a hidden sort order.

Guiding principles:
1. **Rank is content, not chrome.** Every ordered list of products shows its position (numeral), not just relative order via scroll position.
2. **One accent pairing, used with intention.** Gold (`--signal`) means momentum/featured/rank — never used for anything else, including generic "brand color" decoration. Indigo (`--primary`) means action/navigation/brand. No third competing accent.
3. **Two type families, one job each.** Geist Sans reads; Geist Mono counts. Never mix the two jobs.
4. **Cards are earned, not default.** A boxed `Card` (radius + shadow/ring) is reserved for single, focused containers. Repeated list content (the chart, comment threads, search results) stays flat with hairline dividers so it reads as one continuous list, not a stack of identical boxes.
5. **One motion moment at a time.** Interactive feedback (button press, upvote fill) is immediate and tactile; nothing animates on scroll or page load without a user action triggering it.

## 2. Color system

### 2.1 Source palette ("spotlight at dusk")

| Name | Hex | Role |
|---|---|---|
| Ink | `#171521` | Text (light mode), base surface (dark mode) — warm violet-black, deliberately not a flat `#111`/`#000` |
| Paper | `#FAF9FC` | Background (light mode) — cool near-white with a whisper of violet, deliberately not warm cream |
| Signal (gold) | `#E8A33D` | Momentum / featured / rank-1 accent |
| Current (indigo) | `#5B4FE8` | Primary actions, links, brand |
| Muted | `#6B6775` | Secondary text |
| Hairline | `#E7E4ED` | Dividers, borders |

**Gold usage rule (important):** `--signal` on `--background` is only ~2.06:1 contrast — it fails AA for text at any size. **Gold is a fill/border/ring color only** (a filled button, a ring around a featured logo, a left-rule accent). If literal gold-colored *text* is ever needed (e.g. a rank-1 numeral), use `--signal-text` instead — a darkened variant of the same hue tuned for ~5.8:1 contrast on `--background`. Never set `color: var(--signal)` directly on body text or on `--background`.

### 2.2 Full token table

**`:root` (light):**
```css
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
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.924 0.012 301.3);        /* Hairline */
--input: oklch(0.924 0.012 301.3);
--ring: oklch(0.62 0.19 279);
--signal: oklch(0.765 0.140 72.9);         /* gold — fills/borders/rings only */
--signal-foreground: oklch(0.204 0.024 291.8);
--signal-text: oklch(0.50 0.14 72.9);      /* AA-safe gold for literal text, ~5.8:1 on Paper */
--radius: 0.75rem;
--chart-1: oklch(0.62 0.13 279);  /* indigo — product monogram hue */
--chart-2: oklch(0.62 0.13 340);  /* rose/plum */
--chart-3: oklch(0.62 0.13 195);  /* teal */
--chart-4: oklch(0.66 0.14 73);   /* gold/amber */
--chart-5: oklch(0.60 0.13 235);  /* sky blue */
```

**`.dark`:**
```css
--background: oklch(0.16 0.022 291.8);
--foreground: oklch(0.94 0.006 300);
--card: oklch(0.204 0.024 291.8);          /* = light-mode Ink, as an elevated surface */
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
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(0.96 0.01 300 / 12%);
--input: oklch(0.96 0.01 300 / 16%);
--ring: oklch(0.68 0.17 279);
--signal: oklch(0.765 0.140 72.9);
--signal-foreground: oklch(0.18 0.02 291.8);
--signal-text: oklch(0.78 0.13 73);
--chart-1..5: identical to light values — the product monogram's hue must not shift with theme
```

Note: there is no reachable dark-mode toggle in the UI (only the `.dark` class selector exists, unused by any component). These tokens are defined and correct; wiring an actual toggle is a separate, out-of-scope feature.

### 2.3 Product monogram hues

`--chart-1..5` are a curated set of 5 mid-tone, equal-lightness/chroma hues (indigo, rose, teal, gold, sky) used only by the generated product-logo monogram (`components/product-logo.tsx`). They share L/C so any hue reads as "the same brand family" regardless of which one a given product hashes to, and all support the same light monogram-text color on top.

## 3. Typography

**Families:** Geist Sans and Geist Mono only (already configured via `next/font/google`, no new font dependency).

- **Geist Sans** — all reading and UI text: headings, body, labels, buttons, navigation.
- **Geist Mono** — numeric/stat data only: chart-position numerals, upvote/boost counts, the date-navigator label. Never for labels, body copy, or button text. This is a deliberate contrast device (reading vs. counting), not a blanket "use mono for small text" rule.

**Type scale:**

| Role | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Hero (page h1, e.g. "Today's chart") | 32–40px (`text-3xl`/`text-4xl`) | 600 | tight (`tracking-tight`) | one per page |
| Section heading (h2, e.g. submit form sections) | 20–24px (`text-xl`/`text-2xl`) | 600 | tight | |
| Emphasis (product name in a row/card) | 15px | 500 | normal | |
| Body | 14px | 400 | normal | max measure ~65–75ch for prose (product descriptions) |
| Small/meta (pricing pill, tagline) | 12–13px | 400–500 | normal | |
| Numeric/mono (rank, count, date) | matches surrounding context size | 500–600 | `tabular-nums` | always `font-mono tabular-nums` together |

## 4. Spacing, radius & layout

- Base radius `--radius: 0.75rem` (bumped from the shadcn default `0.625rem`), scaled via the existing `calc()` ramp in `app/globals.css` (`sm` ×0.6 … `4xl` ×2.6). No component needs manual radius overrides beyond this.
- **When a boxed `Card` is appropriate:** a single, focused container that appears once per page — e.g. the submit form. **When it is not:** repeated list content — the home chart, and (in future phases) comment threads or search results. Those use flat rows with `divide-y divide-border`, not per-item cards.
- Row rhythm: `py-4` per chart row, `gap-4` between a row's logo/text/controls.
- Section rhythm: `gap-6` between major page sections, `gap-4` within a form group.

## 5. Elevation & shadow rules

Debut is hairline-border-first, not shadow-first. Default separation between elements is a 1px `border-border` line, not a drop shadow. The one exception is the submit form's `Card` wrapper, which keeps the existing shadcn `ring-1 ring-foreground/10` treatment (a soft ring reads as "lifted" without a heavy shadow). Do not add `box-shadow` utilities beyond what the shadcn primitives already define.

## 6. Iconography

- **lucide-react only** — already the project's icon library, do not introduce a second one.
- Standard stroke sizing: `size-4` inline with text, `size-3.5` in compact/small contexts (pills, chips).
- **Never use a unicode arrow or glyph character as a UI icon** (e.g. `↗`, `←`, `→`). Use the matching lucide icon instead — `ExternalLink` for outbound links, `ArrowLeft`/`ChevronLeft` for back navigation, `ArrowUp` for upvote, `Plus` for add/create actions. This rule exists because the pre-redesign code used literal `"Visit website ↗"` and `"← Back"` strings — fixed as part of this pass, and not to be reintroduced.

## 7. Motion & interaction principles

- Hover/press transitions use the existing `transition-all` on interactive primitives; keep durations short (~150ms, Tailwind default) — nothing should feel sluggish.
- The existing press affordance (`active:translate-y-px` on buttons) stays as the app's one consistent "pressed" feedback.
- Focus rings: `focus-visible:ring-3 ring-ring/50` (already defined on primitives) — never remove focus visibility.
- **The one deliberate motion moment:** the boost/upvote control's fill transition (background color transition from outline → `--signal` fill on toggle). This is the app's single "satisfying" interaction; don't add competing motion (no scroll-triggered fades, no per-card hover-lift animations) elsewhere.
- Respect `prefers-reduced-motion` — rely on Tailwind's/`tw-animate-css`'s built-in handling rather than hand-rolled animations that ignore it.

## 8. Component-by-component specs

### Button (`components/ui/button.tsx`)
Variants: `default` (indigo fill, primary actions), `outline` (hairline border, neutral actions — e.g. an un-upvoted boost button, date-nav arrows), `secondary`, `ghost`, `destructive`, `link`, and **`boost`** (new — gold fill, `bg-signal text-signal-foreground hover:bg-signal/90`, used exclusively for an *active* upvote/boost state). Pill-shaped CTAs (header "Submit", submit-page "List it") are the `outline`/`default` variant composed with `className="rounded-full"` — not a separate CVA variant, since only the shape changes.

### Card (`components/ui/card.tsx`)
Unchanged structurally. Used only for the submit form per §4. Re-themes automatically from the token change (no code edit needed).

### Form fields (`input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `checkbox.tsx`)
Unchanged structurally — 100% token-driven, re-theme automatically. `checkbox.tsx` is no longer used on the submit page (categories became pill toggles) but stays installed as a primitive for future use.

### Pill / badge / chip system
One visual pattern, reused everywhere a small labeled token appears:
- **Pricing pill** (read-only badge): `rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground`.
- **Category pill — active** (selected filter or selected in the submit form): `rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground`.
- **Category pill — inactive**: `rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent` (hairline outline, not a solid grey fill — replaces the old `bg-secondary` inactive treatment).
- **Topic chip**: same shape as an inactive category pill, plus a trailing `X` (remove) icon when editable.
- **Segmented control** (All/Featured toggle): a `rounded-lg bg-secondary p-1` track with two buttons; the active segment gets `bg-primary text-primary-foreground` (was `bg-background shadow-sm` — now uses the brand fill instead of a shadow to signal "active").

### Chart-position numeral
`font-mono tabular-nums text-muted-foreground`, sized to roughly match the row's emphasis text. Rows 1–3 (`isTop3`) get `text-signal-text` instead of `text-muted-foreground` — a restrained, AA-safe gold accent signaling "on the chart," not a badge/medal graphic.

### Boost / upvote control
Two sizes, same logic: compact (feed row) is `size="sm" className="rounded-full flex-row items-center gap-1.5 font-mono tabular-nums"`; prominent (product detail) is the default button size, same shape logic. Variant is `boost` when `viewerHasUpvoted`, `outline` otherwise. Icon: `ArrowUp`.

### Product logo / monogram (`components/product-logo.tsx`)
Deterministic SVG: hashes `logoSeed` to one of the 5 curated `--chart-N` hues (§2.3) as the fill, initials centered in a single consistent text color (no more per-hue light/dark branching, since all curated hues are mid-tone). Optional `featured` prop adds a soft gold ring (`ring-2 ring-signal ring-offset-2 ring-offset-background`) around the logo — used only on the product detail hero when `product.isFeatured` is true, never on feed rows (keeps the chart list visually calm; the numeral already carries "top of chart" signal there).

### Header (`app/layout.tsx`)
Sticky (`sticky top-0 z-40`), hairline bottom border, subtle backdrop blur (`backdrop-blur-sm bg-background/80`) — no drop shadow. Wordmark: "Debut" text plus a small inline-SVG circular mark with a gold→indigo gradient fill (the "spotlight dot") — no external logo asset. Primary nav action ("Submit") is a pill button with a `Plus` icon, not a plain text link, since it's the header's one primary action.

## 9. Page-level specs

- **Home** (`app/page.tsx` + `components/product-feed.tsx`/`product-card.tsx`) — hero heading (§3) + date navigator (mono label, outline icon buttons) + segmented All/Featured control (§8) + category pill row (§8) + the numbered chart list (flat rows, §4/§8).
- **Product detail** (`app/product/[slug]/page.tsx`) — hero (logo with conditional featured ring, name/tagline, prominent boost control), metadata row (pricing pill + icon-based "Visit website" link), description at comfortable measure, category/topic pills (§8).
- **Submit** (`app/submit/page.tsx`) — the one boxed `Card` (§4), sectioned fields, pill-toggle category picker (§8) instead of a checkbox grid, topic chips (§8), pill CTA button.
- **Sign-in/up** — themed via `ClerkProvider`'s `appearance.variables` (colorPrimary/colorBackground/colorText/colorDanger/borderRadius/fontFamily mapped to the tokens above) at the provider level, so the header's `SignInButton`/`SignUpButton` modals and `UserButton` dropdown match the full-page widgets too — no separate per-page theming needed.

## 10. Forward-looking notes for future phases

These are intentions for when Phases 3–6 are eventually built, so they extend this system consistently rather than inventing a new one. They do not describe anything that exists yet.

- **Phase 4 (comments):** comment list reuses the flat hairline-row pattern (§4), not boxed cards. Maker-authored comments get an indigo accent (e.g. a small indigo dot or border-left), consistent with indigo = "brand/authority" elsewhere.
- **Phase 5 (rankings/leaderboard):** reuses the chart-numeral system (§8) directly — a leaderboard is just a longer/differently-scoped version of the home chart. Streak/momentum badges, if added, should be pill-shaped and reuse the pill system (§8), not a new badge component.
- **Phase 6 (search):** search results reuse the product-card row pattern from the home chart (logo, name/tagline, pricing pill), without rank numerals (search results aren't a ranked chart).

## 11. Do / Don't quick reference

**Do:**
- Use `--signal` (gold) as a fill/border/ring; use `--signal-text` if literal gold text is unavoidable.
- Use `font-mono tabular-nums` for numbers that represent a count, rank, or date.
- Use flat hairline rows for repeated list content.
- Use lucide icons for every interactive glyph.

**Don't:**
- Don't set gold as literal text color via `--signal` directly.
- Don't use Geist Mono for labels, body text, or button text.
- Don't wrap repeated list items in individual `Card`s.
- Don't use a unicode arrow/glyph character in place of an icon component.
- Don't add scroll-triggered or per-item hover-lift animations — the boost button's fill transition is the app's one motion moment.
