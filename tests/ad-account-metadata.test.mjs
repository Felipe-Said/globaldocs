import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAdAccountMetadata } from '../src/utils/adAccountMetadata.mjs';

const importedProduct = (title, description = '') => ({
  supplier: 'nppr',
  title,
  tagline: '',
  description,
});

test('extracts only explicit BM, account, limit and year facts', () => {
  const facts = extractAdAccountMetadata(importedProduct(
    'Facebook Business Manager · 4 verified BM on profile · 2026 · Limit $50 · 1 Ads can create (3 after spend)',
  ));

  assert.deepEqual(facts, [
    { key: 'bm-count', label: 'Business Managers', value: '4' },
    { key: 'ad-accounts', label: 'Contas de anúncio', value: '1 (até 3 após gastos)' },
    { key: 'limit', label: 'Limite informado', value: '$ 50' },
    { key: 'year', label: 'Ano', value: '2026' },
  ]);
});

test('extracts screenshot-style metrics only when the text supplies them', () => {
  const facts = extractAdAccountMetadata(importedProduct(
    'BM Brasil · Gastos Totais: R$ 64.975,36 · Ciclo Aberto: R$ 467,00 · Ano de criação: 2024 · 5 Contas de Anúncios para criar · Limite Meta: R$ 1.549,24 · Dívida: R$ 262,68 · 3 Contas desabilitadas · Fuso Horário Principal: America/Los_Angeles (-7)',
  ));

  assert.deepEqual(facts, [
    { key: 'total-spend', label: 'Gastos totais', value: 'R$ 64.975,36' },
    { key: 'bm-included', label: 'Business Manager', value: 'Incluído' },
    { key: 'ad-accounts', label: 'Contas de anúncio', value: '5' },
    { key: 'limit', label: 'Limite informado', value: 'R$ 1.549,24' },
    { key: 'open-cycle', label: 'Ciclo aberto', value: 'R$ 467,00' },
    { key: 'debt', label: 'Dívida informada', value: 'R$ 262,68' },
    { key: 'year', label: 'Ano', value: '2024' },
    { key: 'disabled-accounts', label: 'Contas desabilitadas', value: '3' },
    { key: 'timezone', label: 'Fuso horário', value: 'America/Los_Angeles (-7)' },
  ]);
});

test('does not invent facts for imported products without explicit ad metadata', () => {
  assert.deepEqual(extractAdAccountMetadata(importedProduct('Conta Gmail antiga com recuperação')), []);
  assert.deepEqual(extractAdAccountMetadata(importedProduct('Conta Facebook com anúncios ativos')), []);
});

test('does not expose metadata for non-supplier products', () => {
  assert.deepEqual(extractAdAccountMetadata({
    supplier: 'manual',
    title: 'Business Manager · 5 BM · Limit $250 · 2025',
  }), []);
});

