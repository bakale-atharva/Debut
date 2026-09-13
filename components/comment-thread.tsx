"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Reply as ReplyIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

type CommentWithMeta = Doc<"comments"> & {
  authorName: string;
  authorAvatarUrl: string | undefined;
  isMaker: boolean;
  viewerHasUpvoted: boolean;
};

export function CommentThread({ productId }: { productId: Id<"products"> }) {
  const { isSignedIn } = useAuth();
  const comments = useQuery(api.comments.listForProduct, { productId });
  const createComment = useMutation(api.comments.create);

  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setIsPosting(true);
    try {
      await createComment({ productId, body });
      setDraft("");
    } finally {
      setIsPosting(false);
    }
  }

  const topLevel = comments?.filter((c) => !c.parentCommentId) ?? [];
  const repliesByParent = new Map<Id<"comments">, CommentWithMeta[]>();
  for (const comment of comments ?? []) {
    if (!comment.parentCommentId) continue;
    const list = repliesByParent.get(comment.parentCommentId) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parentCommentId, list);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">
        Discussion{comments ? ` (${comments.length})` : ""}
      </h2>

      {isSignedIn ? (
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Join the discussion"
            rows={3}
          />
          <Button
            type="submit"
            disabled={isPosting || !draft.trim()}
            className="self-end rounded-full"
          >
            {isPosting ? "Posting…" : "Comment"}
          </Button>
        </form>
      ) : (
        <SignInButton mode="modal">
          <Button variant="outline" className="self-start rounded-full">
            Sign in to comment
          </Button>
        </SignInButton>
      )}

      {comments === undefined ? (
        <p className="text-muted-foreground">Loading comments…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-muted-foreground">No comments yet — be the first.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={repliesByParent.get(comment._id) ?? []}
              productId={productId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  productId,
}: {
  comment: CommentWithMeta;
  replies: CommentWithMeta[];
  productId: Id<"products">;
}) {
  const { isSignedIn } = useAuth();
  const toggleUpvote = useMutation(api.comments.toggleUpvote);
  const createComment = useMutation(api.comments.create);

  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [isPostingReply, setIsPostingReply] = useState(false);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    const body = replyDraft.trim();
    if (!body) return;
    setIsPostingReply(true);
    try {
      await createComment({ productId, body, parentCommentId: comment._id });
      setReplyDraft("");
      setIsReplying(false);
    } finally {
      setIsPostingReply(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <CommentRow
        comment={comment}
        onUpvote={() => toggleUpvote({ commentId: comment._id })}
        onReply={isSignedIn ? () => setIsReplying((v) => !v) : undefined}
      />

      {isReplying && (
        <form onSubmit={handleReply} className="ml-9 flex flex-col gap-2">
          <Textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder={`Reply to ${comment.authorName}`}
            rows={2}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPostingReply || !replyDraft.trim()}
            className="self-end rounded-full"
          >
            {isPostingReply ? "Posting…" : "Reply"}
          </Button>
        </form>
      )}

      {replies.length > 0 && (
        <div className="ml-9 flex flex-col divide-y divide-border border-l border-border pl-4">
          {replies.map((reply) => (
            <div key={reply._id} className="py-3 first:pt-0">
              <CommentRow comment={reply} onUpvote={() => toggleUpvote({ commentId: reply._id })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  onUpvote,
  onReply,
}: {
  comment: CommentWithMeta;
  onUpvote: () => void;
  onReply?: () => void;
}) {
  const { isSignedIn } = useAuth();

  const upvoteButton = (
    <button
      onClick={onUpvote}
      className={cn(
        "flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground hover:text-signal-text",
        comment.viewerHasUpvoted && "text-signal-text",
      )}
    >
      <ArrowUp className="size-3" />
      {comment.upvoteCount}
    </button>
  );

  return (
    <div className="flex gap-3">
      <UserAvatar name={comment.authorName} avatarUrl={comment.authorAvatarUrl} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{comment.authorName}</span>
          {comment.isMaker && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Maker
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
        <div className="mt-1 flex items-center gap-3">
          {isSignedIn ? upvoteButton : <SignInButton mode="modal">{upvoteButton}</SignInButton>}
          {onReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ReplyIcon className="size-3" />
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
