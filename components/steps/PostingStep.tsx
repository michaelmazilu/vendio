"use client";

import { useEffect, useState } from "react";

import {
  CheckIcon,
  FacebookIcon,
  KijijiIcon,
  RocketIcon,
} from "@/components/Icons";
import { postListingToMarketplace } from "@/lib/client/marketplaceFlow";
import type {
  GeneratedListing,
  Marketplace,
  MarketplacePostResult,
} from "@/types/app";

type PostingStepProps = {
  marketplaces: Marketplace[];
  listing: GeneratedListing;
  imageIds: string[];
  onComplete: (results: MarketplacePostResult[]) => void;
  onError: (message: string) => void;
};

const stages = [
  "Opening marketplace...",
  "Uploading photos...",
  "Filling listing details...",
  "Reviewing post...",
  "Publishing listing...",
];

export default function PostingStep({
  marketplaces,
  listing,
  imageIds,
  onComplete,
  onError,
}: PostingStepProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [activeMarketplace, setActiveMarketplace] = useState<Marketplace | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results: MarketplacePostResult[] = [];

      try {
        for (let index = 0; index < marketplaces.length; index += 1) {
          if (cancelled) {
            return;
          }

          const marketplace = marketplaces[index]!;
          setActiveMarketplace(marketplace);
          setActiveStage(Math.min(stages.length - 1, 1 + index * 2));

          const result = await postListingToMarketplace({
            marketplace,
            listing,
            imageIds,
          });
          results.push(result);

          setActiveStage(Math.min(stages.length - 1, 2 + index * 2));
        }

        setActiveStage(stages.length - 1);
        if (!cancelled) {
          onComplete(results);
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Could not post listing.");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [marketplaces, listing, imageIds, onComplete, onError]);

  const progress = Math.min(1, (activeStage + 1) / stages.length);

  return (
    <div className="vendio-step-enter mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <RocketIcon className="h-8 w-8 text-indigo-600" />
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Posting your listing
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Vendio is actively filling{" "}
        <span className="font-medium text-slate-900">
          {marketplaces.length === 2
            ? "Facebook Marketplace and Kijiji"
            : marketplaces[0] === "facebook"
              ? "Facebook Marketplace"
              : "Kijiji"}
        </span>
        {activeMarketplace ? (
          <>
            {" "}
            — now on{" "}
            <span className="font-medium text-slate-900">
              {activeMarketplace === "facebook" ? "Facebook" : "Kijiji"}
            </span>
          </>
        ) : null}
        .
      </p>

      <div className="mt-8 w-full">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {Math.round(progress * 100)}% complete
        </p>
      </div>

      <ol className="mt-8 w-full space-y-3 text-left">
        {stages.map((label, index) => {
          const isDone = index < activeStage;
          const isActive = index === activeStage;

          return (
            <li
              key={label}
              className={`relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3 text-sm transition ${
                isActive
                  ? "border-indigo-200 ring-1 ring-indigo-100"
                  : isDone
                    ? "border-slate-200"
                    : "border-slate-200 opacity-60"
              } ${isActive ? "vendio-shimmer" : ""}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                  isDone
                    ? "bg-indigo-600 text-white"
                    : isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 vendio-pulse-dot" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`font-medium ${
                  isActive ? "text-slate-900" : isDone ? "text-slate-700" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
        {marketplaces.includes("facebook") ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
            <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />
            Facebook
          </span>
        ) : null}
        {marketplaces.includes("kijiji") ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1">
            <KijijiIcon className="h-3.5 w-3.5 text-emerald-700" />
            Kijiji
          </span>
        ) : null}
      </div>
    </div>
  );
}
