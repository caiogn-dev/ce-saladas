import axios from 'axios';
import Cardapio from '../src/pages/Cardapio';

export async function getServerSideProps() {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.pastita.com.br/api/v1').replace(/\/+$/, '');
  const slug = process.env.NEXT_PUBLIC_STORE_SLUG || 'ce-saladas';

  try {
    const { data } = await axios.get(`${apiUrl}/stores/${slug}/catalog/`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
    return { props: { initialCatalog: data } };
  } catch {
    return { props: { initialCatalog: null } };
  }
}

export default Cardapio;
