import test from 'node:test';
import assert from 'node:assert/strict';

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function isProductWithStock(product) {
  if (product.unlimitedStock) return true;
  return Number(product.stockQuantity ?? 1) >= 1;
}

const MIN_SOLICITACOES = 12;
const MAX_SOLICITACOES = 1896;
const SOLICITACOES_SPAN = MAX_SOLICITACOES - MIN_SOLICITACOES;

function applySocialProof(products) {
  if (!products || products.length === 0) return [];

  const inStockProducts = [];
  const outOfStockMap = new Map();

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

  const collectionCounts = new Map();
  for (const product of inStockProducts) {
    const colId = product.collectionId || 'uncategorized';
    collectionCounts.set(colId, (collectionCounts.get(colId) || 0) + 1);
  }

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
  const metricsMap = new Map();
  const usedDownloads = new Set();

  for (let index = 0; index < totalInStock; index++) {
    const product = sortedInStock[index];
    const hash = hashString(product.id);

    let downloadsCount = totalInStock > 1
      ? Math.round(MIN_SOLICITACOES + (index * SOLICITACOES_SPAN) / (totalInStock - 1))
      : MAX_SOLICITACOES;

    while (usedDownloads.has(downloadsCount) && downloadsCount < MAX_SOLICITACOES) {
      downloadsCount++;
    }
    while (usedDownloads.has(downloadsCount) && downloadsCount > MIN_SOLICITACOES) {
      downloadsCount--;
    }
    usedDownloads.add(downloadsCount);

    const relativePos = totalInStock > 1 ? index / (totalInStock - 1) : 1;
    const baseRating = 4.4 + relativePos * 0.4;
    const variation = ((hash % 7) - 3) * 0.1;
    const rawRating = Math.round((baseRating + variation) * 10) / 10;
    const rating = Math.min(5.0, Math.max(4.0, rawRating));
    const reviewsCount = Math.max(1, Math.round(downloadsCount * (0.07 + (hash % 6) * 0.01)));

    metricsMap.set(product.id, {
      downloadsCount,
      rating,
      reviewsCount,
    });
  }

  return products.map(product => {
    if (outOfStockMap.has(product.id)) {
      return outOfStockMap.get(product.id);
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

test('Social proof assigns unique solicitações from 12 to 1896 without repetition', () => {
  const dummyProducts = Array.from({ length: 500 }, (_, i) => ({
    id: `prod-${i}`,
    title: `Product ${i}`,
    collectionId: `col-${i % 10}`,
    stockQuantity: (i % 5) + 1,
    unlimitedStock: i % 2 === 0,
    rating: 5,
    downloadsCount: 0,
    reviewsCount: 0,
  }));

  const result = applySocialProof(dummyProducts);
  const seenDownloads = new Set();

  for (const p of result) {
    assert.ok(p.downloadsCount >= 12, `downloadsCount should be >= 12, got ${p.downloadsCount}`);
    assert.ok(p.downloadsCount <= 1896, `downloadsCount should be <= 1896, got ${p.downloadsCount}`);
    assert.equal(seenDownloads.has(p.downloadsCount), false, `downloadsCount ${p.downloadsCount} was duplicated`);
    seenDownloads.add(p.downloadsCount);

    assert.ok(p.rating >= 4.0, `rating should be >= 4.0, got ${p.rating}`);
    assert.ok(p.rating <= 5.0, `rating should be <= 5.0, got ${p.rating}`);
  }

  assert.equal(seenDownloads.size, 500, 'All 500 products must have unique downloadsCount');
});

test('Collections with more products have higher average and upper solicitações', () => {
  const smallColProducts = Array.from({ length: 2 }, (_, i) => ({
    id: `small-${i}`,
    collectionId: 'col-small',
    stockQuantity: 1,
    unlimitedStock: false,
  }));

  const medColProducts = Array.from({ length: 20 }, (_, i) => ({
    id: `med-${i}`,
    collectionId: 'col-med',
    stockQuantity: 5,
    unlimitedStock: true,
  }));

  const largeColProducts = Array.from({ length: 200 }, (_, i) => ({
    id: `large-${i}`,
    collectionId: 'col-large',
    stockQuantity: 10,
    unlimitedStock: true,
  }));

  const all = [...smallColProducts, ...medColProducts, ...largeColProducts];
  const result = applySocialProof(all);

  const getStats = (colId) => {
    const items = result.filter(p => p.collectionId === colId);
    const sum = items.reduce((acc, p) => acc + p.downloadsCount, 0);
    const min = Math.min(...items.map(p => p.downloadsCount));
    const max = Math.max(...items.map(p => p.downloadsCount));
    return { count: items.length, avg: sum / items.length, min, max };
  };

  const smallStats = getStats('col-small');
  const medStats = getStats('col-med');
  const largeStats = getStats('col-large');

  assert.ok(smallStats.avg < medStats.avg, 'Small collection average must be less than medium collection');
  assert.ok(medStats.avg < largeStats.avg, 'Medium collection average must be less than large collection');
  assert.ok(smallStats.max < medStats.max, 'Small collection max must be less than medium collection max');
  assert.ok(medStats.max < largeStats.max, 'Medium collection max must be less than large collection max');
});

test('Products without stock are not assigned positive social proof', () => {
  const inStock = {
    id: 'in-stock-1',
    collectionId: 'col-1',
    stockQuantity: 3,
    unlimitedStock: false,
  };

  const outOfStock = {
    id: 'out-of-stock-1',
    collectionId: 'col-1',
    stockQuantity: 0,
    unlimitedStock: false,
  };

  const result = applySocialProof([inStock, outOfStock]);
  const inStockRes = result.find(p => p.id === inStock.id);
  const outOfStockRes = result.find(p => p.id === outOfStock.id);

  assert.ok(inStockRes.downloadsCount >= 12 && inStockRes.downloadsCount <= 1896);
  assert.ok(inStockRes.rating >= 4.0 && inStockRes.rating <= 5.0);
  assert.equal(outOfStockRes.downloadsCount, 0);
  assert.equal(outOfStockRes.rating, 0);
});
