import { describe, it, expect } from 'vitest';
import { parseDescriptionBlocks, descriptionPreview } from '../productDescription';

describe('parseDescriptionBlocks', () => {
  it('separa parágrafos por linha em branco', () => {
    const blocks = parseDescriptionBlocks('Massa artesanal.\n\nFeita diariamente.');
    expect(blocks).toEqual([
      { type: 'p', text: 'Massa artesanal.' },
      { type: 'p', text: 'Feita diariamente.' },
    ]);
  });

  it('agrupa linhas com hífen em lista', () => {
    const blocks = parseDescriptionBlocks('Acompanha:\n- Molho branco\n- Queijo ralado\nBom apetite');
    expect(blocks[0]).toEqual({ type: 'p', label: 'Acompanha', text: '' });
    expect(blocks[1]).toEqual({ type: 'ul', items: ['Molho branco', 'Queijo ralado'] });
    expect(blocks[2]).toEqual({ type: 'p', text: 'Bom apetite' });
  });

  it('destaca rótulo curto "Label: texto"', () => {
    const blocks = parseDescriptionBlocks('Modo de preparo: retire e aqueça por 10 min');
    expect(blocks[0].label).toBe('Modo de preparo');
    expect(blocks[0].text).toBe('retire e aqueça por 10 min');
  });

  it('não trata frase longa com dois-pontos como rótulo', () => {
    const long = 'Uma frase bem comprida que passa de trinta e dois caracteres antes: do resto';
    expect(parseDescriptionBlocks(long)[0].label).toBeUndefined();
  });

  it('texto vazio vira lista vazia', () => {
    expect(parseDescriptionBlocks('')).toEqual([]);
    expect(parseDescriptionBlocks(null)).toEqual([]);
  });
});

describe('descriptionPreview', () => {
  it('retorna só o primeiro parágrafo', () => {
    expect(descriptionPreview('Rondelli artesanal.\n\nModo de preparo: aqueça.')).toBe('Rondelli artesanal.');
  });

  it('ignora linhas em branco iniciais', () => {
    expect(descriptionPreview('\n\nPrimeira linha real')).toBe('Primeira linha real');
  });
});
