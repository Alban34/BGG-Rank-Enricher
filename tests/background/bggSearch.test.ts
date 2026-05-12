// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { searchBgg } from '../../src/background/service-worker';

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
