"use client";

import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import Stepper from "@/components/Stepper";
import ConnectStep from "@/components/steps/ConnectStep";
import DashboardStep from "@/components/steps/DashboardStep";
import GeneratingStep from "@/components/steps/GeneratingStep";
import HomeStep from "@/components/steps/HomeStep";
import PostingStep from "@/components/steps/PostingStep";
import ReviewStep from "@/components/steps/ReviewStep";
import UploadStep from "@/components/steps/UploadStep";
import { generateMockListing } from "@/lib/mockListing";
import type {
  AppStep,
  GeneratedListing,
  Marketplace,
  PostedListingSummary,
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
  const [summary, setSummary] = useState<PostedListingSummary | null>(null);

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
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setNotes("");
    setListing(null);
    setSummary(null);
    setStep("upload");
  }

  function startGeneration() {
    const draft = generateMockListing(notes);
    setListing(draft);
    setStep("generating");
  }

  function finishPosting() {
    if (!listing) {
      return;
    }

    const id = `listing-${Date.now().toString(36)}`;
    const postedSummary: PostedListingSummary = {
      id,
      listing,
      marketplaces: [...connected],
      primaryPhotoUrl: photos[0]?.previewUrl ?? "",
      photoUrls: photos.map((photo) => photo.previewUrl),
      postedAt: new Date().toISOString(),
      listingUrl:
        connected[0] === "facebook"
          ? `https://www.facebook.com/marketplace/item/${id}`
          : `https://www.kijiji.ca/v-${id}`,
    };
    setSummary(postedSummary);
    setStep("dashboard");
  }

  const flowIndex = useMemo(() => stepToFlowIndex[step], [step]);
  const showStepper = flowIndex !== undefined && step !== "home";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onHome={goHome} isHome={step === "home"} />

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

        {step === "generating" ? (
          <GeneratingStep onComplete={() => setStep("review")} />
        ) : null}

        {step === "review" && listing ? (
          <ReviewStep
            listing={listing}
            photos={photos}
            marketplaces={connected}
            onChange={setListing}
            onSubmit={() => setStep("posting")}
            onBack={() => setStep("upload")}
          />
        ) : null}

        {step === "posting" ? (
          <PostingStep marketplaces={connected} onComplete={finishPosting} />
        ) : null}

        {step === "dashboard" && summary ? (
          <DashboardStep summary={summary} onCreateAnother={resetFlow} />
        ) : null}
      </main>
    </div>
  );
}
