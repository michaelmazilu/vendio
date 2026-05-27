"use client";

import {
  CheckCircleIcon,
  FacebookIcon,
  InboxIcon,
  KijijiIcon,
  PlusIcon,
  RocketIcon,
  SparkleIcon,
  UploadIcon,
} from "@/components/Icons";
import type { Marketplace, PostedListingSummary } from "@/types/app";

type DashboardStepProps = {
  summary: PostedListingSummary;
  onCreateAnother: () => void;
  onViewListing: () => void;
};

const baseTimelineLabels = [
  { label: "Photos uploaded", Icon: UploadIcon },
  { label: "Listing generated", Icon: SparkleIcon },
  { label: "Listing submitted", Icon: CheckCircleIcon },
];

export default function DashboardStep({
  summary,
  onCreateAnother,
  onViewListing,
}: DashboardStepProps) {
  const {
    listing,
    marketplaces,
    primaryPhotoUrl,
    photoUrls,
    marketplaceUrls,
    postMessages,
    marketplaceStatuses,
    postedAt,
  } = summary;

  const postedDate = new Date(postedAt);
  const dateLabel = postedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const marketplaceLabel = (m: Marketplace) => (m === "facebook" ? "Facebook Marketplace" : "Kijiji");
  const liveMarketplaces = marketplaces.filter((m) => marketplaceStatuses[m] === "published");
  const draftMarketplaces = marketplaces.filter((m) => marketplaceStatuses[m] !== "published");
  const allLive = draftMarketplaces.length === 0;
  const allDraft = liveMarketplaces.length === 0;

  const bannerTone = allLive
    ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
    : allDraft
      ? "border-amber-100 bg-amber-50/70 text-amber-800"
      : "border-amber-100 bg-amber-50/70 text-amber-800";
  const bannerIconTone = allLive
    ? "text-emerald-600 ring-emerald-100"
    : "text-amber-600 ring-amber-100";
  const bannerTitle = allLive
    ? "Your listing is live"
    : allDraft
      ? "Draft is open in the browser"
      : "Partially live";
  const bannerBody = allLive
    ? `Vendio published to ${liveMarketplaces.map(marketplaceLabel).join(" and ")}. Buyers can find it now.`
    : allDraft
      ? `Vendio filled the form on ${draftMarketplaces
          .map(marketplaceLabel)
          .join(" and ")} but couldn't auto-publish. Open the tab below to review and click Publish.`
      : `Live on ${liveMarketplaces
          .map(marketplaceLabel)
          .join(" and ")}. Still a draft on ${draftMarketplaces
          .map(marketplaceLabel)
          .join(" and ")} — open it to finish.`;

  return (
    <div className="vendio-step-enter mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className={`rounded-2xl border p-5 shadow-sm ${bannerTone}`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ${bannerIconTone}`}
          >
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{bannerTitle}</p>
            <p className="mt-0.5 text-sm">{bannerBody}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="aspect-[16/10] w-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryPhotoUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>

          {photoUrls.length > 1 ? (
            <div className="grid grid-cols-5 gap-1.5 p-2">
              {photoUrls.slice(1, 6).map((url, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={url + index}
                  src={url}
                  alt={`${listing.title} photo ${index + 2}`}
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {allLive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Draft pending
                  </span>
                )}
                <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900">
                  {listing.title}
                </h1>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  ${listing.price}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-500">
                <p>Posted</p>
                <p className="mt-1 font-medium text-slate-700">{dateLabel}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>{listing.category}</Chip>
              <Chip>{listing.condition}</Chip>
              {marketplaces.map((marketplace) => (
                <span
                  key={marketplace}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {marketplace === "facebook" ? (
                    <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />
                  ) : (
                    <KijijiIcon className="h-3.5 w-3.5 text-emerald-700" />
                  )}
                  {marketplace === "facebook" ? "Facebook" : "Kijiji"}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {listing.description}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onViewListing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <InboxIcon className="h-4 w-4" />
                View Listing
              </button>
              <button
                type="button"
                onClick={onCreateAnother}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <PlusIcon className="h-4 w-4" />
                Create Another Listing
              </button>
            </div>
          </div>
        </section>

        <aside className="min-w-0 space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Marketplaces
            </p>
            <ul className="mt-4 space-y-3">
              {marketplaces.map((marketplace) => {
                const url = marketplaceUrls[marketplace];
                const message = postMessages[marketplace];
                const isLive = marketplaceStatuses[marketplace] === "published";

                return (
                  <li key={marketplace} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {marketplace === "facebook" ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
                          <FacebookIcon className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <KijijiIcon className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {marketplaceLabel(marketplace)}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Draft pending
                            </span>
                          )}
                          <span className="truncate text-slate-500">
                            · {message ?? `Posted ${dateLabel}`}
                          </span>
                        </p>
                      </div>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Open
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Activity
            </p>
            <ol className="mt-5 space-y-5">
              {[
                ...baseTimelineLabels,
                {
                  label: allLive ? "Marketplace post live" : "Awaiting publish in browser",
                  Icon: RocketIcon,
                  pending: !allLive,
                },
              ].map((event, index, array) => {
                const Icon = event.Icon;
                const isPending = "pending" in event && event.pending;
                return (
                  <li key={event.label} className="relative flex gap-3">
                    {index < array.length - 1 ? (
                      <span className="absolute left-3.5 top-7 h-[calc(100%-0.25rem)] w-px bg-slate-200" />
                    ) : null}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                        isPending ? "bg-amber-500" : "bg-indigo-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.label}</p>
                      <p className="text-xs text-slate-500">{dateLabel}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
