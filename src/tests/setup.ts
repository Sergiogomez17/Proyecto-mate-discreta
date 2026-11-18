import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// En el entorno de pruebas conviven el AbortSignal de jsdom y el Request nativo de Node (undici),
// que rechaza señales ajenas. React Router crea un Request con señal en cada navegación;
// aquí se omite la señal, lo que no afecta a las pruebas (no se cancelan navegaciones).
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init?.signal ? { ...init, signal: null } : init);
  }
} as typeof Request;

// React Flow mide los nodos con ResizeObserver y lee la escala del lienzo con DOMMatrixReadOnly;
// jsdom no implementa ninguno de los dos ni calcula tamaños (offsetWidth es siempre 0).
class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

class DOMMatrixReadOnlyMock {
  m22: number;
  constructor(transform?: string) {
    const scale = /scale\(([\d.]+)\)/.exec(transform ?? '')?.[1];
    this.m22 = scale ? Number(scale) : 1;
  }
}
globalThis.DOMMatrixReadOnly = DOMMatrixReadOnlyMock as unknown as typeof DOMMatrixReadOnly;

Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: {
    configurable: true,
    get(this: HTMLElement) {
      return Number.parseFloat(this.style.width) || 44;
    },
  },
  offsetHeight: {
    configurable: true,
    get(this: HTMLElement) {
      return Number.parseFloat(this.style.height) || 44;
    },
  },
});

// Los navegadores leen archivos con Blob.text(); jsdom solo ofrece FileReader.
if (!('text' in Blob.prototype)) {
  Object.defineProperty(Blob.prototype, 'text', {
    configurable: true,
    value(this: Blob) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'));
        reader.readAsText(this);
      });
    },
  });
}

// jsdom no implementa scrollTo ni matchMedia, que usan ScrollRestoration y Motion.
beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.localStorage.clear();
});

afterEach(() => cleanup());
