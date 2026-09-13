import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { daysAgoInIST, slugify } from "./lib/utils";
import { getOrCreateTopic } from "./topics";

// Same curated list as categories.ts's own seed — kept local since a mutation
// can't call another mutation, but idempotent the same way (skip existing slugs).
const CATEGORY_NAMES = [
  "AI",
  "SaaS",
  "Dev Tools",
  "Hardware",
  "Design",
  "Productivity",
  "Marketing",
  "Fintech",
  "Health & Fitness",
  "Education",
];

const MAKERS = [
  {
    key: "m1",
    name: "Ava Chen",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m2",
    name: "Liam Rodriguez",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m3",
    name: "Sofia Patel",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m4",
    name: "Noah Kim",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m5",
    name: "Maya Johnson",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m6",
    name: "Ethan Wallace",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m7",
    name: "Priya Sharma",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m8",
    name: "Lucas Ferreira",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m9",
    name: "Zoe Martinez",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m10",
    name: "Daniel Osei",
    avatarUrl:
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m11",
    name: "Isla Novak",
    avatarUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m12",
    name: "Ravi Desai",
    avatarUrl:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    key: "m13",
    name: "Clara Nguyen",
    avatarUrl:
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
] as const;

const ALL_MAKER_KEYS = MAKERS.map((m) => m.key);

type Pricing = "free" | "freemium" | "paid";

interface SeedProduct {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  pricingType: Pricing;
  categorySlugs: string[];
  topics: string[];
  makerKeys: string[]; // first entry is the submitter
  featured?: boolean;
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Flowbase",
    tagline: "Automate your busywork with AI agents that actually finish tasks.",
    description:
      "Flowbase chains AI agents together to handle repetitive multi-step work — triaging inboxes, updating spreadsheets, filing tickets — so teams can skip the busywork entirely.",
    websiteUrl: "https://flowbase.app",
    pricingType: "freemium",
    categorySlugs: ["ai", "productivity"],
    topics: ["automation", "ai-agents", "productivity"],
    makerKeys: ["m1"],
    featured: true,
  },
  {
    name: "PixelForge",
    tagline: "A design system builder your engineers will actually adopt.",
    description:
      "PixelForge generates production-ready component libraries from your Figma files, keeping design tokens and code in sync automatically.",
    websiteUrl: "https://pixelforge.design",
    pricingType: "paid",
    categorySlugs: ["design", "dev-tools"],
    topics: ["design-systems", "developer-tools", "branding"],
    makerKeys: ["m2"],
  },
  {
    name: "TaskPilot",
    tagline: "Project management that stays out of your team's way.",
    description:
      "TaskPilot is a lightweight project tracker built for small, fast-moving teams who found Jira too heavy and spreadsheets too messy.",
    websiteUrl: "https://taskpilot.io",
    pricingType: "freemium",
    categorySlugs: ["productivity", "saas"],
    topics: ["productivity", "remote-work"],
    makerKeys: ["m3"],
  },
  {
    name: "LedgerLoop",
    tagline: "Real-time bookkeeping built for freelancers, not accountants.",
    description:
      "LedgerLoop syncs your invoices, expenses, and bank feeds into one live ledger, so tax season stops being a surprise.",
    websiteUrl: "https://ledgerloop.io",
    pricingType: "paid",
    categorySlugs: ["fintech"],
    topics: ["personal-finance", "automation"],
    makerKeys: ["m4"],
  },
  {
    name: "SnapShip",
    tagline: "One-click deployment for static sites and small apps.",
    description:
      "SnapShip watches your git repo and ships every merge to a global edge network in seconds, with instant rollbacks built in.",
    websiteUrl: "https://snapship.dev",
    pricingType: "free",
    categorySlugs: ["dev-tools"],
    topics: ["developer-tools", "automation"],
    makerKeys: ["m5"],
  },
  {
    name: "MindGrove",
    tagline: "Spaced-repetition learning that fits in your commute.",
    description:
      "MindGrove turns any article, textbook, or lecture into bite-sized flashcards and schedules reviews using spaced repetition.",
    websiteUrl: "https://mindgrove.app",
    pricingType: "freemium",
    categorySlugs: ["education"],
    topics: ["learning", "habit-tracking"],
    makerKeys: ["m6"],
  },
  {
    name: "PulseFit",
    tagline: "A workout coach that reads your wearable's data in real time.",
    description:
      "PulseFit pulls live heart-rate and recovery data from your wearable to adjust today's workout before you even start warming up.",
    websiteUrl: "https://pulsefit.io",
    pricingType: "paid",
    categorySlugs: ["health-fitness", "hardware"],
    topics: ["wearables", "health"],
    makerKeys: ["m7"],
  },
  {
    name: "CopyCraft",
    tagline: "AI copywriting that actually sounds like your brand.",
    description:
      "CopyCraft learns your brand voice from past campaigns and drafts on-brand ad copy, emails, and landing pages in seconds.",
    websiteUrl: "https://copycraft.ai",
    pricingType: "freemium",
    categorySlugs: ["marketing", "ai"],
    topics: ["marketing-tools", "ai-agents", "branding"],
    makerKeys: ["m8"],
    featured: true,
  },
  {
    name: "StackScope",
    tagline: "Observability for microservices, without the config sprawl.",
    description:
      "StackScope auto-instruments your services to surface latency spikes and error clusters on one dashboard, no YAML required.",
    websiteUrl: "https://stackscope.dev",
    pricingType: "paid",
    categorySlugs: ["dev-tools", "saas"],
    topics: ["observability", "developer-tools"],
    makerKeys: ["m9"],
    featured: true,
  },
  {
    name: "BudgetBloom",
    tagline: "A personal finance tracker with AI-generated insights.",
    description:
      "BudgetBloom categorizes your spending automatically and surfaces one plain-English insight a week instead of another dashboard to stare at.",
    websiteUrl: "https://budgetbloom.app",
    pricingType: "free",
    categorySlugs: ["fintech", "ai"],
    topics: ["personal-finance", "ai-agents"],
    makerKeys: ["m10"],
  },
  {
    name: "FormFlow",
    tagline: "Drag-and-drop forms that write to your database directly.",
    description:
      "FormFlow lets non-engineers build forms that read and write straight to your existing database, no backend glue code needed.",
    websiteUrl: "https://formflow.app",
    pricingType: "freemium",
    categorySlugs: ["productivity", "saas"],
    topics: ["no-code", "productivity"],
    makerKeys: ["m11"],
  },
  {
    name: "VoxNote",
    tagline: "Meeting notes that write themselves while you talk.",
    description:
      "VoxNote transcribes meetings live and turns the transcript into structured notes and action items, synced to your calendar.",
    websiteUrl: "https://voxnote.app",
    pricingType: "freemium",
    categorySlugs: ["productivity", "ai"],
    topics: ["voice-to-text", "productivity"],
    makerKeys: ["m12"],
  },
  {
    name: "GridPilot",
    tagline: "Turn any spreadsheet into a real internal app.",
    description:
      "GridPilot reads your existing spreadsheet and generates a full CRUD app on top of it, with permissions and workflows included.",
    websiteUrl: "https://gridpilot.dev",
    pricingType: "paid",
    categorySlugs: ["dev-tools", "productivity"],
    topics: ["no-code", "developer-tools"],
    makerKeys: ["m13"],
  },
  {
    name: "Lumen Desk",
    tagline: "A smart desk lamp that runs your focus timer.",
    description:
      "Lumen Desk pairs a tunable desk lamp with a focus-timer app, dimming and shifting color temperature as your session winds down.",
    websiteUrl: "https://lumendesk.co",
    pricingType: "paid",
    categorySlugs: ["hardware", "productivity"],
    topics: ["wearables", "productivity", "habit-tracking"],
    makerKeys: ["m1"],
  },
  {
    name: "ClauseCheck",
    tagline: "AI contract review built for startups without a legal team.",
    description:
      "ClauseCheck flags risky clauses in vendor and hiring contracts in minutes and explains the risk in plain English.",
    websiteUrl: "https://clausecheck.ai",
    pricingType: "paid",
    categorySlugs: ["fintech", "ai"],
    topics: ["legal-tech", "ai-agents"],
    makerKeys: ["m2"],
    featured: true,
  },
  {
    name: "RecipeRadar",
    tagline: "Meal plans built from what's already in your fridge.",
    description:
      "RecipeRadar scans a photo of your fridge or pantry and suggests recipes and a shopping list for what's actually missing.",
    websiteUrl: "https://reciperadar.app",
    pricingType: "free",
    categorySlugs: ["health-fitness"],
    topics: ["health", "automation"],
    makerKeys: ["m3", "m7"],
  },
  {
    name: "BrandLoom",
    tagline: "A full brand kit for indie founders in one afternoon.",
    description:
      "BrandLoom generates a logo, color palette, type system, and social templates from a short brand brief, ready to export.",
    websiteUrl: "https://brandloom.design",
    pricingType: "freemium",
    categorySlugs: ["design", "marketing"],
    topics: ["branding", "design-systems", "marketing-tools"],
    makerKeys: ["m5", "m9"],
  },
  {
    name: "QueueSense",
    tagline: "AI that decides which support ticket to answer first.",
    description:
      "QueueSense reads incoming tickets for urgency and churn risk and reorders your support queue before your team even opens it.",
    websiteUrl: "https://queuesense.ai",
    pricingType: "paid",
    categorySlugs: ["ai", "saas"],
    topics: ["customer-support", "ai-agents"],
    makerKeys: ["m2", "m11"],
  },
  {
    name: "PathPeer",
    tagline: "Mentorship matching that goes beyond a shared job title.",
    description:
      "PathPeer matches mentors and mentees on goals and working style, not just industry, and nudges both sides to keep the relationship active.",
    websiteUrl: "https://pathpeer.org",
    pricingType: "free",
    categorySlugs: ["education", "saas"],
    topics: ["mentorship", "learning"],
    makerKeys: ["m6", "m1"],
  },
  {
    name: "ShelfSort",
    tagline: "Inventory management sized for small retailers.",
    description:
      "ShelfSort tracks stock across a handful of locations and warns you before you run out, without the enterprise-software price tag.",
    websiteUrl: "https://shelfsort.app",
    pricingType: "freemium",
    categorySlugs: ["saas", "productivity"],
    topics: ["inventory", "automation"],
    makerKeys: ["m8", "m13"],
  },
  {
    name: "WaveDesk",
    tagline: "Async standups that respect everyone's timezone.",
    description:
      "WaveDesk collects daily updates on each person's own schedule and rolls them into one digest, so remote teams can skip the live standup.",
    websiteUrl: "https://wavedesk.app",
    pricingType: "free",
    categorySlugs: ["productivity", "saas"],
    topics: ["remote-work", "productivity"],
    makerKeys: ["m4", "m10"],
  },
  {
    name: "NestNotes",
    tagline: "A collaborative whiteboard that keeps up with remote teams.",
    description:
      "NestNotes gives distributed teams an infinite whiteboard with live cursors, sticky notes, and templates for retros and planning.",
    websiteUrl: "https://nestnotes.app",
    pricingType: "freemium",
    categorySlugs: ["design", "productivity"],
    topics: ["remote-work", "design-systems"],
    makerKeys: ["m12", "m3"],
  },
  {
    name: "TrailMint",
    tagline: "A habit tracker that pays out streak-based rewards.",
    description:
      "TrailMint turns daily habits into a streak game, with small real rewards from partner brands for hitting your milestones.",
    websiteUrl: "https://trailmint.app",
    pricingType: "free",
    categorySlugs: ["health-fitness", "productivity"],
    topics: ["habit-tracking", "health"],
    makerKeys: ["m9", "m1"],
  },
  {
    name: "CircuitBox",
    tagline: "A prototyping kit that gets hardware hackers to 'it works' faster.",
    description:
      "CircuitBox bundles a reusable dev board, sensors, and a visual firmware builder so hobbyists can prototype hardware ideas in a weekend.",
    websiteUrl: "https://circuitbox.dev",
    pricingType: "paid",
    categorySlugs: ["hardware", "education"],
    topics: ["wearables", "learning"],
    makerKeys: ["m7", "m13"],
  },
  {
    name: "AdOrbit",
    tagline: "One dashboard that shifts your ad spend to what's working.",
    description:
      "AdOrbit watches performance across every ad channel and automatically reallocates budget toward the campaigns converting best.",
    websiteUrl: "https://adorbit.ai",
    pricingType: "paid",
    categorySlugs: ["marketing", "ai"],
    topics: ["marketing-tools", "ai-agents", "automation"],
    makerKeys: ["m2", "m5", "m8"],
    featured: true,
  },
  {
    name: "Insightloop",
    tagline: "Turn scattered customer feedback into ranked, actionable themes.",
    description:
      "Insightloop pulls in reviews, support tickets, and survey responses, then clusters them into themes ranked by impact so teams know what to fix first.",
    websiteUrl: "https://insightloop.ai",
    pricingType: "freemium",
    categorySlugs: ["ai", "marketing"],
    topics: ["customer-support", "ai-agents", "marketing-tools"],
    makerKeys: ["m10", "m11", "m12"],
  },
  {
    name: "Fernweh",
    tagline: "Travel itineraries built around local guides, not listicles.",
    description:
      "Fernweh plans a day-by-day itinerary from your interests and connects you with a local guide for anything you'd rather not book blind.",
    websiteUrl: "https://fernweh.app",
    pricingType: "free",
    categorySlugs: ["productivity", "education"],
    topics: ["learning", "remote-work"],
    makerKeys: ["m1", "m6", "m9"],
  },
];

