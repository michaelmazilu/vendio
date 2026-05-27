import { redirect } from "next/navigation";

import { createMarketplaceListing } from "@/lib/marketplace";
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/types/listing";

async function publishListing(formData: FormData) {
  "use server";

  const listing = await createMarketplaceListing(formData);
  redirect(`/demo-marketplace/listing/${listing.id}`);
}

export default function NewMarketplaceListingPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Demo Marketplace
            </p>
            <h1 className="mt-3 text-3xl font-bold">Create a listing</h1>
            <p className="mt-2 text-slate-600">
              This local form is intentionally stable so the browser automation demo works every
              time.
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Local demo
          </div>
        </div>

        <form action={publishListing} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="marketplace-image" className="text-sm font-semibold text-slate-700">
              Photo
            </label>
            <input
              id="marketplace-image"
              required
              name="image"
              type="file"
              accept="image/*"
              className="rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-700"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="marketplace-title" className="text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="marketplace-title"
              required
              name="title"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="marketplace-price" className="text-sm font-semibold text-slate-700">
                Price
              </label>
              <input
                id="marketplace-price"
                required
                name="price"
                type="number"
                min="1"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="marketplace-location"
                className="text-sm font-semibold text-slate-700"
              >
                Location
              </label>
              <input
                id="marketplace-location"
                required
                name="location"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label
                htmlFor="marketplace-category"
                className="text-sm font-semibold text-slate-700"
              >
                Category
              </label>
              <select
                id="marketplace-category"
                required
                name="category"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {LISTING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="marketplace-condition"
                className="text-sm font-semibold text-slate-700"
              >
                Condition
              </label>
              <select
                id="marketplace-condition"
                required
                name="condition"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {LISTING_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="marketplace-description"
              className="text-sm font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="marketplace-description"
              required
              name="description"
              rows={8}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Publish listing
          </button>
        </form>
      </section>
    </main>
  );
}
