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
import { buildListingWithActivity, revokeUploadedPhotos } from "@/lib/client/listingSummary";
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
  const [listingSessionId, setListingSessionId] = useState<string | null>(null);
  const [storedImageIds, setStoredImageIds] = useState<string[]>([]);
  const [storedImageUrls, setStoredImageUrls] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingWithActivity[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokeUploadedPhotos(photos);
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
    revokeUploadedPhotos(photos);
    setPhotos([]);
    setNotes("");
    setListing(null);
    setListingSessionId(null);
    setStoredImageIds([]);
    setStoredImageUrls([]);
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
      setListingSessionId(generated.listingId);
      setStoredImageIds(generated.imageIds);
      setStoredImageUrls(generated.imageUrls);
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

    const id = listingSessionId ?? `listing-${Date.now().toString(36)}`;
    const postedAt = new Date().toISOString();
    const photoUrls =
      storedImageUrls.length > 0
        ? storedImageUrls
        : photos.map((photo) => photo.previewUrl);

    const postedSummary = buildListingWithActivity({
      id,
      listing,
      marketplaces: [...connected],
      photoUrls,
      postedAt,
      results,
    });

    setListings((current) => [postedSummary, ...current]);
    setActiveListingId(id);
    setPostError(null);
    setStep("dashboard");
  }

  function openInbox(listingId?: string) {
    if (listingId) {
      setActiveListingId(listingId);
    } else if (!activeListingId && listings.length > 0) {
      setActiveListingId(listings[0]!.id);
    }
    setStep("inbox");
  }

  const flowIndex = useMemo(() => stepToFlowIndex[step], [step]);
  const canPost = storedImageIds.length > 0;
  const showStepper = flowIndex !== undefined && step !== "home" && step !== "inbox";

  const activeSummary = useMemo(() => {
    if (activeListingId) {
      return listings.find((entry) => entry.id === activeListingId) ?? null;
    }
    return listings[0] ?? null;
  }, [listings, activeListingId]);

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
            generateError={generateError}
            onPhotosChange={setPhotos}
            onNotesChange={setNotes}
            onGenerate={startGeneration}
            onBack={() => setStep("connect")}
          />
        ) : null}

        {step === "generating" ? <GeneratingStep error={null} /> : null}

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
