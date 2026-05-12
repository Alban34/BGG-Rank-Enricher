export function detectAndMarkTitle(): void {
  const element: HTMLElement | null =
    document.querySelector('h1.product-title') ?? document.querySelector('h1');

  if (!element) {
    console.warn('BGG Rank Enricher: product title element not found');
    return;
  }

  const title = element.textContent?.trim() ?? '';

  if (title === '') {
    console.warn('BGG Rank Enricher: product title element not found');
    return;
  }

  console.log(title);
  element.style.textDecoration = 'underline';
  element.style.textDecorationColor = 'blue';
}

detectAndMarkTitle();
