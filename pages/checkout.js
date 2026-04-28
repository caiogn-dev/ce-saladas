import CheckoutPage from '../src/pages/CheckoutPage';

export async function getServerSideProps() {
  return { props: {} };
}

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
