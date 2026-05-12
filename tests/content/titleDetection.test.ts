// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectAndMarkTitle } from '../../src/content/index';

describe('detectAndMarkTitle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ ok: true, rating: '8.0' }),
      },
    });
  });

  // ── Story 2.1 ──────────────────────────────────────────────────────────────

  it('2.1.1 — logs trimmed text when h1.product-title is present', async () => {
    document.body.innerHTML = '<h1 class="product-title">  Brass: Birmingham  </h1>';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith('Brass: Birmingham');
  });

  it('2.1.2 — falls back to plain h1 and logs its trimmed text', async () => {
    document.body.innerHTML = '<h1>  Catan  </h1>';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith('Catan');
  });

  it('2.1.3 — takes warn path when h1.product-title has whitespace-only textContent', async () => {
    document.body.innerHTML = '<h1 class="product-title">   </h1>';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  // ── Story 2.2 ──────────────────────────────────────────────────────────────

  it('2.2.1 — applies underline + blue to h1.product-title', async () => {
    document.body.innerHTML = '<h1 class="product-title">Wingspan</h1>';
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await detectAndMarkTitle();
    const el = document.querySelector('h1.product-title') as HTMLElement;
    expect(el.style.textDecoration).toBe('underline');
    expect(el.style.textDecorationColor).toBe('blue');
  });

  it('2.2.2 — sets only textDecoration and textDecorationColor (no other inline styles)', async () => {
    document.body.innerHTML = '<h1 class="product-title">Wingspan</h1>';
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await detectAndMarkTitle();
    const el = document.querySelector('h1.product-title') as HTMLElement;
    const cssText = el.style.cssText;
    // cssText should contain exactly the two expected declarations
    expect(cssText).toMatch(/text-decoration[^;]*:\s*underline/);
    expect(cssText).toMatch(/text-decoration-color[^;]*:\s*blue/);
    // Strip the two known properties and assert nothing else remains
    const stripped = cssText
      .replace(/text-decoration-color\s*:[^;]+;?/gi, '')
      .replace(/text-decoration\s*:[^;]+;?/gi, '')
      .trim();
    expect(stripped).toBe('');
  });

  it('2.2.3 — applies underline + blue to fallback h1', async () => {
    document.body.innerHTML = '<h1>Azul</h1>';
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await detectAndMarkTitle();
    const el = document.querySelector('h1') as HTMLElement;
    expect(el.style.textDecoration).toBe('underline');
    expect(el.style.textDecorationColor).toBe('blue');
  });

  // ── Story 2.3 ──────────────────────────────────────────────────────────────

  it('2.3.1 — warns with BGG Rank Enricher message when no h1 at all', async () => {
    document.body.innerHTML = '<p>No heading here</p>';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(warnSpy).toHaveBeenCalledOnce();
    const msg: string = warnSpy.mock.calls[0][0];
    expect(msg).toContain('BGG Rank Enricher');
    expect(msg.length).toBeGreaterThan('BGG Rank Enricher'.length);
  });

  it('2.3.1b — does not modify any DOM node when no h1 exists', async () => {
    document.body.innerHTML = '<p id="target">unchanged</p>';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    const p = document.getElementById('target') as HTMLElement;
    expect(p.style.cssText).toBe('');
  });

  it('2.3.2 — warns when h1 has empty textContent', async () => {
    document.body.innerHTML = '<h1></h1>';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(warnSpy).toHaveBeenCalledOnce();
    const msg: string = warnSpy.mock.calls[0][0];
    expect(msg).toContain('BGG Rank Enricher');
  });

  it('2.3.2b — does not style the h1 when textContent is empty', async () => {
    document.body.innerHTML = '<h1></h1>';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    const el = document.querySelector('h1') as HTMLElement;
    expect(el.style.cssText).toBe('');
  });

  it('2.3.3 — warns when h1 has whitespace-only textContent', async () => {
    document.body.innerHTML = '<h1>   \t\n   </h1>';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    expect(warnSpy).toHaveBeenCalledOnce();
    const msg: string = warnSpy.mock.calls[0][0];
    expect(msg).toContain('BGG Rank Enricher');
  });

  it('2.3.3b — does not style the h1 when textContent is whitespace-only', async () => {
    document.body.innerHTML = '<h1>   </h1>';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectAndMarkTitle();
    const el = document.querySelector('h1') as HTMLElement;
    expect(el.style.cssText).toBe('');
  });

  it('2.3.4 — never calls console.error and never throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // no h1
    document.body.innerHTML = '';
    expect(() => detectAndMarkTitle()).not.toThrow();

    // empty h1
    document.body.innerHTML = '<h1></h1>';
    expect(() => detectAndMarkTitle()).not.toThrow();

    // whitespace h1
    document.body.innerHTML = '<h1>   </h1>';
    expect(() => detectAndMarkTitle()).not.toThrow();

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
