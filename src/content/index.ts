import type { BggLookupRequest, BggLookupResponse } from '$shared/bgg-messages';
import { isProductPage } from '$shared/title-utils';

export async function detectAndMarkTitle(): Promise<void> {
  const element: HTMLElement | null =
    document.querySelector('h1.product-title') ?? document.querySelector('h1');

  if (!element) {
    console.warn('[BGG Rank Enricher] product title element not found');
    return;
  }

  const title = element.textContent?.trim() ?? '';

  if (title === '') {
    console.warn('[BGG Rank Enricher] product title is empty');
    return;
  }

  console.log(title);

  // Story 2.2 — visually mark the detected title element
  element.style.textDecoration = 'underline';
  element.style.textDecorationColor = 'blue';

  // Story 4.1 — request BGG rating from the service worker
  let response: BggLookupResponse;
  try {
    response = await chrome.runtime.sendMessage<BggLookupRequest, BggLookupResponse>({
      type: 'BGG_RATING_LOOKUP',
      title,
    });
  } catch (err) {
    console.warn('[BGG Enricher] Rating lookup failed: could not reach service worker', err);
    return;
  }

  if (!response) {
    console.warn('[BGG Enricher] Rating lookup failed: no response from service worker');
    return;
  }

  if (response.ok) {
    injectRatingSpan(element, response.rating);
  } else if (response.reason === 'CLOUDFLARE_BLOCK') {
    console.warn('[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first');
  } else {
    console.warn(`[BGG Enricher] Rating lookup failed: ${response.reason}`);
  }
}

function injectRatingSpan(element: HTMLElement, rating: string): void {
  if (element.nextElementSibling?.hasAttribute('data-bgg-rating')) {
    return;
  }

  const span = document.createElement('span');
  span.setAttribute('data-bgg-rating', '');
  span.textContent = `(${rating})`;
  span.style.fontFamily = 'inherit';
  span.style.fontSize = 'inherit';
  span.style.fontWeight = 'inherit';
  element.insertAdjacentElement('afterend', span);
}

try {
  if (isProductPage(window.location.href)) {
    void detectAndMarkTitle();
  } else {
    console.debug('[BGG Enricher] Skipping non-product page:', window.location.href);
  }
} catch (err) {
  console.error('[BGG Enricher] Unexpected error in product-page guard:', err);
}
