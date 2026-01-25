import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CheckoutPage from '../src/pages/CheckoutPage';
import { useAuth } from '../src/context/AuthContext';

export default function CheckoutRoute() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login?returnTo=/checkout');
    }
  }, [isAuthenticated, loading, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <CheckoutPage />;
}
