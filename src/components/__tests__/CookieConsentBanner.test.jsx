import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CookieConsentBanner from '../CookieConsentBanner';
import { getCookieConsent } from '../../utils/cookieConsent';

describe('CookieConsentBanner', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('aparece quando não há decisão', () => {
    render(<CookieConsentBanner onDecision={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('não aparece se já houve decisão', () => {
    localStorage.setItem('ce_saladas_cookie_consent', JSON.stringify({ value: 'accepted' }));
    render(<CookieConsentBanner onDecision={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Aceitar persiste, some e avisa o pai com "accepted"', () => {
    const onDecision = vi.fn();
    render(<CookieConsentBanner onDecision={onDecision} />);
    fireEvent.click(screen.getByText('Aceitar'));
    expect(getCookieConsent()).toBe('accepted');
    expect(onDecision).toHaveBeenCalledWith('accepted');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Recusar persiste "rejected" e avisa o pai', () => {
    const onDecision = vi.fn();
    render(<CookieConsentBanner onDecision={onDecision} />);
    fireEvent.click(screen.getByText('Recusar'));
    expect(getCookieConsent()).toBe('rejected');
    expect(onDecision).toHaveBeenCalledWith('rejected');
  });
});
