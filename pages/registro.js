import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RegistroRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cardapio');
  }, [router]);

  return null;
}
