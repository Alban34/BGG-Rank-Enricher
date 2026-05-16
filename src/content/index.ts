import type { BggLookupRequest, BggLookupResponse } from '$shared/bgg-messages';
import { isProductPage, SHOP_CONFIGS } from '$shared/title-utils';

export async function detectAndMarkTitle(): Promise<void> {
  const config = SHOP_CONFIGS.find(c => c.hostname === window.location.hostname);
  if (!config) {
    console.warn(`[BGG Enricher] No shop config found for hostname: ${window.location.hostname}`);
    return;
  }

  let element: HTMLElement | null = findBestTitleElement(config.titleSelector);

  if (!element) {
    element = await waitForElement(config.titleSelector, 12_000);
    if (!element) {
      console.warn('[BGG Rank Enricher] product title element not found');
      return;
    }
  }

  const title = element.textContent?.trim() ?? '';

  if (title === '') {
    console.warn('[BGG Rank Enricher] product title is empty');
    return;
  }

  console.log(title);

  // Story 2.2 — visually mark the detected title element
  // Use !important so aggressive site CSS cannot wipe the underline.
  element.style.setProperty('text-decoration', 'underline', 'important');
  element.style.setProperty('text-decoration-color', 'blue', 'important');

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
    const insertTarget = config.insertAfterSelector
      ? (document.querySelector<HTMLElement>(config.insertAfterSelector) ?? element)
      : element;
    injectRatingSpan(insertTarget, response.rating);
  } else if (response.reason === 'CLOUDFLARE_BLOCK') {
    console.warn('[BGG Enricher] Rating lookup blocked: please visit boardgamegeek.com in your browser first');
  } else {
    console.warn(`[BGG Enricher] Rating lookup failed: ${response.reason}`);
  }
}

function findBestTitleElement(selector: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
  for (const candidate of candidates) {
    if (isVisible(candidate) && (candidate.textContent?.trim().length ?? 0) > 0) {
      return candidate;
    }
  }
  return null;
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function waitForElement(selector: string, timeout: number): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const existing = findBestTitleElement(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = findBestTitleElement(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
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
