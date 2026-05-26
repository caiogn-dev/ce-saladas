import dynamic from 'next/dynamic';

const PaymentSuccess = dynamic(() => import('../src/pages/PaymentSuccess'), { ssr: false });

export default PaymentSuccess;
