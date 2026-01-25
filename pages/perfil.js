import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Profile from '../src/pages/Profile';
import { useAuth } from '../src/context/AuthContext';

export default function PerfilRoute() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login?returnTo=/perfil');
    }
  }, [isAuthenticated, loading, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <Profile />;
}
