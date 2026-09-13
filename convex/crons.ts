import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 18:30 UTC = 00:00 IST — snapshots the day that just closed, plus the
// in-progress week/month it belongs to.
crons.cron(
  "snapshot rankings at IST midnight",
  "30 18 * * *",
  internal.rankings.snapshotRankings,
  {},
);

export default crons;
