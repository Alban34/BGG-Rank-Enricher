// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { searchBgg } from '../../src/background/service-worker';
import { normaliseTitle } from '../../src/shared/title-utils';

function mockFetch(status: number, body: string): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response);
}

const SUCCESS_HTML = `<!DOCTYPE html><html><body>
  <a href="/boardgame/266192/wingspan">Wingspan</a>
  <a href="/boardgame/366161/wingspan-asia">Wingspan Asia</a>
</body></html>`;

const EMPTY_HTML = `<!DOCTYPE html><html><body><p>No results found.</p></body></html>`;

describe('Story 4.2 — searchBgg', () => {
  it('4.2.1 — returns ok:true with first id when results found', async () => {
    mockFetch(200, SUCCESS_HTML);
    expect(await searchBgg('Wingspan')).toEqual({ ok: true, id: '266192' });
  });

  it('4.2.2 — returns NOT_FOUND when no boardgame IDs in page', async () => {
    mockFetch(200, EMPTY_HTML);
    expect(await searchBgg('Unknown Game')).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('4.2.3 — returns NETWORK_ERROR when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('net'));
    expect(await searchBgg('Wingspan')).toEqual({ ok: false, reason: 'NETWORK_ERROR' });
  });

  it('4.2.4 — returns API_ERROR when HTTP status is 503', async () => {
    mockFetch(503, '');
    expect(await searchBgg('Wingspan')).toEqual({ ok: false, reason: 'API_ERROR' });
  });

  it('4.2.5 — returns CLOUDFLARE_BLOCK when HTTP status is 403', async () => {
    mockFetch(403, "Forbidden");
    expect(await searchBgg('Wingspan')).toEqual({ ok: false, reason: 'CLOUDFLARE_BLOCK' });
  });
});

describe('Story 6.1 — normaliseTitle', () => {
  it('6.1.1 — collapses " : " (space-colon-space) to bare colon', () => {
    expect(normaliseTitle('Dune : Imperium')).toBe('Dune: Imperium');
  });

  it('6.1.2 — collapses " :" (space-colon) to bare colon', () => {
    expect(normaliseTitle('Dune :Imperium')).toBe('Dune:Imperium');
  });

  it("6.1.3 — leaves ': ' (colon-space, no leading whitespace) unchanged", () => {
    expect(normaliseTitle('Dune: Imperium')).toBe('Dune: Imperium');
  });

  it('6.1.4 — collapses multiple spaces into one', () => {
    expect(normaliseTitle('Dune  Imperium')).toBe('Dune Imperium');
  });

  it('6.1.5 — trims leading and trailing whitespace', () => {
    expect(normaliseTitle('  Arkham Horror : The Card Game  ')).toBe('Arkham Horror: The Card Game');
  });

  it('6.1.6 — leaves an already-clean title unchanged', () => {
    expect(normaliseTitle('Wingspan')).toBe('Wingspan');
  });

  it('6.1.7 — full acceptance example: Dune : Imperium - Immortality', () => {
    expect(normaliseTitle('Dune : Imperium - Immortality')).toBe('Dune: Imperium - Immortality');
  });
});

describe('Story 6.2 — searchBgg truncation fallback', () => {
  it('6.2.1 — resolves expansion title after exactly one truncation retry', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: "Dune: Imperium - Immortality" → NOT_FOUND
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<html><body>No results.</body></html>'),
        } as unknown as Response);
      }
      // Second call: "Dune: Imperium" → found
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><body><a href="/boardgame/162082/dune-imperium">Dune: Imperium</a></body></html>'),
      } as unknown as Response);
    });
    const result = await searchBgg('Dune : Imperium - Immortality');
    expect(result).toEqual({ ok: true, id: '162082' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('6.2.2 — returns NOT_FOUND when no truncation level produces a result', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<html><body>No results.</body></html>'),
    } as unknown as Response);
    const result = await searchBgg('A - B - C');
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
    // Should call: "A - B - C", "A - B", "A" — three times
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('6.2.3 — short-circuits on CLOUDFLARE_BLOCK without retrying', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    } as unknown as Response);
    const result = await searchBgg('Dune : Imperium - Immortality');
    expect(result).toEqual({ ok: false, reason: 'CLOUDFLARE_BLOCK' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('6.2.4 — short-circuits on API_ERROR without retrying', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(''),
    } as unknown as Response);
    const result = await searchBgg('Dune : Imperium - Immortality');
    expect(result).toEqual({ ok: false, reason: 'API_ERROR' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('6.2.5 — short-circuits on NETWORK_ERROR without retrying', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('net'));
    const result = await searchBgg('Dune : Imperium - Immortality');
    expect(result).toEqual({ ok: false, reason: 'NETWORK_ERROR' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('6.2.6 — regression: Wingspan resolves on first attempt', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<html><body><a href="/boardgame/266192/wingspan">Wingspan</a></body></html>'),
    } as unknown as Response);
    const result = await searchBgg('Wingspan');
    expect(result).toEqual({ ok: true, id: '266192' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('6.2.7 — regression: Dune: Imperium resolves on first attempt', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<html><body><a href="/boardgame/162082/dune-imperium">Dune: Imperium</a></body></html>'),
    } as unknown as Response);
    const result = await searchBgg('Dune: Imperium');
    expect(result).toEqual({ ok: true, id: '162082' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('6.2.8 — returns expansion ID when results contain both base game and expansion', async () => {
    const HTML_MIXED = `<html><body>
      <a href="/boardgame/316554/dune-imperium">Dune: Imperium</a>
      <a href="/boardgameexpansion/374173/dune-imperium-immortality">Dune: Imperium – Immortality</a>
    </body></html>`;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(HTML_MIXED),
    } as unknown as Response);
    const result = await searchBgg('Dune : Imperium - Immortality');
    expect(result).toEqual({ ok: true, id: '374173' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});