const COMMENT_TEMPLATES = [
  "Been using {name} for a week now — exactly what our team needed.",
  "How does {name} handle onboarding for larger teams?",
  "Love the direction here. Any plans for a public API?",
  "This solves a problem I've been hacking around for months. Nice work.",
  "Curious about pricing once we're past the free tier — bookmarking this.",
  "The UI in the demo looks really clean.",
  "Congrats on the launch! How long did {name} take to build?",
  "We evaluated a few alternatives and this looks the most promising so far.",
];

const REPLY_TEMPLATES = [
  "Thanks! That's on the roadmap for the next release.",
  "Great question — yes, that's coming soon.",
  "Appreciate it! It took a few months from idea to launch.",
  "We kept it intentionally minimal, glad it shows.",
];

/** Seeds a couple of top-level comments (one with a maker reply) per product, backed by real commentUpvotes rows. */
async function seedCommentsForProduct(
  ctx: MutationCtx,
  product: SeedProduct,
  productId: Id<"products">,
  i: number,
  makerIdByKey: Map<string, Id<"users">>,
) {
  const authorKey1 = ALL_MAKER_KEYS[i % ALL_MAKER_KEYS.length];
  const authorKey2 = ALL_MAKER_KEYS[(i + 5) % ALL_MAKER_KEYS.length];
  const author1 = makerIdByKey.get(authorKey1);
  const author2 = makerIdByKey.get(authorKey2);
  if (!author1 || !author2) return;

  const comment1Id = await ctx.db.insert("comments", {
    productId,
    authorId: author1,
    body: COMMENT_TEMPLATES[i % COMMENT_TEMPLATES.length].replace("{name}", product.name),
    upvoteCount: 0,
  });
  const comment2Id = await ctx.db.insert("comments", {
    productId,
    authorId: author2,
    body: COMMENT_TEMPLATES[(i + 3) % COMMENT_TEMPLATES.length].replace("{name}", product.name),
    upvoteCount: 0,
  });

  if (i % 2 === 0) {
    const replyAuthorId = makerIdByKey.get(product.makerKeys[0]);
    if (replyAuthorId) {
      await ctx.db.insert("comments", {
        productId,
        authorId: replyAuthorId,
        parentCommentId: comment1Id,
        body: REPLY_TEMPLATES[i % REPLY_TEMPLATES.length],
        upvoteCount: 0,
      });
    }
  }

  for (const [commentId, authorKey] of [
    [comment1Id, authorKey1],
    [comment2Id, authorKey2],
  ] as const) {
    const upvoterKeys = ALL_MAKER_KEYS.filter((key) => key !== authorKey).slice(0, 1 + (i % 3));
    let count = 0;
    for (const upvoterKey of upvoterKeys) {
      const userId = makerIdByKey.get(upvoterKey);
      if (!userId) continue;
      await ctx.db.insert("commentUpvotes", { commentId, userId });
      count++;
    }
    await ctx.db.patch(commentId, { upvoteCount: count });
  }
}

