import axios from 'axios';
import Cardapio from '../../src/pages/Cardapio';
import { getStoreConfigBySlug } from '../../src/lib/getStoreConfig';

export default function PreviewPage({ previewStoreConfig }) {
  return (
    <>
      <div
        style={{
          background: '#f59e0b',
          color: '#1c1917',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        Modo preview — {previewStoreConfig?.name}
      </div>
      <Cardapio />
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { slug } = params;
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.pastita.com.br/api/v1').replace(/\/+$/, '');

  const [configResult, catalogResult] = await Promise.allSettled([
    getStoreConfigBySlug(slug),
    axios
      .get(`${apiUrl}/stores/${slug}/catalog/`, { timeout: 5000 })
      .then((r) => r.data)
      .catch(() => null),
  ]);

  const previewStoreConfig = configResult.status === 'fulfilled' ? configResult.value : null;
  if (!previewStoreConfig) return { notFound: true };

  return {
    props: {
      previewStoreConfig,
      initialCatalog: catalogResult.status === 'fulfilled' ? catalogResult.value : null,
    },
  };
}
