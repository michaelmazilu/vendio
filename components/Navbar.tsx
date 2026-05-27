"use client";

import { InboxIcon, SparkleIcon } from "@/components/Icons";

type NavbarProps = {
  onHome?: () => void;
  isHome?: boolean;
  showInbox?: boolean;
  onOpenInbox?: () => void;
  totalUnread?: number;
};

export default function Navbar({
  onHome,
  isHome = false,
  showInbox = false,
  onOpenInbox,
  totalUnread = 0,
}: NavbarProps) {
  const inboxButton =
    showInbox && onOpenInbox ? (
      <button
        type="button"
        onClick={onOpenInbox}
        className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <InboxIcon className="h-4 w-4" />
        Inbox
        {totalUnread > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
            {totalUnread}
          </span>
        ) : null}
      </button>
    ) : null;

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
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600 sm:gap-7">
            <a className="hidden transition hover:text-slate-900 sm:inline" href="#how-it-works">
              How it works
            </a>
            <a className="hidden transition hover:text-slate-900 sm:inline" href="#benefits">
              Why Vendio
            </a>
            {inboxButton}
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
        ) : (
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
            {inboxButton}
          </nav>
        )}
      </div>
    </header>
  );
}
