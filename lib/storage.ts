import type { GalleryItem } from "@/lib/types";

const GALLERY_KEY = "edc-moments-gallery-v1";
const GALLERY_EVENT = "edc-moments-gallery-change";

let cachedGalleryRaw: string | null | undefined;
let cachedGallery: GalleryItem[] = [];

export function subscribeGallery(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleChange = () => {
    cachedGalleryRaw = undefined;
    callback();
  };
  window.addEventListener("storage", handleChange);
  window.addEventListener(GALLERY_EVENT, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(GALLERY_EVENT, handleChange);
  };
}

export function readGallery(): GalleryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(GALLERY_KEY);
    if (saved === cachedGalleryRaw) return cachedGallery;
    cachedGalleryRaw = saved;
    cachedGallery = saved ? (JSON.parse(saved) as GalleryItem[]) : [];
    return cachedGallery;
  } catch (error) {
    console.warn("Could not read the EDC Moments gallery from browser storage.", error);
    cachedGalleryRaw = undefined;
    cachedGallery = [];
    return [];
  }
}

export function saveGallery(items: GalleryItem[]): void {
  const serialized = JSON.stringify(items);
  window.localStorage.setItem(GALLERY_KEY, serialized);
  cachedGalleryRaw = serialized;
  cachedGallery = items;
  window.dispatchEvent(new Event(GALLERY_EVENT));
}
