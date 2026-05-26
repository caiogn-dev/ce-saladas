import dynamic from 'next/dynamic';

// Disable SSR: page polls sessionStorage/API post-checkout — client-only is correct.
const PaymentPending = dynamic(() => import('../src/pages/PaymentPending'), { ssr: false });

export default PaymentPending;
