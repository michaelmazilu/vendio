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
import type { PostedListingSummary } from "@/types/app";

type DashboardStepProps = {
  summary: PostedListingSummary;
  onCreateAnother: () => void;
  onViewListing: () => void;
};

const timelineLabels = [
  { label: "Photos uploaded", Icon: UploadIcon },
  { label: "Listing generated", Icon: SparkleIcon },
  { label: "Listing submitted", Icon: CheckCircleIcon },
  { label: "Marketplace post live", Icon: RocketIcon },
];

export default function DashboardStep({ summary, onCreateAnother }: DashboardStepProps) {
  const {
    listing,
    marketplaces,
    primaryPhotoUrl,
    photoUrls,
    listingUrl,
    marketplaceUrls,
    postMessages,
    postedAt,
  } = summary;
export default function DashboardStep({
  summary,
  onCreateAnother,
  onViewListing,
}: DashboardStepProps) {
  const { listing, marketplaces, primaryPhotoUrl, photoUrls, postedAt } = summary;

  const postedDate = new Date(postedAt);
  const dateLabel = postedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="vendio-step-enter mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Your listing is live</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Vendio successfully posted to{" "}
              {marketplaces.length === 2
                ? "Facebook Marketplace and Kijiji"
                : marketplaces[0] === "facebook"
                  ? "Facebook Marketplace"
                  : "Kijiji"}
              . Buyers can find it now.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
                <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {listing.title}
                </h1>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  ${listing.price}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
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
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
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

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Marketplaces
            </p>
            <ul className="mt-4 space-y-3">
              {marketplaces.map((marketplace) => {
                const url = marketplaceUrls[marketplace];
                const message = postMessages[marketplace];

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
                          {marketplace === "facebook" ? "Facebook Marketplace" : "Kijiji"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {message ?? `Posted ${dateLabel}`}
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
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
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
              {timelineLabels.map((event, index) => {
                const Icon = event.Icon;
                return (
                  <li key={event.label} className="relative flex gap-3">
                    {index < timelineLabels.length - 1 ? (
                      <span className="absolute left-3.5 top-7 h-[calc(100%-0.25rem)] w-px bg-slate-200" />
                    ) : null}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
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
