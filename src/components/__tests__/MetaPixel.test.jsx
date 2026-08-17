import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import MetaPixel from '../MetaPixel';

// Router estável — MetaPixel só precisa de asPath + events.on/off.
vi.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/', events: { on: vi.fn(), off: vi.fn() } }),
}));

let storeMock = {};
vi.mock('../../context/StoreContext', () => ({
  useStore: () => ({ store: storeMock }),
}));

const LOJA_COM_PIXEL = { meta_pixel_id: '1301947998542003', meta_pixel_enabled: true, slug: 'ce-saladas' };

describe('MetaPixel — gate de consentimento (LGPD)', () => {
  beforeEach(() => { delete window.fbq; delete window._fbq; });
  afterEach(() => cleanup());

  it('NÃO carrega o pixel sem consentimento, mesmo com a loja configurada', () => {
    storeMock = LOJA_COM_PIXEL;
    render(<MetaPixel consent={false} />);
    expect(window.fbq).toBeUndefined();
  });

  it('com consentimento + loja configurada, inicializa o fbq', () => {
    storeMock = LOJA_COM_PIXEL;
    render(<MetaPixel consent={true} />);
    expect(typeof window.fbq).toBe('function');
  });

  it('com consentimento mas loja SEM pixel habilitado, não carrega', () => {
    storeMock = { meta_pixel_id: '', meta_pixel_enabled: false, slug: 'ce-saladas' };
    render(<MetaPixel consent={true} />);
    expect(window.fbq).toBeUndefined();
  });
});
