import type { BggLookupRequest, BggLookupResponse, BggLookupError } from '$shared/bgg-messages';
import { normaliseTitle } from '$shared/title-utils';

interface SearchSuccess { ok: true; id: string }
type SearchResult = SearchSuccess | BggLookupError;

/**
 * Converts a normalised title to a slug comparable to BGG URL path segments.
 * e.g. "Dune: Imperium - Immortality" → "dune-imperium-immortality"
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extracts all (id, slug) pairs from BGG search HTML, matching both
 * /boardgame/<id>/<slug> and /boardgameexpansion/<id>/<slug> links.
 * Returns the ID of the result whose slug best matches the searchSlug:
 *   1. Exact slug match (preferred — avoids returning a base game when the
 *      expansion is present in the results)
 *   2. First result (fallback — preserves existing behaviour)
 * Returns null when no boardgame links are found.
 */
function findBestBggId(html: string, searchSlug: string): string | null {
  const re = /\/boardgame(?:expansion)?\/(\d+)\/([\w-]+)/g;
  const seen = new Set<string>();
  const results: Array<{ id: string; slug: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      results.push({ id: m[1], slug: m[2] });
    }
  }
  if (results.length === 0) return null;
  const exact = results.find(r => r.slug === searchSlug);
  if (exact) return exact.id;
  return results[0].id;
}

export async function searchBgg(title: string): Promise<SearchResult> {
  let candidate = normaliseTitle(title);

  while (true) {
    const encodedTitle = encodeURIComponent(candidate);
    let response: Response;
    try {
      response = await fetch(
        `https://boardgamegeek.com/search/boardgame?nosession=1&q=${encodedTitle}&showcount=5`,
        { credentials: 'include' },
      );
    } catch {
      return { ok: false, reason: 'NETWORK_ERROR' };
    }
    if (response.status === 403) {
      return { ok: false, reason: 'CLOUDFLARE_BLOCK' };
    }
    if (response.status < 200 || response.status > 299) {
      return { ok: false, reason: 'API_ERROR' };
    }
    const html = await response.text();
    const id = findBestBggId(html, titleToSlug(candidate));
    if (id !== null) {
      return { ok: true, id };
    }
    // NOT_FOUND — try stripping the rightmost " - <suffix>" segment
    const dashIdx = candidate.lastIndexOf(' - ');
    if (dashIdx === -1) {
      return { ok: false, reason: 'NOT_FOUND' };
    }
    candidate = candidate.slice(0, dashIdx);
  }
}

export async function fetchBggRating(id: string): Promise<BggLookupResponse> {
  let response: Response;
  try {
    response = await fetch(
      `https://boardgamegeek.com/boardgame/${id}`,
      { credentials: 'include' },
    );
  } catch {
    return { ok: false, reason: 'NETWORK_ERROR' };
  }
  if (response.status === 403) {
    return { ok: false, reason: 'CLOUDFLARE_BLOCK' };
  }
  if (response.status < 200 || response.status > 299) {
    return { ok: false, reason: 'API_ERROR' };
  }
  const html = await response.text();
  const match = html.match(/"average":\s*"([\d.]+)"/);
  if (!match) {
    return { ok: false, reason: 'PARSE_ERROR' };
  }
  const num = parseFloat(match[1]);
  if (isNaN(num)) {
    return { ok: false, reason: 'PARSE_ERROR' };
  }
  return { ok: true, rating: (Math.round(num * 10) / 10).toFixed(1) };
}

if (typeof chrome !== 'undefined') {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const req = message as BggLookupRequest;
    if (req.type !== 'BGG_RATING_LOOKUP') return;
    void (async () => {
      try {
        const searchResult = await searchBgg(req.title);
        if (!searchResult.ok) {
          sendResponse(searchResult);
          return;
        }
        const ratingResult = await fetchBggRating(searchResult.id);
        sendResponse(ratingResult);
      } catch {
        sendResponse({ ok: false, reason: 'PARSE_ERROR' } satisfies BggLookupError);
      }
    })();
    return true;
  });
}
