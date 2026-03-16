/**
 * Extracts the embed URL from Google Maps iframe HTML.
 * Accepts full iframe tag or a bare embed URL; returns the URL or null.
 */
export function extractEmbedUrlFromHtml(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const s = input.trim();
  const srcMatch = s.match(/src=["']([^"']+)["']/i);
  if (srcMatch?.[1]) return srcMatch[1];
  if (s.startsWith("http") && s.includes("embed")) return s;
  return null;
}

/**
 * Converts a Google Maps URL (share link, place link, etc.) to an embeddable iframe URL.
 * Returns null if the URL cannot be converted.
 */
export function getMapEmbedUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  // Already an embed URL
  if (trimmed.includes("/embed") || trimmed.includes("embed?")) {
    return trimmed;
  }

  // Short links (goo.gl, maps.app.goo.gl) set X-Frame-Options: sameorigin and cannot be embedded
  if (trimmed.includes("goo.gl/maps") || trimmed.includes("maps.app.goo.gl")) {
    return null;
  }

  if (!trimmed.includes("google.com/maps")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Extract @lat,lng from path (e.g. /place/Name/@40.77,-73.96,15z)
    const atMatch = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch?.[1] && atMatch?.[2]) {
      return `https://www.google.com/maps?q=${atMatch[1]},${atMatch[2]}&output=embed`;
    }

    // Use ?q= query param if present
    const q = parsed.searchParams.get("q");
    if (q) {
      const embedUrl = new URL("https://www.google.com/maps");
      embedUrl.searchParams.set("q", q);
      embedUrl.searchParams.set("output", "embed");
      return embedUrl.toString();
    }

    // Extract place name from /place/Name/... for search
    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch?.[1]) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      return `https://www.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`;
    }

    // Fallback: append output=embed (may work for some URL formats)
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}output=embed`;
  } catch {
    return null;
  }
}
