"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeftIcon,
  BotIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarIcon,
  EyeIcon,
  FacebookIcon,
  HandshakeIcon,
  InboxIcon,
  KijijiIcon,
  MapPinIcon,
  MessageIcon,
  PlusIcon,
  SendIcon,
  SparkleIcon,
  ToggleOffIcon,
  ToggleOnIcon,
} from "@/components/Icons";
import type {
  AiReplyIntent,
  AiReplyResult,
  Conversation,
  ConversationStatus,
  ListingWithActivity,
  Marketplace,
  Message,
  Meetup,
} from "@/types/app";

type InboxStepProps = {
  listings: ListingWithActivity[];
  setListings: Dispatch<SetStateAction<ListingWithActivity[]>>;
  defaultListingId?: string;
  onCreateAnother: () => void;
  onBack: () => void;
};

const statusMeta: Record<ConversationStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "bg-amber-50 text-amber-700 border border-amber-100" },
  chatting: { label: "Chatting", tone: "bg-slate-100 text-slate-700 border border-slate-200" },
  negotiating: {
    label: "Negotiating",
    tone: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  },
  meetup_scheduled: {
    label: "Meetup set",
    tone: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  sold: { label: "Sold", tone: "bg-emerald-600 text-white border border-emerald-700" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-500 border border-slate-200" },
};

function intentToStatus(intent: AiReplyIntent, current: ConversationStatus): ConversationStatus {
  if (intent === "propose_meetup" || intent === "confirm_meetup") {
    return current === "meetup_scheduled" ? current : "chatting";
  }
  if (intent === "negotiate") {
    return "negotiating";
  }
  if (intent === "close_sale") {
    return "sold";
  }
  if (intent === "decline") {
    return "closed";
  }
  return current === "new" ? "chatting" : current;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) {
    return "just now";
  }
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatExactTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InboxStep({
  listings,
  setListings,
  defaultListingId,
  onCreateAnother,
  onBack,
}: InboxStepProps) {
  const initialListingId = defaultListingId ?? listings[0]?.id ?? null;
  const [selectedListingId, setSelectedListingId] = useState<string | null>(initialListingId);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(() => {
    const initial =
      listings.find((entry) => entry.id === initialListingId) ?? listings[0] ?? null;
    return initial?.conversations[0]?.id ?? null;
  });
  const [draft, setDraft] = useState("");
  const [pendingConvoIds, setPendingConvoIds] = useState<Set<string>>(() => new Set());

  const triggeredRef = useRef<Set<string>>(new Set());
  const listingsRef = useRef(listings);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const selectedConversation = useMemo<Conversation | null>(() => {
    if (!selectedListing) {
      return null;
    }
    return (
      selectedListing.conversations.find((convo) => convo.id === selectedConvoId) ??
      selectedListing.conversations[0] ??
      null
    );
  }, [selectedListing, selectedConvoId]);

  const updateConversation = useCallback(
    (listingId: string, convoId: string, updater: (convo: Conversation) => Conversation) => {
      setListings((current) =>
        current.map((listing) => {
          if (listing.id !== listingId) {
            return listing;
          }
          return {
            ...listing,
            conversations: listing.conversations.map((convo) =>
              convo.id === convoId ? updater(convo) : convo,
            ),
          };
        }),
      );
    },
    [setListings],
  );

  const appendMessage = useCallback(
    (
      listingId: string,
      convoId: string,
      message: Omit<Message, "id" | "createdAt"> & Partial<Pick<Message, "createdAt">>,
    ) => {
      const fullMessage: Message = {
        id: newId("msg"),
        createdAt: message.createdAt ?? new Date().toISOString(),
        sender: message.sender,
        content: message.content,
      };

      updateConversation(listingId, convoId, (convo) => ({
        ...convo,
        messages: [...convo.messages, fullMessage],
        lastMessageAt: fullMessage.createdAt,
        unread: message.sender === "buyer" ? convo.unread + 1 : 0,
      }));
    },
    [updateConversation],
  );

  const setPending = useCallback((convoId: string, on: boolean) => {
    setPendingConvoIds((current) => {
      const next = new Set(current);
      if (on) {
        next.add(convoId);
      } else {
        next.delete(convoId);
      }
      return next;
    });
  }, []);

  const requestAiReply = useCallback(
    async (listingId: string, convoId: string) => {
      const listing = listingsRef.current.find((item) => item.id === listingId);
      const convo = listing?.conversations.find((item) => item.id === convoId);
      if (!listing || !convo) {
        return;
      }
      const lastMessage = convo.messages[convo.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== "buyer") {
        return;
      }

      setPending(convoId, true);

      try {
        const response = await fetch("/api/ai-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listing: listing.listing,
            location: undefined,
            buyerName: convo.buyer.name,
            status: convo.status,
            messages: convo.messages,
            latestBuyerMessage: lastMessage.content,
          }),
        });

        const payload = (await response.json()) as AiReplyResult | { error?: string };
        if (!response.ok || !("reply" in payload)) {
          throw new Error("error" in payload ? payload.error : "AI reply failed.");
        }

        const aiMessage: Message = {
          id: newId("msg"),
          sender: "seller_ai",
          content: payload.reply,
          createdAt: new Date().toISOString(),
        };

        updateConversation(listingId, convoId, (current) => ({
          ...current,
          messages: [...current.messages, aiMessage],
          lastMessageAt: aiMessage.createdAt,
          status: intentToStatus(payload.intent, current.status),
          meetup: payload.meetup ?? current.meetup,
          unread: 0,
        }));

      } catch (error) {
        console.error(error);
      } finally {
        setPending(convoId, false);
      }
    },
    [setPending, updateConversation],
  );

  useEffect(() => {
    if (!selectedListing) {
      return;
    }
    for (const convo of selectedListing.conversations) {
      const last = convo.messages[convo.messages.length - 1];
      if (!last) {
        continue;
      }
      const key = `${convo.id}:${last.id}`;
      const conversationSettled =
        convo.status === "meetup_scheduled" ||
        convo.status === "sold" ||
        convo.status === "closed";
      if (
        last.sender === "buyer" &&
        convo.autopilot &&
        !conversationSettled &&
        !pendingConvoIds.has(convo.id) &&
        !triggeredRef.current.has(key)
      ) {
        triggeredRef.current.add(key);
        void requestAiReply(selectedListing.id, convo.id);
      }
    }
  }, [selectedListing, pendingConvoIds, requestAiReply]);

  function toggleAutopilot(listingId: string, convoId: string) {
    updateConversation(listingId, convoId, (current) => ({
      ...current,
      autopilot: !current.autopilot,
    }));
  }

  function markRead(listingId: string, convoId: string) {
    updateConversation(listingId, convoId, (current) => ({ ...current, unread: 0 }));
  }

  function handleSelectConvo(convoId: string) {
    setSelectedConvoId(convoId);
    if (selectedListingId) {
      markRead(selectedListingId, convoId);
    }
  }

  function handleSelectListing(listingId: string) {
    const next = listings.find((entry) => entry.id === listingId);
    setSelectedListingId(listingId);
    setSelectedConvoId(next?.conversations[0]?.id ?? null);
  }

  function handleSendUserReply() {
    if (!selectedListing || !selectedConversation) {
      return;
    }
    const text = draft.trim();
    if (!text) {
      return;
    }
    appendMessage(selectedListing.id, selectedConversation.id, {
      sender: "seller_user",
      content: text,
    });
    setDraft("");
  }

  if (!selectedListing) {
    return (
      <EmptyInbox onCreateAnother={onCreateAnother} onBack={onBack} />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
      <ListingsPane
        listings={listings}
        selectedListingId={selectedListing.id}
        onSelect={handleSelectListing}
        onCreateAnother={onCreateAnother}
        onBack={onBack}
      />

      <ListingDetailPane
        listing={selectedListing}
        selectedConvoId={selectedConversation?.id ?? null}
        onSelectConvo={handleSelectConvo}
      />

      <ConversationPane
        conversation={selectedConversation}
        isAiThinking={
          selectedConversation ? pendingConvoIds.has(selectedConversation.id) : false
        }
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSendUserReply}
        onToggleAutopilot={(convoId) => toggleAutopilot(selectedListing.id, convoId)}
      />
    </div>
  );
}

