"use client";

import { CheckIcon } from "@/components/Icons";

export type StepperStep = {
  key: string;
  label: string;
};

type StepperProps = {
  steps: StepperStep[];
  currentIndex: number;
};

export default function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className="flex w-full items-center justify-between gap-4">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <li key={step.key} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  isComplete
                    ? "border-slate-950 bg-slate-950 text-white"
                    : isActive
                      ? "border-blue-800 bg-white text-blue-800"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isComplete ? <CheckIcon className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isActive ? "text-slate-900" : isComplete ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={`h-px flex-1 transition ${
                  isComplete ? "bg-slate-950" : "bg-slate-200"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
