/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as lib_productView from "../lib/productView.js";
import type * as lib_utils from "../lib/utils.js";
import type * as products from "../products.js";
import type * as rankings from "../rankings.js";
import type * as seed from "../seed.js";
import type * as topics from "../topics.js";
import type * as upvotes from "../upvotes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  comments: typeof comments;
  crons: typeof crons;
  files: typeof files;
  "lib/productView": typeof lib_productView;
  "lib/utils": typeof lib_utils;
  products: typeof products;
  rankings: typeof rankings;
  seed: typeof seed;
  topics: typeof topics;
  upvotes: typeof upvotes;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
