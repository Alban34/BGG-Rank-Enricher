// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fetchBggRating } from '../../src/background/service-worker';

function mockFetch(status: number, body: string): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response);
}

function gameHtml(average: string): string {
  return `<!DOCTYPE html><html><head><script>
    window.__geekitemPreload = {"item":{"stats":{"average":"${average}","bayesaverage":"8.0"}}}
  </script></head></html>`;
}

const NO_AVERAGE_HTML = `<!DOCTYPE html><html><body><p>Game page with no stats.</p></body></html>`;
const NAN_AVERAGE_HTML = `<!DOCTYPE html><html><body><script>{"average": "N/A"}</script></body></html>`;

describe('Story 4.3 — fetchBggRating', () => {
  it('4.3.1 — rounds 8.045 to "8.0"', async () => {
    mockFetch(200, gameHtml('8.045'));
    expect(await fetchBggRating('266192')).toEqual({ ok: true, rating: '8.0' });
  });

  it('4.3.2 — rounds 7.999 to "8.0"', async () => {
    mockFetch(200, gameHtml('7.999'));
    expect(await fetchBggRating('266192')).toEqual({ ok: true, rating: '8.0' });
  });

  it('4.3.3 — returns PARSE_ERROR when no average found in page', async () => {
    mockFetch(200, NO_AVERAGE_HTML);
    expect(await fetchBggRating('266192')).toEqual({ ok: false, reason: 'PARSE_ERROR' });
  });

  it('4.3.4 — returns PARSE_ERROR when average value is not a number', async () => {
    mockFetch(200, NAN_AVERAGE_HTML);
    expect(await fetchBggRating('266192')).toEqual({ ok: false, reason: 'PARSE_ERROR' });
  });

  it('4.3.5 — returns NETWORK_ERROR when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('net'));
    expect(await fetchBggRating('266192')).toEqual({ ok: false, reason: 'NETWORK_ERROR' });
  });

  it('4.3.6 — returns CLOUDFLARE_BLOCK when HTTP status is 403', async () => {
    mockFetch(403, "Forbidden");
    expect(await fetchBggRating('266192')).toEqual({ ok: false, reason: 'CLOUDFLARE_BLOCK' });
  });
});
