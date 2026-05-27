"use client";

import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  RocketIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/Icons";

type HomeStepProps = {
  onStart: () => void;
};

const howItWorks = [
  {
    title: "Snap or upload photos",
    description:
      "Start with a few item photos and optional notes about condition, pickup, or anything a buyer should know.",
    icon: CameraIcon,
  },
  {
    title: "Vendio drafts the listing",
    description:
      "Get a ready-to-review title, description, price, category, and marketplace-ready details.",
    icon: SparkleIcon,
  },
  {
    title: "You approve before posting",
    description:
      "Review the draft, make edits, and choose where it goes live. Nothing posts without approval.",
    icon: RocketIcon,
  },
];

const approvalSteps = [
  {
    title: "AI draft",
    description: "Vendio turns photos into a structured marketplace listing.",
    icon: SparkleIcon,
  },
  {
    title: "Human review",
    description: "You approve the title, price, description, and marketplaces.",
    icon: CheckIcon,
  },
  {
    title: "Controlled posting",
    description: "Vendio posts only after your confirmation.",
    icon: ShieldIcon,
  },
];

export default function HomeStep({ onStart }: HomeStepProps) {
  return (
    <div className="vendio-fade-in">
      <section id="product" className="relative isolate overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 -z-20 bg-[url('/images/hero-listing-gallery.png')] bg-cover bg-[position:70%_center]" />
        <div className="absolute inset-0 -z-10 bg-white/28" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,250,252,0.97)_0%,rgba(248,250,252,0.9)_34%,rgba(248,250,252,0.52)_63%,rgba(248,250,252,0.22)_100%)]" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-20 sm:pt-24 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
          <h1 className="mt-7 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Turn item photos into ready-to-post marketplace listings.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-600">
            Vendio drafts the title, description, price, and category for Kijiji and Facebook
            Marketplace. You review every detail before anything goes live.
          </p>

          <div id="get-started" className="mt-9 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </a>
          </div>
        </div>

          <ProductPreview />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A listing workflow built around review, not blind automation.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Why Vendio
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Less listing work, more control over what gets posted.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The product should feel useful before it feels flashy: Vendio removes repetitive
              writing and marketplace formatting while keeping you in charge of the final listing.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4">
              {approvalSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      {index < approvalSteps.length - 1 ? (
                        <span className="my-2 h-10 w-px bg-slate-200" />
                      ) : null}
                    </div>
                    <div className="pb-5">
                      <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-7 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-950 text-white">
              <SparkleIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-slate-700">Vendio</span>
            <span>— AI marketplace listing assistant</span>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Vendio</p>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/10">
      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            <span className="text-sm font-semibold">Listing draft</span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
            Review required
          </span>
        </div>

        <div className="grid gap-0 bg-white sm:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-slate-200 bg-slate-100 p-4 sm:border-r sm:border-b-0">
            <div className="flex aspect-square items-end overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 via-white to-blue-100 p-4">
              <div className="h-24 w-full rounded-xl border border-slate-300 bg-white/75 shadow-sm" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span className="h-12 rounded-lg bg-white" />
              <span className="h-12 rounded-lg bg-white" />
              <span className="h-12 rounded-lg bg-white" />
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                Kijiji
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                Facebook Marketplace
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Solid wood side table
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">$85</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Clean-lined walnut side table with a lower shelf. Light wear on the top edge, sturdy
              frame, and ready for pickup.
            </p>

            <div className="mt-5 grid gap-3 text-sm">
              <PreviewRow label="Category" value="Furniture" />
              <PreviewRow label="Condition" value="Good" />
              <PreviewRow label="Next step" value="Review and approve" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-950">{value}</span>
    </div>
  );
}