/**
 * One-off seed for 13 maker users and 27 products spread across them (some
 * solo, some collaborative), plus comments on every product. Safe to re-run —
 * skips users/products/comments that already exist.
 */
export const seed = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const categoryIdBySlug = new Map<string, Id<"categories">>();
    for (const name of CATEGORY_NAMES) {
      const slug = slugify(name);
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      const id = existing ? existing._id : await ctx.db.insert("categories", { name, slug });
      categoryIdBySlug.set(slug, id);
    }

    const makerIdByKey = new Map<string, Id<"users">>();
    for (const maker of MAKERS) {
      const tokenIdentifier = `seed|${maker.key}`;
      const existing = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
      const id = existing
        ? existing._id
        : await ctx.db.insert("users", {
            tokenIdentifier,
            name: maker.name,
            avatarUrl: maker.avatarUrl,
          });
      makerIdByKey.set(maker.key, id);
    }

    for (let i = 0; i < PRODUCTS.length; i++) {
      const product = PRODUCTS[i];
      const slug = slugify(product.name);

      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      let productId: Id<"products">;
      if (existing) {
        productId = existing._id;
      } else {
        const submitterId = makerIdByKey.get(product.makerKeys[0]);
        if (!submitterId) throw new Error(`Unknown maker key ${product.makerKeys[0]}`);

        productId = await ctx.db.insert("products", {
          name: product.name,
          slug,
          tagline: product.tagline,
          description: product.description,
          websiteUrl: product.websiteUrl,
          pricingType: product.pricingType,
          logoSeed: slug,
          submitterId,
          launchDay: daysAgoInIST(i % 14),
          upvoteCount: 0,
          isFeatured: product.featured ?? false,
        });

        for (const categorySlug of product.categorySlugs) {
          const categoryId = categoryIdBySlug.get(categorySlug);
          if (!categoryId) throw new Error(`Unknown category slug ${categorySlug}`);
          await ctx.db.insert("productCategories", { productId, categoryId });
        }

        const topicIds = new Set<Id<"topics">>();
        for (const topicName of product.topics) {
          topicIds.add(await getOrCreateTopic(ctx, topicName));
        }
        for (const topicId of topicIds) {
          await ctx.db.insert("productTopics", { productId, topicId });
        }

        const makerIds = new Set(
          product.makerKeys.map((key) => {
            const id = makerIdByKey.get(key);
            if (!id) throw new Error(`Unknown maker key ${key}`);
            return id;
          }),
        );
        for (const userId of makerIds) {
          await ctx.db.insert("makers", { productId, userId });
        }

        const desiredUpvotes = product.featured ? 10 + (i % 3) : 2 + (i % 8);
        const upvoterKeys = ALL_MAKER_KEYS.filter(
          (key) => !product.makerKeys.includes(key),
        ).slice(0, desiredUpvotes);
        let upvoteCount = 0;
        for (const upvoterKey of upvoterKeys) {
          const userId = makerIdByKey.get(upvoterKey);
          if (!userId) continue;
          await ctx.db.insert("upvotes", { productId, userId });
          upvoteCount++;
        }
        await ctx.db.patch(productId, { upvoteCount });
      }

      const hasComments = await ctx.db
        .query("comments")
        .withIndex("by_product", (q) => q.eq("productId", productId))
        .first();
      if (!hasComments) {
        await seedCommentsForProduct(ctx, product, productId, i, makerIdByKey);
      }
    }
  },
});
