const SPACE_PATTERN = /\s+/g;

const cleanText = (value) => String(value || '').replace(SPACE_PATTERN, ' ').trim();

const firstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
};

const amountFromMatch = (match) => {
  if (!match) return '';
  const currency = cleanText(match.groups?.currency || '');
  const symbol = cleanText(match.groups?.symbol || '');
  const amount = cleanText(match.groups?.amount || '');
  return [currency, symbol, amount].filter(Boolean).join(' ').replace(/\s+/g, ' ');
};

const addFact = (facts, key, label, value) => {
  const normalizedValue = cleanText(value);
  if (!normalizedValue || facts.some((fact) => fact.key === key)) return;
  facts.push({ key, label, value: normalizedValue });
};

const AMOUNT = '(?:(?<currency>USD|BRL|EUR)\\s*)?(?<symbol>R\\$|US\\$|\\$|€|£)?\\s*(?<amount>\\d[\\d.,]*)';

/**
 * Extracts only facts explicitly present in supplier-provided product text.
 * It intentionally does not infer missing values from category, price or stock.
 */
export const extractAdAccountMetadata = (product) => {
  if (String(product?.supplier || '').toLowerCase() !== 'nppr') return [];

  const text = cleanText([
    product?.title,
    product?.tagline,
    product?.description,
    product?.accountDetails,
  ].filter(Boolean).join(' · '));

  if (!text || !/(?:\bbm\b|business\s+manager|gerenciador\s+de\s+neg[oó]cios|ad\s*accounts?|contas?\s+de\s+an[uú]ncios?|\bads?\b)/i.test(text)) {
    return [];
  }

  const facts = [];

  const totalSpend = firstMatch(text, [
    new RegExp(`(?:gastos?\\s+totais|total\\s+(?:spend|spent))\\s*[:\\-]?\\s*${AMOUNT}`, 'i'),
  ]);
  addFact(facts, 'total-spend', 'Gastos totais', amountFromMatch(totalSpend));

  const bmCount = firstMatch(text, [
    /(?:^|[^\d])(\d+)\s*(?:verificad[ao]s?|restabelecid[ao]s?|reinstated|verified)?\s*bms?\b/i,
  ]);
  if (bmCount) {
    addFact(facts, 'bm-count', 'Business Managers', bmCount[1]);
  } else if (/\bbm\b|business\s+manager|gerenciador\s+de\s+neg[oó]cios/i.test(text)) {
    addFact(facts, 'bm-included', 'Business Manager', 'Incluído');
  }

  const adAccounts = firstMatch(text, [
    /(\d+)\s*(?:ads?|ad\s+accounts?|contas?\s+de\s+an[uú]ncios?)\s*(?:can\s+create|podem?\s+(?:ser\s+)?criad[ao]s?|para\s+criar)/i,
  ]);
  if (adAccounts) {
    const afterSpend = text.match(/\((\d+)\s*(?:after\s+spend|ap[oó]s\s+(?:gasto|investimento)s?)\)/i);
    addFact(
      facts,
      'ad-accounts',
      'Contas de anúncio',
      afterSpend ? `${adAccounts[1]} (até ${afterSpend[1]} após gastos)` : adAccounts[1],
    );
  }

  const metaLimit = firstMatch(text, [
    new RegExp(`(?:limite\\s+(?:meta|externo)|meta\\s+limit|billing\\s+threshold|spending\\s+limit|\\blimit)\\s*[:\\-]?\\s*${AMOUNT}`, 'i'),
  ]);
  addFact(facts, 'limit', 'Limite informado', amountFromMatch(metaLimit));

  const openCycle = firstMatch(text, [
    new RegExp(`(?:ciclo\\s+aberto|open\\s+cycle)\\s*[:\\-]?\\s*${AMOUNT}`, 'i'),
  ]);
  addFact(facts, 'open-cycle', 'Ciclo aberto', amountFromMatch(openCycle));

  const debt = firstMatch(text, [
    new RegExp(`(?:d[ií]vida|debt)\\s*[:\\-]?\\s*${AMOUNT}`, 'i'),
  ]);
  addFact(facts, 'debt', 'Dívida informada', amountFromMatch(debt));

  const yearRange = text.match(/\b(20\d{2})\s*[-–]\s*(20\d{2})\b/);
  const singleYear = yearRange ? null : text.match(/\b(20\d{2})\b/);
  if (yearRange) addFact(facts, 'year', 'Período', `${yearRange[1]}–${yearRange[2]}`);
  else if (singleYear) addFact(facts, 'year', 'Ano', singleYear[1]);

  const currency = text.match(/(?:currency|moeda)\s*:\s*(USD|BRL|EUR)\b/i);
  if (currency) addFact(facts, 'currency', 'Moeda', currency[1].toUpperCase());

  const disabledAccounts = text.match(/(\d+)\s*(?:contas?\s+desabilitadas?|disabled\s+(?:ad\s+)?accounts?)/i);
  if (disabledAccounts) addFact(facts, 'disabled-accounts', 'Contas desabilitadas', disabledAccounts[1]);

  const timezone = text.match(/(?:fuso\s+hor[aá]rio(?:\s+principal)?|time\s*zone)\s*:\s*([A-Za-z_]+\/[A-Za-z_+\-]+(?:\s*\([^)]+\))?)/i);
  if (timezone) addFact(facts, 'timezone', 'Fuso horário', timezone[1]);

  return facts;
};

