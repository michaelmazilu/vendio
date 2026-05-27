"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImageIcon,
  PlusIcon,
  SparkleIcon,
  UploadIcon,
  XIcon,
} from "@/components/Icons";
import type { Marketplace, UploadedPhoto } from "@/types/app";

type UploadStepProps = {
  photos: UploadedPhoto[];
  notes: string;
  marketplaces: Marketplace[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onNotesChange: (notes: string) => void;
  onGenerate: () => void;
  onBack: () => void;
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function createPhoto(file: File): UploadedPhoto {
  return {
    id: `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    sizeBytes: file.size,
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadStep({
  photos,
  notes,
  marketplaces,
  onPhotosChange,
  onNotesChange,
  onGenerate,
  onBack,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function addFiles(fileList: FileList | File[] | null) {
    if (!fileList) {
      return;
    }

    const incoming = Array.from(fileList).filter((file) => acceptedTypes.includes(file.type));
    if (incoming.length === 0) {
      return;
    }

    const next = [...photos, ...incoming.map(createPhoto)].slice(0, 8);
    onPhotosChange(next);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function removePhoto(id: string) {
    const target = photos.find((photo) => photo.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onPhotosChange(photos.filter((photo) => photo.id !== id));
  }

  const canGenerate = photos.length > 0;

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
          Step 2 of 4
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Add photos of your item
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-slate-600">
          Upload up to 8 photos. Vendio will analyze them and write your listing.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mt-10 rounded-2xl border-2 border-dashed bg-white p-10 text-center transition ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <UploadIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-900">Drop your photos here</h2>
        <p className="mt-1 text-sm text-slate-600">PNG, JPG, WebP, or GIF. Up to 8 photos.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <PlusIcon className="h-4 w-4" />
          Choose photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple
          hidden
          onChange={handleFileInput}
        />
      </div>

      {photos.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <div className="aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove ${photo.name}`}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-white"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-slate-900/70 to-transparent px-2.5 py-2 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="truncate">{photo.name}</span>
                <span className="ml-auto">{formatSize(photo.sizeBytes)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
          Notes for Vendio <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <p className="mt-1 text-sm text-slate-500">
          Tell us anything that will help write a better listing: brand, age, why you&apos;re selling.
        </p>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="e.g. IKEA Malm 6-drawer dresser, used for 2 years, smoke-free home."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-500">
          Posting to{" "}
          <span className="font-medium text-slate-700">
            {marketplaces
              .map((id) => (id === "facebook" ? "Facebook Marketplace" : "Kijiji"))
              .join(" + ")}
          </span>
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <SparkleIcon className="h-4 w-4" />
          Generate Listing
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
