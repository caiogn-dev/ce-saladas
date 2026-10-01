import { describe, expect, it } from 'vitest';
import nextConfig, { CAMINHOS_DA_PLATAFORMA, STOREFRONT_CANONICO } from '../../next.config.js';

// O domínio próprio não serve /orders, /carteira e /promos — o convite de
// avaliação e o link da carteira caíam num 404. Estes caminhos precisam
// mandar o cliente para a vitrine canônica, preservando o resto da URL.
describe('redirects do domínio próprio para a plataforma', () => {
  it('redireciona os três caminhos com o token/rota preservados', async () => {
    const redirects = await nextConfig.redirects();
    for (const caminho of ['/orders', '/carteira', '/promos']) {
      const regra = redirects.find((r) => r.source === `${caminho}/:path*`);
      expect(regra, `falta redirect de ${caminho}`).toBeTruthy();
      expect(regra.destination).toBe(`${STOREFRONT_CANONICO}${caminho}/:path*`);
      expect(regra.permanent).toBe(true);
    }
    expect(redirects.filter((r) => r.permanent)).toHaveLength(CAMINHOS_DA_PLATAFORMA.length);
  });

  it('a vitrine canônica é a da loja na plataforma, com https', () => {
    expect(STOREFRONT_CANONICO).toBe('https://cardapidex.com.br/ce-saladas');
  });
});

// 01/10: o cardápio daqui era uma cópia antiga (barra de categorias sumia ao
// rolar; sacola, pagamento e endereço novos nunca chegaram). O dono escolheu
// mandar a compra para a vitrine canônica. Temporário (307): se mudar de
// ideia, o navegador do cliente não fica preso ao redirecionamento.
describe('cardápio e checkout vão para a vitrine canônica', () => {
  it('/cardapio vai para a raiz da loja na plataforma', async () => {
    const redirects = await nextConfig.redirects();
    const regra = redirects.find((r) => r.source === '/cardapio');
    expect(regra.destination).toBe(STOREFRONT_CANONICO);
    expect(regra.permanent).toBe(false);
  });

  it('checkout, perfil, login e registro mantêm o caminho', async () => {
    const redirects = await nextConfig.redirects();
    for (const caminho of ['/checkout', '/perfil', '/login', '/registro']) {
      const regra = redirects.find((r) => r.source === `${caminho}/:path*`);
      expect(regra, caminho).toBeTruthy();
      expect(regra.destination).toBe(`${STOREFRONT_CANONICO}${caminho}/:path*`);
      expect(regra.permanent).toBe(false);
    }
  });

  it('retornos de pagamento e a página inicial continuam aqui', async () => {
    const redirects = await nextConfig.redirects();
    for (const caminho of ['/', '/sucesso', '/pendente', '/erro']) {
      expect(redirects.some((r) => r.source === caminho || r.source === `${caminho}/:path*`), caminho).toBe(false);
    }
  });
});
