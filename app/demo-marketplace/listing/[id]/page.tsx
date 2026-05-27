import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMarketplaceListing } from "@/lib/marketplace";

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getMarketplaceListing(id);

  if (!listing) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <article className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-200">
          <Image src={listing.imageUrl} alt={listing.title} fill unoptimized className="object-cover" />
        </div>

        <div className="flex flex-col">
          <div className="mb-5 inline-flex w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Posted successfully
          </div>
          <h1 className="text-4xl font-bold">{listing.title}</h1>
          <p className="mt-4 text-3xl font-black text-blue-700">${listing.price}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-500">Category</p>
              <p className="mt-1 font-bold">{listing.category}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-500">Condition</p>
              <p className="mt-1 font-bold">{listing.condition}</p>
            </div>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-slate-700">
            {listing.description}
          </p>

          <div className="mt-auto pt-8">
            <p className="font-semibold text-slate-600">{listing.location}</p>
            <p className="mt-1 text-sm text-slate-400">
              Listing ID: <span className="font-mono">{listing.id}</span>
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Back to Vendio
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
