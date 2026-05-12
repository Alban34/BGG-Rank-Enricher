import type { BggLookupRequest, BggLookupResponse, BggLookupError } from '$shared/bgg-messages';

interface SearchSuccess { ok: true; id: string }
type SearchResult = SearchSuccess | BggLookupError;

export async function searchBgg(title: string): Promise<SearchResult> {
  const encodedTitle = encodeURIComponent(title);
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
  const match = html.match(/\/boardgame\/(\d+)\//);
  if (!match) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  return { ok: true, id: match[1] };
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