function EmptyInbox({
  onCreateAnother,
  onBack,
}: {
  onCreateAnother: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <InboxIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
        Your inbox is empty
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Post a listing and Vendio will start handling buyer conversations here.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCreateAnother}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create a listing
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back home
        </button>
      </div>
    </div>
  );
}

function ListingsPane({
  listings,
  selectedListingId,
  onSelect,
  onCreateAnother,
  onBack,
}: {
  listings: ListingWithActivity[];
  selectedListingId: string;
  onSelect: (id: string) => void;
  onCreateAnother: () => void;
  onBack: () => void;
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Home
        </button>
        <p className="text-sm font-semibold tracking-tight text-slate-900">Your Listings</p>
        <button
          type="button"
          onClick={onCreateAnother}
          aria-label="Create another listing"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {listings.map((listing) => {
          const isActive = listing.id === selectedListingId;
          const unread = listing.conversations.reduce((sum, convo) => sum + convo.unread, 0);

          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => onSelect(listing.id)}
              className={`mb-1 flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                isActive ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {listing.primaryPhotoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={listing.primaryPhotoUrl}
                    alt={listing.listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isActive ? "text-indigo-900" : "text-slate-900"
                    }`}
                  >
                    {listing.listing.title}
                  </p>
                  {unread > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                      {unread}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  ${listing.listing.price} • {listing.conversations.length} chat
                  {listing.conversations.length === 1 ? "" : "s"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ListingDetailPane({
  listing,
  selectedConvoId,
  onSelectConvo,
}: {
  listing: ListingWithActivity;
  selectedConvoId: string | null;
  onSelectConvo: (id: string) => void;
}) {
  const messageCount = listing.conversations.reduce(
    (sum, convo) => sum + convo.messages.length,
    0,
  );
  const aiHandled = listing.conversations.filter(
    (convo) => convo.status === "meetup_scheduled" || convo.status === "sold",
  ).length;

  return (
    <section className="flex w-full max-w-md shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {listing.primaryPhotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={listing.primaryPhotoUrl}
                alt={listing.listing.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">
              {listing.listing.title}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">
              ${listing.listing.price}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
              {listing.marketplaces.map((marketplace) => (
                <MarketplaceBadge key={marketplace} marketplace={marketplace} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatTile icon={EyeIcon} label="Views" value={listing.views} />
          <StatTile icon={MessageIcon} label="Messages" value={messageCount} />
          <StatTile icon={HandshakeIcon} label="Closing" value={aiHandled} />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Conversations
        </p>
        {listing.conversations.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
            <BotIcon className="h-3.5 w-3.5" />
            Vendio AI active
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {listing.conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <MessageIcon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">No messages yet</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
              When a buyer reaches out on{" "}
              {listing.marketplaces
                .map((m) => (m === "facebook" ? "Facebook Marketplace" : "Kijiji"))
                .join(" or ")}
              , Vendio AI will reply automatically and the thread will appear here.
            </p>
          </div>
        ) : null}
        {listing.conversations.map((convo) => {
          const isActive = convo.id === selectedConvoId;
          const last = convo.messages[convo.messages.length - 1];
          const preview = last ? truncate(last.content, 80) : "";
          const senderLabel = last?.sender === "buyer" ? "" : "You: ";

          return (
            <button
              key={convo.id}
              type="button"
              onClick={() => onSelectConvo(convo.id)}
              className={`relative flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition ${
                isActive ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <Avatar buyer={convo.buyer} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`truncate text-sm font-semibold ${
                      convo.unread > 0 ? "text-slate-900" : "text-slate-800"
                    }`}
                  >
                    {convo.buyer.name}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatRelative(convo.lastMessageAt)}
                  </span>
                </div>
                <p
                  className={`mt-0.5 truncate text-xs ${
                    convo.unread > 0 ? "text-slate-700" : "text-slate-500"
                  }`}
                >
                  {senderLabel}
                  {preview}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusMeta[convo.status].tone}`}
                  >
                    {statusMeta[convo.status].label}
                  </span>
                  {convo.autopilot ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                      <BotIcon className="h-3 w-3" />
                      AI
                    </span>
                  ) : null}
                </div>
              </div>
              {convo.unread > 0 ? (
                <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-indigo-600" />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConversationPane({
  conversation,
  isAiThinking,
  draft,
  onDraftChange,
  onSend,
  onToggleAutopilot,
}: {
  conversation: Conversation | null;
  isAiThinking: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onToggleAutopilot: (convoId: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    scroller.scrollTop = scroller.scrollHeight;
  }, [conversation?.id, conversation?.messages.length, isAiThinking]);

  if (!conversation) {
    return (
      <section className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="text-center text-sm text-slate-500">
          Select a conversation to view the thread
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar buyer={conversation.buyer} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{conversation.buyer.name}</p>
            <p className="text-xs text-slate-500">
              via{" "}
              {conversation.marketplace === "facebook" ? "Facebook Marketplace" : "Kijiji"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta[conversation.status].tone}`}
          >
            {statusMeta[conversation.status].label}
          </span>
          <button
            type="button"
            onClick={() => onToggleAutopilot(conversation.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
              conversation.autopilot
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {conversation.autopilot ? (
              <ToggleOnIcon className="h-3.5 w-3.5" />
            ) : (
              <ToggleOffIcon className="h-3.5 w-3.5" />
            )}
            AI Autopilot {conversation.autopilot ? "on" : "off"}
          </button>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              buyerInitials={conversation.buyer.initials}
            />
          ))}
          {isAiThinking ? <TypingIndicator /> : null}
          {conversation.status === "meetup_scheduled" && conversation.meetup ? (
            <MeetupCard meetup={conversation.meetup} />
          ) : null}
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={
                conversation.autopilot
                  ? `Take over from Vendio AI — message ${conversation.buyer.name.split(" ")[0]}`
                  : `Reply to ${conversation.buyer.name.split(" ")[0]}`
              }
              className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!draft.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <SendIcon className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <SparkleIcon className="h-3 w-3 text-indigo-500" />
            {conversation.autopilot
              ? "Vendio AI replies automatically. Your message will take over this thread."
              : "Autopilot is off — Vendio AI won't reply for you on this thread."}
          </p>
        </div>
      </footer>

    </section>
  );
}

function MessageBubble({
  message,
  buyerInitials,
}: {
  message: Message;
  buyerInitials: string;
}) {
  if (message.sender === "buyer") {
    return (
      <div className="flex items-end gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {buyerInitials}
        </span>
        <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm">
          <p className="leading-6">{message.content}</p>
          <p className="mt-1 text-[10px] text-slate-400">{formatExactTime(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  const isAi = message.sender === "seller_ai";
  return (
    <div className="flex items-end justify-end gap-2">
      <div
        className={`max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm shadow-sm ${
          isAi
            ? "bg-indigo-600 text-white"
            : "bg-slate-900 text-white"
        }`}
      >
        {isAi ? (
          <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
            <BotIcon className="h-3 w-3" />
            Vendio AI
          </p>
        ) : null}
        <p className="leading-6">{message.content}</p>
        <p
          className={`mt-1 text-[10px] ${
            isAi ? "text-indigo-100" : "text-slate-300"
          }`}
        >
          {formatExactTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 shadow-sm">
        <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
          <BotIcon className="h-3 w-3" />
          Vendio AI is typing
        </p>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-100 vendio-pulse-dot" />
          <span
            className="h-1.5 w-1.5 rounded-full bg-indigo-100 vendio-pulse-dot"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-indigo-100 vendio-pulse-dot"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function MeetupCard({ meetup }: { meetup: Meetup }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircleIcon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold">Meetup scheduled by Vendio AI</p>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-4 w-4 text-emerald-600" />
          <span>{meetup.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-emerald-600" />
          <span>{meetup.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarIcon className="h-4 w-4 text-emerald-600" />
          <span>{meetup.payment === "cash" ? "Cash on pickup" : "E-transfer"}</span>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Avatar({ buyer }: { buyer: Conversation["buyer"] }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${buyer.avatarColor}`}
    >
      {buyer.initials}
    </span>
  );
}

function MarketplaceBadge({ marketplace }: { marketplace: Marketplace }) {
  if (marketplace === "facebook") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#1877F2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1877F2]">
        <FacebookIcon className="h-3 w-3" />
        Facebook
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <KijijiIcon className="h-3 w-3" />
      Kijiji
    </span>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
