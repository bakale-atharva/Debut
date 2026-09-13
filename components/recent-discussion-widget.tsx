"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserAvatar } from "@/components/user-avatar";

const MAX_BODY_LENGTH = 80;

function truncate(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > MAX_BODY_LENGTH
    ? `${trimmed.slice(0, MAX_BODY_LENGTH).trimEnd()}…`
    : trimmed;
}

export function RecentDiscussionWidget() {
  const comments = useQuery(api.comments.recent, {});

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Recent discussion
      </h2>

      {comments === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No discussion yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {comments.map((comment) => (
            <Link
              key={comment._id}
              href={`/product/${comment.productSlug}`}
              className="flex gap-2.5 py-3 first:pt-0"
            >
              <UserAvatar
                name={comment.authorName}
                avatarUrl={comment.authorAvatarUrl}
                size={24}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{truncate(comment.body)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  on {comment.productName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
