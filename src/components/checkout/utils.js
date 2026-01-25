/**
 * Checkout utility functions
 */

export const toSafeString = (value) => (value == null ? '' : String(value));

export const validateCPF = (cpf) => {
  const cleanCpf = toSafeString(cpf).replace(/[^\d]/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += parseInt(cleanCpf[i], 10) * (10 - i);
  let digit = (sum * 10 % 11) % 10;
  if (digit !== parseInt(cleanCpf[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += parseInt(cleanCpf[i], 10) * (11 - i);
  digit = (sum * 10 % 11) % 10;
  return digit === parseInt(cleanCpf[10], 10);
};

export const formatCPF = (value) => {
  const numbers = toSafeString(value).replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

export const formatPhone = (value) => {
  const numbers = toSafeString(value).replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export const formatCEP = (value) => {
  const safe = toSafeString(value);
  const numbers = safe.replace(/\D/g, '').slice(0, 8);
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

export const onlyDigits = (value) => toSafeString(value).replace(/\D/g, '');

export const formatMoney = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));
  if (Number.isNaN(numeric)) return '0.00';
  return numeric.toFixed(2);
};

export const splitFullName = (value) => {
  const parts = toSafeString(value).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
};

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' }, { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' }, { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' }, { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' }, { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

export const getStateCode = (stateName) => {
  if (!stateName) return '';
  const state = BRAZILIAN_STATES.find(s => 
    s.label.toLowerCase() === stateName.toLowerCase() ||
    s.value.toLowerCase() === stateName.toLowerCase()
  );
  return state?.value || stateName;
};

export const getStateName = (stateCode) => {
  if (!stateCode) return '';
  const state = BRAZILIAN_STATES.find(s => s.value === stateCode);
  return state?.label || stateCode;
};

export const STORE_ADDRESS = {
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Q. 112 Sul Rua SR 1, conj. 06 lote 04 - Plano Diretor Sul',
  city: process.env.NEXT_PUBLIC_STORE_CITY || 'Palmas',
  state: process.env.NEXT_PUBLIC_STORE_STATE || 'TO',
  zip_code: process.env.NEXT_PUBLIC_STORE_ZIP || '77020-170'
};

export const STORE_LOCATION = {
  latitude: parseFloat(process.env.NEXT_PUBLIC_STORE_LAT) || -10.1854332,
  longitude: parseFloat(process.env.NEXT_PUBLIC_STORE_LNG) || -48.3038653
};

export const TIME_SLOTS = [
  { value: '10:00-12:00', label: '10:00 - 12:00' },
  { value: '12:00-14:00', label: '12:00 - 14:00' },
  { value: '14:00-16:00', label: '14:00 - 16:00' },
  { value: '16:00-18:00', label: '16:00 - 18:00' },
  { value: '18:00-20:00', label: '18:00 - 20:00' },
];

export const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() !== 0) {
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      });
    }
  }
  return dates;
};
