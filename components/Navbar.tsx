"use client";

import { SparkleIcon } from "@/components/Icons";

type NavbarProps = {
  onHome?: () => void;
  isHome?: boolean;
};

export default function Navbar({ onHome, isHome = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-2.5 text-slate-900 transition hover:text-indigo-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Vendio</span>
        </button>

        {isHome ? (
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 sm:flex">
            <a className="transition hover:text-slate-900" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-slate-900" href="#benefits">
              Why Vendio
            </a>
            <a
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-white transition hover:bg-slate-800"
              href="#get-started"
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById("get-started");
                target?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get Started
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
