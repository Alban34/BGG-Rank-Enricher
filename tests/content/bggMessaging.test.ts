// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectAndMarkTitle } from '../../src/content/index';

const sendMessageMock = vi.fn();

beforeEach(() => {
  globalThis.chrome = {
    runtime: {
      sendMessage: sendMessageMock,
    },
  } as unknown as typeof chrome;

  document.body.innerHTML = '<h1 class="product-title">Wingspan</h1>';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  sendMessageMock.mockReset();
});

describe('Story 4.1 — sendMessage contract', () => {
  it('4.1.1 — calls sendMessage exactly once with BGG_RATING_LOOKUP and detected title', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    await detectAndMarkTitle();
    expect(sendMessageMock).toHaveBeenCalledOnce();
    expect(sendMessageMock).toHaveBeenCalledWith({ type: 'BGG_RATING_LOOKUP', title: 'Wingspan' });
  });

  it('4.1.2 — no fetch call is made from the content script', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    await detectAndMarkTitle();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('4.1.3 — does not throw when sendMessage resolves with ok:true', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    await expect(detectAndMarkTitle()).resolves.toBeUndefined();
  });

  it('4.1.4 — does not throw when sendMessage resolves with ok:false', async () => {
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    await expect(detectAndMarkTitle()).resolves.toBeUndefined();
  });
});

describe('Story 4.4 — inject BGG rating span', () => {
  it('4.4.1 — injects a <span data-bgg-rating> after the h1 with correct textContent', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    await detectAndMarkTitle();
    const h1 = document.querySelector('h1')!;
    const span = h1.nextElementSibling;
    expect(span).not.toBeNull();
    expect(span!.hasAttribute('data-bgg-rating')).toBe(true);
    expect(span!.textContent).toBe('(8.0)');
  });

  it('4.4.2 — injected span has correct inline styles', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    await detectAndMarkTitle();
    const h1 = document.querySelector('h1')!;
    const span = h1.nextElementSibling as HTMLElement;
    expect(span.style.fontFamily).toBe('inherit');
    expect(span.style.fontSize).toBe('inherit');
    expect(span.style.fontWeight).toBe('inherit');
  });

  it('4.4.3 — calling detectAndMarkTitle twice does not inject a second span', async () => {
    sendMessageMock.mockResolvedValue({ ok: true, rating: '8.0' });
    await detectAndMarkTitle();
    await detectAndMarkTitle();
    const spans = document.querySelectorAll('[data-bgg-rating]');
    expect(spans).toHaveLength(1);
  });
});

describe('Story 4.5 — handle BGG lookup failures gracefully', () => {
  it('4.5.1 — warns with correct message and injects no span for NOT_FOUND', async () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    await detectAndMarkTitle();
    expect(warnMock).toHaveBeenCalledWith(
      '[BGG Enricher] Rating lookup failed: NOT_FOUND',
    );
    expect(document.querySelector('[data-bgg-rating]')).toBeNull();
  });

  it('4.5.2 — warns with correct message and injects no span for API_ERROR', async () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'API_ERROR' });
    await detectAndMarkTitle();
    expect(warnMock).toHaveBeenCalledWith(
      '[BGG Enricher] Rating lookup failed: API_ERROR',
    );
    expect(document.querySelector('[data-bgg-rating]')).toBeNull();
  });

  it('4.5.3 — warns with correct message and injects no span for NETWORK_ERROR', async () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'NETWORK_ERROR' });
    await detectAndMarkTitle();
    expect(warnMock).toHaveBeenCalledWith(
      '[BGG Enricher] Rating lookup failed: NETWORK_ERROR',
    );
    expect(document.querySelector('[data-bgg-rating]')).toBeNull();
  });

  it('4.5.4 — warns with correct message and injects no span for PARSE_ERROR', async () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'PARSE_ERROR' });
    await detectAndMarkTitle();
    expect(warnMock).toHaveBeenCalledWith(
      '[BGG Enricher] Rating lookup failed: PARSE_ERROR',
    );
    expect(document.querySelector('[data-bgg-rating]')).toBeNull();
  });

  it('4.5.5 — console.error is never called for any failure reason', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const reason of ['NOT_FOUND', 'API_ERROR', 'NETWORK_ERROR', 'PARSE_ERROR']) {
      document.body.innerHTML = '<h1 class="product-title">Wingspan</h1>';
      sendMessageMock.mockResolvedValue({ ok: false, reason });
      await detectAndMarkTitle();
    }
    expect(errorMock).not.toHaveBeenCalled();
  });
});
