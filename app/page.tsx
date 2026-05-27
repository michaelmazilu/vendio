"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import Stepper from "@/components/Stepper";
import ConnectStep from "@/components/steps/ConnectStep";
import DashboardStep from "@/components/steps/DashboardStep";
import GeneratingStep from "@/components/steps/GeneratingStep";
import HomeStep from "@/components/steps/HomeStep";
import InboxStep from "@/components/steps/InboxStep";
import PostingStep from "@/components/steps/PostingStep";
import ReviewStep from "@/components/steps/ReviewStep";
import UploadStep from "@/components/steps/UploadStep";
import { generateListingFromPhotos } from "@/lib/client/marketplaceFlow";
import type {
  AppStep,
  GeneratedListing,
  ListingWithActivity,
  Marketplace,
  MarketplacePostResult,
  UploadedPhoto,
} from "@/types/app";

const flowSteps = [
  { key: "connect", label: "Connect" },
  { key: "upload", label: "Photos" },
  { key: "review", label: "Review" },
  { key: "dashboard", label: "Live" },
];

const stepToFlowIndex: Partial<Record<AppStep, number>> = {
  connect: 0,
  upload: 1,
  generating: 2,
  review: 2,
  posting: 3,
  dashboard: 3,
};

export default function Page() {
  const [step, setStep] = useState<AppStep>("home");
  const [connected, setConnected] = useState<Marketplace[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [notes, setNotes] = useState("");
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [storedImageIds, setStoredImageIds] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingWithActivity[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMarketplace(marketplace: Marketplace) {
    setConnected((current) =>
      current.includes(marketplace)
        ? current.filter((id) => id !== marketplace)
        : [...current, marketplace],
    );
  }

  function goHome() {
    setStep("home");
  }

  function resetFlow() {
    setPhotos([]);
    setNotes("");
    setListing(null);
    setStoredImageIds([]);
    setGenerateError(null);
    setPostError(null);
    setStep("upload");
  }

  const runGeneration = useCallback(async () => {
    setGenerateError(null);
    setStep("generating");

    try {
      const generated = await generateListingFromPhotos({
        photos: photos.map((photo) => photo.file),
        notes,
      });
      setListing(generated.listing);
      setStoredImageIds(generated.imageIds);
      setStep("review");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate listing from your photos.";
      setGenerateError(message);
      setStep("upload");
    }
  }, [notes, photos]);

  function startGeneration() {
    void runGeneration();
  }

  function finishPosting(results: MarketplacePostResult[]) {
    if (!listing) {
      return;
    }

    const marketplaceUrls = Object.fromEntries(
      results
        .filter((result) => result.listingUrl)
        .map((result) => [result.marketplace, result.listingUrl!]),
    ) as Partial<Record<Marketplace, string>>;

    const postMessages = Object.fromEntries(
      results.map((result) => [result.marketplace, result.message]),
    ) as Partial<Record<Marketplace, string>>;

    const primaryUrl =
      results.find((result) => result.listingUrl)?.listingUrl ??
      (connected[0] === "facebook"
        ? "https://www.facebook.com/marketplace"
        : "https://www.kijiji.ca");

    const id = `listing-${Date.now().toString(36)}`;

    const postedSummary: ListingWithActivity = {
      id,
      listing,
      marketplaces: [...connected],
      primaryPhotoUrl: photos[0]?.previewUrl ?? "",
      photoUrls: photos.map((photo) => photo.previewUrl),
      postedAt: new Date().toISOString(),
      listingUrl: primaryUrl,
      marketplaceUrls,
      postMessages,
      views: 0,
      saves: 0,
      conversations: [],
    };

    setListings((current) => [postedSummary, ...current]);
    setActiveListingId(id);
    setPostError(null);
    setStep("dashboard");
  }

  function openInbox(listingId?: string) {
    if (listingId) {
      setActiveListingId(listingId);
    }
    setStep("inbox");
  }

  const flowIndex = useMemo(() => stepToFlowIndex[step], [step]);
  const canPost = storedImageIds.length > 0;
  const showStepper = flowIndex !== undefined && step !== "home" && step !== "inbox";

  const activeSummary = useMemo(
    () => listings.find((entry) => entry.id === activeListingId) ?? null,
    [listings, activeListingId],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        onHome={goHome}
        isHome={step === "home"}
        showInbox={listings.length > 0}
        onOpenInbox={() => openInbox()}
        totalUnread={listings.reduce(
          (sum, listingItem) =>
            sum + listingItem.conversations.reduce((c, convo) => c + convo.unread, 0),
          0,
        )}
      />

      {showStepper ? (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <Stepper steps={flowSteps} currentIndex={flowIndex ?? 0} />
          </div>
        </div>
      ) : null}

      <main>
        {step === "home" ? <HomeStep onStart={() => setStep("connect")} /> : null}

        {step === "connect" ? (
          <ConnectStep
            connected={connected}
            onToggle={toggleMarketplace}
            onContinue={() => setStep("upload")}
            onBack={goHome}
          />
        ) : null}

        {step === "upload" ? (
          <UploadStep
            photos={photos}
            notes={notes}
            marketplaces={connected}
            onPhotosChange={setPhotos}
            onNotesChange={setNotes}
            onGenerate={startGeneration}
            onBack={() => setStep("connect")}
          />
        ) : null}

        {step === "generating" ? <GeneratingStep error={generateError} /> : null}

        {step === "review" && listing ? (
          <ReviewStep
            listing={listing}
            photos={photos}
            marketplaces={connected}
            onChange={setListing}
            onSubmit={() => {
              if (!canPost) {
                return;
              }
              setPostError(null);
              setStep("posting");
            }}
            onBack={() => setStep("upload")}
            postBlockedMessage={
              postError ??
              (!canPost
                ? "Photos were not saved on the server. Go back and generate again before posting."
                : null)
            }
            generateWarning={generateError}
          />
        ) : null}

        {step === "posting" && listing && canPost ? (
          <PostingStep
            marketplaces={connected}
            listing={listing}
            imageIds={storedImageIds}
            onComplete={finishPosting}
            onError={(message) => {
              setPostError(message);
              setStep("review");
            }}
          />
        ) : null}

        {step === "dashboard" && activeSummary ? (
          <DashboardStep
            summary={activeSummary}
            onCreateAnother={resetFlow}
            onViewListing={() => openInbox(activeSummary.id)}
          />
        ) : null}

        {step === "inbox" ? (
          <InboxStep
            listings={listings}
            setListings={setListings}
            defaultListingId={activeListingId ?? undefined}
            onCreateAnother={resetFlow}
            onBack={goHome}
          />
        ) : null}
      </main>
    </div>
  );
}
