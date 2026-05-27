"use client";

import { useEffect, useState } from "react";

import { CheckIcon, SparkleIcon } from "@/components/Icons";

type GeneratingStepProps = {
  onComplete: () => void;
};

const stages = [
  "Analyzing your item...",
  "Writing your listing...",
  "Estimating a fair price...",
  "Preparing marketplace details...",
];

const stageDuration = 1100;

export default function GeneratingStep({ onComplete }: GeneratingStepProps) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((current) => {
        if (current >= stages.length - 1) {
          clearInterval(interval);
          window.setTimeout(onComplete, stageDuration);
          return current;
        }
        return current + 1;
      });
    }, stageDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="vendio-step-enter mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-200" />
        <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-500/0 [box-shadow:0_0_0_4px_rgba(79,70,229,0.08)]" />
        <SparkleIcon className="h-8 w-8 text-indigo-600 vendio-spinner" />
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Vendio is working its magic
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        This usually takes about 10 seconds. Stay on this page.
      </p>

      <ol className="mt-10 w-full space-y-3 text-left">
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
    </div>
  );
}
