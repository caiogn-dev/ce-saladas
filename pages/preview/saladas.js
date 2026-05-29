import Cardapio from '../../src/pages/Cardapio';

const salads = [
  ['almondega-premium', 'Almôndega Premium', 'Salada completa com almôndegas bovinas, queijo, tomate, cebola roxa e massa fria.', 34.9],
  ['basic-lombo', 'Basic Lombo', 'Lombo suíno com ovo de codorna, milho, cenoura e folhas frescas.', 31.9],
  ['especial-file-de-frango', 'Especial Filé de Frango', 'Filé de frango com manga, palmito, legumes e mix de folhas.', 33.9],
  ['magnifico-camarao', 'Magnífico Camarão', 'Camarão com abacaxi, toque red hot, legumes e salada fresca.', 39.9],
  ['queridinha', 'Queridinha', 'Frango desfiado com batata palha, milho, tomate e folhas selecionadas.', 29.9],
  ['tilapia-suprema', 'Tilápia Suprema', 'Tilápia com chips de moranga, lemon pepper, legumes e folhas.', 36.9],
  ['salmao-premium', 'Salmão Premium', 'Salmão em cubos com vegetais frescos, molho cítrico e folhas verdes.', 42.9],
];

const products = salads.map(([slug, name, description, price], index) => ({
  id: `preview-${slug}`,
  slug,
  name,
  description,
  short_description: description,
  price,
  stock_quantity: 100,
  category_name: 'Saladas',
  category_slug: 'saladas',
  product_type_name: 'Saladas',
  tags: index < 3 ? ['Mais pedido'] : [],
  variants: [],
  images: [],
  is_in_stock: true,
  is_low_stock: false,
}));

const category = {
  id: 'preview-saladas',
  name: 'Saladas',
  slug: 'saladas',
  is_active: true,
};

export async function getStaticProps() {
  return {
    props: {
      previewStoreConfig: {
        slug: 'ce-saladas',
        primary_color: '#649e20',
        secondary_color: '#f97316',
      },
      initialCatalog: {
        store: {
          id: 'preview-ce-saladas',
          name: 'Cê Saladas',
          slug: 'ce-saladas',
          logo_url: '',
          metadata: {
            city: 'Araguaína',
            state: 'TO',
            catalog_pitch: 'saladas autorais, frescas e completas para o dia a dia.',
            business_hours_label: 'preview visual',
          },
        },
        categories: [category],
        products,
        products_by_category: {
          [category.id]: products,
        },
        combos: [],
        featured_products: products.slice(0, 4),
        product_types: [],
      },
    },
  };
}

export default Cardapio;
