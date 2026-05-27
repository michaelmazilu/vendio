"use client";

import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  RocketIcon,
  ShieldIcon,
  SparkleIcon,
  ZapIcon,
} from "@/components/Icons";

type HomeStepProps = {
  onStart: () => void;
};

const howItWorks = [
  {
    title: "Snap or upload photos",
    description:
      "Take a couple of pictures of what you're selling. That's all Vendio needs to begin.",
    icon: CameraIcon,
  },
  {
    title: "AI builds the listing",
    description:
      "Vendio writes a polished title, description, and fair price tuned to your local marketplace.",
    icon: SparkleIcon,
  },
  {
    title: "Posted everywhere",
    description:
      "Approve the draft and Vendio posts to Kijiji and Facebook Marketplace for you.",
    icon: RocketIcon,
  },
];

const benefits = [
  {
    title: "Listings in under a minute",
    description:
      "No typing titles, hunting categories, or rewriting descriptions. Vendio handles it instantly.",
    icon: ZapIcon,
  },
  {
    title: "Priced to actually sell",
    description:
      "Vendio suggests a fair, market-aware price based on the item, condition, and demand.",
    icon: CheckIcon,
  },
  {
    title: "Safe and supervised",
    description:
      "You always review and edit the final listing before it goes live. Nothing is posted without you.",
    icon: ShieldIcon,
  },
];

export default function HomeStep({ onStart }: HomeStepProps) {
  return (
    <div className="vendio-fade-in">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            AI Marketplace Autopilot
          </span>
          <h1 className="mt-7 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
            Sell your stuff in the time it takes to take a photo.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-600">
            Vendio turns your item photos into complete marketplace listings and posts them to
            Kijiji and Facebook Marketplace for you. You stay in control. Vendio does the rest.
          </p>

          <div id="get-started" className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
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

          <p className="mt-5 text-xs text-slate-500">
            No account required. No credit card. Try the full flow in seconds.
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="relative rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5">
            <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-8">
              <div className="grid gap-6 sm:grid-cols-3">
                <PreviewStat label="Avg. listing time" value="42s" />
                <PreviewStat label="Marketplaces" value="2" sub="Kijiji + Facebook" />
                <PreviewStat label="Items sold faster" value="3.4×" sub="vs. doing it yourself" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            From photo to live listing in three steps.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {howItWorks.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Why Vendio
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Selling online, finally effortless.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Vendio removes every annoying step of online resale. No more rewriting the same
              description, second-guessing the price, or copying the listing across platforms.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start a listing
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Ready to sell something?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Connect your marketplaces and Vendio will take it from there.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Get Started
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-7 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
              <SparkleIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-slate-700">Vendio</span>
            <span>— AI Marketplace Autopilot</span>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Vendio</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
