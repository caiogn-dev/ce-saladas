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
    expect(CAMINHOS_DA_PLATAFORMA).toHaveLength(redirects.length);
  });

  it('a vitrine canônica é a da loja na plataforma, com https', () => {
    expect(STOREFRONT_CANONICO).toBe('https://cardapidex.com.br/ce-saladas');
  });
});
