/**
 * Shared Brazilian locale constants and formatters.
 * Single source of truth for Profile, AddressSelector, and any future components.
 */

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export const formatCPF = (value) => {
  const n = value.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
};

export const formatPhone = (value) => {
  const n = value.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

export const formatCEP = (value) => {
  const n = value.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
};

export const formatMoney = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
};

export const ORDER_STATUS_CONFIG = {
  pending:    { label: 'Pendente',    color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  confirmed:  { label: 'Confirmado',  color: '#3b82f6', bg: '#dbeafe', icon: '✓' },
  preparing:  { label: 'Preparando', color: '#8b5cf6', bg: '#ede9fe', icon: '👨‍🍳' },
  ready:      { label: 'Pronto',      color: '#10b981', bg: '#d1fae5', icon: '✅' },
  delivering: { label: 'Em entrega', color: '#06b6d4', bg: '#cffafe', icon: '🚗' },
  delivered:  { label: 'Entregue',   color: '#22c55e', bg: '#dcfce7', icon: '📦' },
  cancelled:  { label: 'Cancelado',  color: '#ef4444', bg: '#fee2e2', icon: '✕' },
  paid:       { label: 'Pago',       color: '#22c55e', bg: '#dcfce7', icon: '💰' },
};

export const PAYMENT_STATUS_CONFIG = {
  pending:  { label: 'Aguardando pagamento', color: '#f59e0b', icon: '⏳' },
  paid:     { label: 'Pago',                color: '#22c55e', icon: '✓' },
  failed:   { label: 'Falhou',              color: '#ef4444', icon: '✕' },
  refunded: { label: 'Reembolsado',         color: '#6b7280', icon: '↩' },
};
