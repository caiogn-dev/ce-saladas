/**
 * useWhatsAppOTP
 * Pure state-machine hook for the WhatsApp OTP authentication flow.
 * States: idle → sending → code_sent → verifying → success | error
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { sendWhatsAppCode, verifyWhatsAppCode } from '../services/auth';

const RESEND_COOLDOWN_SECONDS = 60;

function onlyDigits(str) {
  return (str || '').replace(/\D/g, '');
}

export function normalizePhone(phone) {
  const digits = onlyDigits(phone);
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return digits;
}

export default function useWhatsAppOTP({ onSuccess } = {}) {
  const [state, setState] = useState('idle'); // idle|sending|code_sent|verifying|success|error
  const [phone, setPhoneRaw] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const successDataRef = useRef(null);

  // Start the resend cooldown timer
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const setPhone = useCallback((value) => {
    setPhoneRaw(value);
    setError(null);
  }, []);

  const sendCode = useCallback(async (phoneOverride) => {
    const raw = phoneOverride ?? phone;
    const normalized = normalizePhone(raw);
    if (normalized.length < 12) {
      setError('Informe um número de celular válido com DDD.');
      return;
    }
    setState('sending');
    setError(null);
    try {
      await sendWhatsAppCode(normalized);
      setState('code_sent');
      startCooldown();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao enviar código. Tente novamente.';
      setError(msg);
      setState('idle');
    }
  }, [phone, startCooldown]);

  const resendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    const normalized = normalizePhone(phone);
    setState('sending');
    setError(null);
    try {
      await sendWhatsAppCode(normalized);
      setState('code_sent');
      startCooldown();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao reenviar código.';
      setError(msg);
      setState('code_sent');
    }
  }, [phone, resendCooldown, startCooldown]);

  const verifyCode = useCallback(async (codeOverride) => {
    const codeToVerify = codeOverride ?? code;
    if (codeToVerify.length !== 6) return;
    const normalized = normalizePhone(phone);
    setState('verifying');
    setError(null);
    try {
      const data = await verifyWhatsAppCode(normalized, codeToVerify);
      successDataRef.current = data;
      setState('success');
      onSuccess?.(data);
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || 'Código inválido. Verifique e tente novamente.';
      setError(msg);
      setCode('');
      setState('code_sent');
    }
  }, [phone, code, onSuccess]);

  const reset = useCallback(() => {
    setState('idle');
    setPhoneRaw('');
    setCode('');
    setError(null);
    setResendCooldown(0);
    clearInterval(cooldownRef.current);
    successDataRef.current = null;
  }, []);

  return {
    state,
    phone,
    setPhone,
    code,
    setCode,
    error,
    resendCooldown,
    sendCode,
    resendCode,
    verifyCode,
    reset,
    successData: successDataRef.current,
  };
}
