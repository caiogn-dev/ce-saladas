import { describe, it, expect, beforeEach } from 'vitest';
import { getCookieConsent, setCookieConsent, hasTrackingConsent } from '../cookieConsent';

describe('cookieConsent', () => {
  beforeEach(() => localStorage.clear());

  it('sem decisão gravada, retorna null e nega tracking', () => {
    expect(getCookieConsent()).toBeNull();
    expect(hasTrackingConsent()).toBe(false);
  });

  it('aceitar libera o tracking e persiste', () => {
    setCookieConsent('accepted');
    expect(getCookieConsent()).toBe('accepted');
    expect(hasTrackingConsent()).toBe(true);
  });

  it('recusar é lembrado e NÃO libera tracking', () => {
    setCookieConsent('rejected');
    expect(getCookieConsent()).toBe('rejected');
    expect(hasTrackingConsent()).toBe(false);
  });

  it('valor inválido é ignorado (não grava)', () => {
    setCookieConsent('sim');
    expect(getCookieConsent()).toBeNull();
  });

  it('localStorage corrompido não quebra — trata como sem decisão', () => {
    localStorage.setItem('ce_saladas_cookie_consent', '{lixo');
    expect(getCookieConsent()).toBeNull();
    expect(hasTrackingConsent()).toBe(false);
  });
});
