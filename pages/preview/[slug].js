import axios from 'axios';
import GenericStorefront from '../../src/components/GenericStorefront';
import { getStoreConfigBySlug } from '../../src/lib/getStoreConfig';

export default function PreviewPage({ catalog }) {
  const storeName = catalog?.store?.name;
  return <GenericStorefront catalog={catalog} previewLabel={storeName} />;
}

export async function getServerSideProps({ params }) {
  const { slug } = params;
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.pastita.com.br/api/v1').replace(/\/+$/, '');

  const [configResult, catalogResult] = await Promise.allSettled([
    getStoreConfigBySlug(slug),
    axios
      .get(`${apiUrl}/stores/${slug}/catalog/`, { timeout: 5000 })
      .then(r => r.data)
      .catch(() => null),
  ]);

  const previewStoreConfig = configResult.status === 'fulfilled' ? configResult.value : null;
  if (!previewStoreConfig) return { notFound: true };

  const catalog = catalogResult.status === 'fulfilled' ? catalogResult.value : null;

  return {
    props: {
      previewStoreConfig,
      initialCatalog: catalog,
      catalog,
    },
  };
}
