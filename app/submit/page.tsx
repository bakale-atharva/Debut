"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { X, UserPlus } from "lucide-react";
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
type MakerUser = Doc<"users">;

const MAX_CATEGORIES = 3;
const MAX_TOPICS = 5;
const MAX_MAKERS = 12;
const MAX_GALLERY_IMAGES = 10;

export default function SubmitPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const createProduct = useMutation(api.products.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const categories = useQuery(api.categories.list);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [categoryIds, setCategoryIds] = useState<Id<"categories">[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [makers, setMakers] = useState<MakerUser[]>([]);
  const [makerDraft, setMakerDraft] = useState("");
  const [activeMakerIndex, setActiveMakerIndex] = useState(0);
  const [makerDraftForIndex, setMakerDraftForIndex] = useState(makerDraft);
  const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [galleryStorageIds, setGalleryStorageIds] = useState<Id<"_storage">[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const makerResults = useQuery(
    api.users.search,
    makerDraft.trim() ? { query: makerDraft.trim() } : "skip",
  );
  const visibleMakerResults = (makerResults ?? []).filter(
    (user) => !makers.some((m) => m._id === user._id),
  );

  // Reset the highlighted suggestion whenever the query changes — adjusted during
  // render rather than in an effect, per React's "adjusting state" pattern.
  if (makerDraft !== makerDraftForIndex) {
    setMakerDraftForIndex(makerDraft);
    setActiveMakerIndex(0);
  }

  const hasUnsavedChanges =
    name.trim() !== "" ||
    tagline.trim() !== "" ||
    description.trim() !== "" ||
    websiteUrl.trim() !== "" ||
    videoUrl.trim() !== "" ||
    categoryIds.length > 0 ||
    topics.length > 0 ||
    makers.length > 0 ||
    logoStorageId !== null ||
    galleryStorageIds.length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

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

  function addMaker(user: MakerUser) {
    setMakerDraft("");
    if (makers.length >= MAX_MAKERS || makers.some((m) => m._id === user._id)) return;
    setMakers((prev) => [...prev, user]);
  }

  function handleMakerKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (visibleMakerResults.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveMakerIndex((i) => Math.min(i + 1, visibleMakerResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveMakerIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const user = visibleMakerResults[activeMakerIndex];
      if (user) addMaker(user);
    } else if (event.key === "Escape") {
      setMakerDraft("");
    }
  }

  async function uploadFile(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoPreviewUrl(URL.createObjectURL(file));
    setIsUploadingLogo(true);
    try {
      setLogoStorageId(await uploadFile(file));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(
      0,
      MAX_GALLERY_IMAGES - galleryStorageIds.length,
    );
    if (files.length === 0) return;
    setGalleryPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    setIsUploadingGallery(true);
    try {
      const uploaded = await Promise.all(files.map(uploadFile));
      setGalleryStorageIds((prev) => [...prev, ...uploaded]);
    } finally {
      setIsUploadingGallery(false);
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
        makerUserIds: makers.map((m) => m._id),
        logoStorageId: logoStorageId ?? undefined,
        galleryStorageIds: galleryStorageIds.length > 0 ? galleryStorageIds : undefined,
        videoUrl: videoUrl.trim() || undefined,
      });
      router.push(`/product/${slug}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Add to today&rsquo;s chart
      </h1>
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
                  autoComplete="url"
                  inputMode="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://…"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Media</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logo">Logo (optional — a monogram is generated otherwise)</Label>
                <div className="flex items-center gap-3">
                  {logoPreviewUrl && (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo preview"
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-[10px] object-cover"
                    />
                  )}
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
                </div>
                {isUploadingLogo && <p className="text-xs text-muted-foreground">Uploading…</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gallery">Gallery (up to {MAX_GALLERY_IMAGES} images)</Label>
                <Input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={galleryStorageIds.length >= MAX_GALLERY_IMAGES}
                  onChange={handleGalleryChange}
                />
                {isUploadingGallery && <p className="text-xs text-muted-foreground">Uploading…</p>}
                {galleryPreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {galleryPreviewUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Gallery preview"
                        width={56}
                        height={56}
                        className="size-14 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="videoUrl">Video URL (optional)</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  autoComplete="url"
                  inputMode="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/…"
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
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Makers</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="makerDraft">
                  Tag teammates (up to {MAX_MAKERS} — you&rsquo;re added automatically)
                </Label>
                <div className="relative">
                  <Input
                    id="makerDraft"
                    value={makerDraft}
                    onChange={(e) => setMakerDraft(e.target.value)}
                    onKeyDown={handleMakerKeyDown}
                    placeholder="Search by name"
                    disabled={makers.length >= MAX_MAKERS}
                    role="combobox"
                    aria-expanded={visibleMakerResults.length > 0}
                    aria-controls="maker-results"
                    aria-activedescendant={
                      visibleMakerResults.length > 0
                        ? `maker-option-${activeMakerIndex}`
                        : undefined
                    }
                  />
                  {visibleMakerResults.length > 0 && (
                    <div
                      id="maker-results"
                      role="listbox"
                      className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md"
                    >
                      {visibleMakerResults.map((user, index) => (
                        <button
                          key={user._id}
                          id={`maker-option-${index}`}
                          role="option"
                          aria-selected={index === activeMakerIndex}
                          type="button"
                          onClick={() => addMaker(user)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                            index === activeMakerIndex && "bg-accent",
                          )}
                        >
                          <UserPlus aria-hidden="true" className="size-3.5 text-muted-foreground" />
                          {user.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {makers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {makers.map((maker) => (
                      <button
                        key={maker._id}
                        type="button"
                        onClick={() => setMakers((prev) => prev.filter((m) => m._id !== maker._id))}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
                      >
                        {maker.name}
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isUploadingLogo || isUploadingGallery}
              className="w-full rounded-full"
            >
              {isSubmitting ? "Listing…" : "List it"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
