import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize image URLs to use HTTPS to prevent mixed-content blocking.
 * Cover Art Archive and Wikimedia both support HTTPS.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
}
