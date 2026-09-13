"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PricingType = Doc<"products">["pricingType"];

const MAX_CATEGORIES = 3;
const MAX_TOPICS = 5;

export default function SubmitPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const createProduct = useMutation(api.products.create);
  const categories = useQuery(api.categories.list);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [categoryIds, setCategoryIds] = useState<Id<"categories">[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <p className="text-muted-foreground">Sign in to submit a product.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </main>
    );
  }

  function toggleCategory(id: Id<"categories">, checked: boolean) {
    setCategoryIds((prev) => {
      if (checked) {
        return prev.length >= MAX_CATEGORIES ? prev : [...prev, id];
      }
      return prev.filter((existing) => existing !== id);
    });
  }

  function addTopic() {
    const name = topicDraft.trim();
    setTopicDraft("");
    if (!name || topics.length >= MAX_TOPICS || topics.includes(name)) return;
    setTopics((prev) => [...prev, name]);
  }

  function handleTopicKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTopic();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { slug } = await createProduct({
        name,
        tagline,
        description,
        websiteUrl,
        pricingType,
        categoryIds,
        topicNames: topics,
      });
      router.push(`/product/${slug}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Add to today&rsquo;s chart</h1>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Basics</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A one-line pitch"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Pricing & categories</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pricingType">Pricing</Label>
                <Select
                  value={pricingType}
                  onValueChange={(value) => setPricingType(value as PricingType)}
                >
                  <SelectTrigger id="pricingType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Categories (up to {MAX_CATEGORIES})</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories?.map((category) => {
                    const checked = categoryIds.includes(category._id);
                    const disabled = !checked && categoryIds.length >= MAX_CATEGORIES;
                    return (
                      <button
                        key={category._id}
                        type="button"
                        aria-pressed={checked}
                        disabled={disabled}
                        onClick={() => toggleCategory(category._id, !checked)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50",
                          checked
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-foreground hover:bg-accent",
                        )}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Topics</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="topicDraft">Topics (up to {MAX_TOPICS})</Label>
                <Input
                  id="topicDraft"
                  value={topicDraft}
                  onChange={(e) => setTopicDraft(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  onBlur={addTopic}
                  placeholder="Type a topic and press Enter"
                  disabled={topics.length >= MAX_TOPICS}
                />
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setTopics((prev) => prev.filter((t) => t !== topic))}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
                      >
                        {topic}
                        <X className="size-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full rounded-full">
              {isSubmitting ? "Listing…" : "List it"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
