import dynamic from 'next/dynamic';

const PaymentError = dynamic(() => import('../src/pages/PaymentError'), { ssr: false });

export default PaymentError;
