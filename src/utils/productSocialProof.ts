import { DigitalProduct } from '../types';

export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function isProductWithStock(product: { unlimitedStock?: boolean; stockQuantity?: number }): boolean {
  if (product.unlimitedStock) return true;
  return Number(product.stockQuantity ?? 1) >= 1;
}

export interface SocialProofMetrics {
  rating: number;
  downloadsCount: number;
  reviewsCount: number;
}

const MIN_SOLICITACOES = 12;
const MAX_SOLICITACOES = 1896;
const SOLICITACOES_SPAN = MAX_SOLICITACOES - MIN_SOLICITACOES; // 1884

/**
 * Aplica métricas de avaliação (estrelas de 4 a 5) e solicitações únicas (12 a 1896),
 * com valores coerentes com o tamanho das coleções (coleções maiores recebem mais solicitações),
 * garantindo estritamente que nenhum valor de solicitações se repita entre os produtos em estoque.
 */
export function applySocialProof(products: DigitalProduct[]): DigitalProduct[] {
  if (!products || products.length === 0) return [];

  // 1. Identificar produtos com +1 em estoque e produtos sem estoque
  const inStockProducts: DigitalProduct[] = [];
  const outOfStockMap = new Map<string, DigitalProduct>();

  for (const product of products) {
    if (isProductWithStock(product)) {
      inStockProducts.push(product);
    } else {
      outOfStockMap.set(product.id, {
        ...product,
        downloadsCount: 0,
        rating: 0,
        reviewsCount: 0,
      });
    }
  }

  // 2. Contar produtos por coleção entre os itens em estoque
  const collectionCounts = new Map<string, number>();
  for (const product of inStockProducts) {
    const colId = product.collectionId || 'uncategorized';
    collectionCounts.set(colId, (collectionCounts.get(colId) || 0) + 1);
  }

  // 3. Ordenar produtos em estoque por:
  //    - Tamanho da coleção crescente (coleções com mais produtos ficam no topo do range)
  //    - ID da coleção (critério determinístico para desempate)
  //    - Hash determinístico do ID do produto
  const sortedInStock = [...inStockProducts].sort((a, b) => {
    const colA = a.collectionId || 'uncategorized';
    const colB = b.collectionId || 'uncategorized';
    const countA = collectionCounts.get(colA) || 0;
    const countB = collectionCounts.get(colB) || 0;

    if (countA !== countB) return countA - countB;
    if (colA !== colB) return colA.localeCompare(colB);
    return hashString(a.id) - hashString(b.id);
  });

  const totalInStock = sortedInStock.length;
  const metricsMap = new Map<string, SocialProofMetrics>();
  const usedDownloads = new Set<number>();

  for (let index = 0; index < totalInStock; index++) {
    const product = sortedInStock[index];
    const hash = hashString(product.id);

    // Solicitações únicas de 12 a 1896 proporcionais ao rank da coleção
    let downloadsCount = totalInStock > 1
      ? Math.round(MIN_SOLICITACOES + (index * SOLICITACOES_SPAN) / (totalInStock - 1))
      : MAX_SOLICITACOES;

    // Garantia matemática de unicidade estrita: sem repetições
    while (usedDownloads.has(downloadsCount) && downloadsCount < MAX_SOLICITACOES) {
      downloadsCount++;
    }
    while (usedDownloads.has(downloadsCount) && downloadsCount > MIN_SOLICITACOES) {
      downloadsCount--;
    }
    usedDownloads.add(downloadsCount);

    // Avaliação por estrelas de 4.0 a 5.0 (com 1 casa decimal)
    // Coleções maiores acompanham maior pontuação média mantendo distribuição orgânica
    const relativePos = totalInStock > 1 ? index / (totalInStock - 1) : 1;
    const baseRating = 4.4 + relativePos * 0.4; // 4.4 a 4.8
    const variation = ((hash % 7) - 3) * 0.1; // -0.3 a +0.3
    const rawRating = Math.round((baseRating + variation) * 10) / 10;
    const rating = Math.min(5.0, Math.max(4.0, rawRating));

    // Quantidade de avaliações coerente com as solicitações (~7% a 12%, mínimo 1)
    const reviewsCount = Math.max(1, Math.round(downloadsCount * (0.07 + (hash % 6) * 0.01)));

    metricsMap.set(product.id, {
      downloadsCount,
      rating,
      reviewsCount,
    });
  }

  // 4. Retornar os produtos preservando a ordem original de entrada
  return products.map(product => {
    if (outOfStockMap.has(product.id)) {
      return outOfStockMap.get(product.id)!;
    }
    const metrics = metricsMap.get(product.id);
    if (!metrics) return product;

    return {
      ...product,
      downloadsCount: metrics.downloadsCount,
      rating: metrics.rating,
      reviewsCount: metrics.reviewsCount,
    };
  });
}
