"use client";

import { useState } from "react";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FacebookIcon,
  KijijiIcon,
  ShieldIcon,
} from "@/components/Icons";
import type { Marketplace } from "@/types/app";

type ConnectStepProps = {
  connected: Marketplace[];
  onToggle: (marketplace: Marketplace) => void;
  onContinue: () => void;
  onBack: () => void;
};

type Option = {
  id: Marketplace;
  name: string;
  description: string;
  Icon: typeof FacebookIcon;
  accent: string;
};

const options: Option[] = [
  {
    id: "facebook",
    name: "Facebook Marketplace",
    description: "Reach buyers in your local community and across nearby cities.",
    Icon: FacebookIcon,
    accent: "bg-[#1877F2]/10 text-[#1877F2]",
  },
  {
    id: "kijiji",
    name: "Kijiji",
    description: "Canada's largest classifieds platform for fast local sales.",
    Icon: KijijiIcon,
    accent: "bg-emerald-50 text-emerald-700",
  },
];

export default function ConnectStep({
  connected,
  onToggle,
  onContinue,
  onBack,
}: ConnectStepProps) {
  const [connectingId, setConnectingId] = useState<Marketplace | null>(null);

  async function handleConnect(marketplace: Marketplace) {
    if (connected.includes(marketplace)) {
      onToggle(marketplace);
      return;
    }

    setConnectingId(marketplace);
    await new Promise((resolve) => setTimeout(resolve, 750));
    onToggle(marketplace);
    setConnectingId(null);
  }

  const canContinue = connected.length > 0;

  return (
    <div className="vendio-step-enter mx-auto max-w-3xl px-6 pt-14 pb-20">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="mt-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Step 1 of 3
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Connect your marketplaces
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-slate-600">
          Pick where Vendio should post your listing. You can connect one or both. We never post
          without your approval.
        </p>
      </div>

      <div className="mt-10 grid gap-4">
        {options.map((option) => {
          const isConnected = connected.includes(option.id);
          const isConnecting = connectingId === option.id;
          const Icon = option.Icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleConnect(option.id)}
              disabled={isConnecting}
              className={`group flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition disabled:cursor-not-allowed ${
                isConnected
                  ? "border-indigo-200 ring-1 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300 hover:shadow"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${option.accent}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900">{option.name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{option.description}</p>
                </div>
              </div>

              <div className="shrink-0">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Connected
                  </span>
                ) : isConnecting ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="vendio-spinner h-4 w-4 rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    Connecting...
                  </span>
                ) : (
                  <span className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                    Connect
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <ShieldIcon className="h-4 w-4" />
        </span>
        <p className="text-sm leading-6 text-slate-600">
          Vendio uses a secure browser session on your device. Credentials are never stored on our
          servers, and you can disconnect at any time.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-500">
          {canContinue
            ? `${connected.length} marketplace${connected.length === 1 ? "" : "s"} connected`
            : "Connect at least one marketplace to continue."}
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
