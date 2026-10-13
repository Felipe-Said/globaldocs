// Detecção inteligente de países e banco oficial de bandeiras vetoriais (SVG)
// Utiliza o repositório global FlagCDN (https://flagcdn.com) para bandeiras nítidas, sem bordas e sem emojis

export interface CountryInfo {
  code: string;       // ISO 3166-1 alpha-2 em minúsculas (usado no FlagCDN)
  sigla: string;      // Sigla de exibição uniforme (ex: USA, BRA, UK, EUR)
  name: string;       // Nome completo do país
  flagUrl: string;    // URL do arquivo SVG vetorial oficial
  keywords: string[]; // Termos para detecção
}

// Helper para obter URL da bandeira vetorial SVG do FlagCDN
export const getFlagSvgUrl = (code: string): string => {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
};

// Banco de países relevantes para formação de empresas, contas bancárias, remessas e serviços globais
export const KNOWN_COUNTRIES: CountryInfo[] = [
  {
    code: 'us',
    sigla: 'USA',
    name: 'Estados Unidos',
    flagUrl: getFlagSvgUrl('us'),
    keywords: [
      'eua', 'usa', 'estados unidos', 'united states', 'américa', 'america', 'us',
      'delaware', 'wyoming', 'florida', 'flórida', 'new mexico', 'novo méxico',
      'texas', 'california', 'califórnia', 'irs', 'ss-4', 'ein', 'mercury',
      'stripe us', 'relay financial', 'us banking', 'americano', 'americana'
    ]
  },
  {
    code: 'br',
    sigla: 'BRA',
    name: 'Brasil',
    flagUrl: getFlagSvgUrl('br'),
    keywords: [
      'brasil', 'brazil', 'br', 'sedex', 'correios', 'receita federal',
      'cnpj', 'cpf', 'brasileiro', 'brasileira', 'nacional', 'remessa brasil'
    ]
  },
  {
    code: 'gb',
    sigla: 'UK',
    name: 'Reino Unido',
    flagUrl: getFlagSvgUrl('gb'),
    keywords: [
      'reino unido', 'uk', 'londres', 'london', 'england', 'inglaterra',
      'great britain', 'britânico', 'britânica', 'companies house', 'ltd'
    ]
  },
  {
    code: 'eu',
    sigla: 'EUR',
    name: 'União Europeia',
    flagUrl: getFlagSvgUrl('eu'),
    keywords: [
      'união europeia', 'uniao europeia', 'europa', 'european union',
      'euro', 'iban europeu', 'sepa', 'europeia', 'europeu'
    ]
  },
  {
    code: 'ca',
    sigla: 'CAN',
    name: 'Canadá',
    flagUrl: getFlagSvgUrl('ca'),
    keywords: ['canadá', 'canada', 'canadense', 'ontario', 'toronto', 'vancouver']
  },
  {
    code: 'pt',
    sigla: 'PRT',
    name: 'Portugal',
    flagUrl: getFlagSvgUrl('pt'),
    keywords: ['portugal', 'lisboa', 'porto', 'nif portugal', 'português', 'portuguesa']
  },
  {
    code: 'de',
    sigla: 'DEU',
    name: 'Alemanha',
    flagUrl: getFlagSvgUrl('de'),
    keywords: ['alemanha', 'germany', 'deutschland', 'berlim', 'alemão', 'alemã', 'gmbh']
  },
  {
    code: 'ie',
    sigla: 'IRL',
    name: 'Irlanda',
    flagUrl: getFlagSvgUrl('ie'),
    keywords: ['irlanda', 'ireland', 'dublin', 'irlandês']
  },
  {
    code: 'ch',
    sigla: 'CHE',
    name: 'Suíça',
    flagUrl: getFlagSvgUrl('ch'),
    keywords: ['suíça', 'suica', 'switzerland', 'zurich', 'geneva', 'franco suíço']
  },
  {
    code: 'ae',
    sigla: 'UAE',
    name: 'Emirados Árabes',
    flagUrl: getFlagSvgUrl('ae'),
    keywords: ['emirados', 'dubai', 'uae', 'eau', 'abu dhabi', 'freezone dubai']
  },
  {
    code: 'sg',
    sigla: 'SGP',
    name: 'Singapura',
    flagUrl: getFlagSvgUrl('sg'),
    keywords: ['singapura', 'singapore']
  },
  {
    code: 'hk',
    sigla: 'HKG',
    name: 'Hong Kong',
    flagUrl: getFlagSvgUrl('hk'),
    keywords: ['hong kong', 'hk']
  },
  {
    code: 'ee',
    sigla: 'EST',
    name: 'Estônia',
    flagUrl: getFlagSvgUrl('ee'),
    keywords: ['estônia', 'estonia', 'e-residency', 'eresidency', 'tallinn']
  },
  {
    code: 'cy',
    sigla: 'CYP',
    name: 'Chipre',
    flagUrl: getFlagSvgUrl('cy'),
    keywords: ['chipre', 'cyprus']
  },
  {
    code: 'es',
    sigla: 'ESP',
    name: 'Espanha',
    flagUrl: getFlagSvgUrl('es'),
    keywords: ['espanha', 'spain', 'madrid', 'barcelona', 'espanhol']
  },
  {
    code: 'au',
    sigla: 'AUS',
    name: 'Austrália',
    flagUrl: getFlagSvgUrl('au'),
    keywords: ['austrália', 'australia', 'australiano', 'sydney', 'melbourne']
  },
  {
    code: 'pa',
    sigla: 'PAN',
    name: 'Panamá',
    flagUrl: getFlagSvgUrl('pa'),
    keywords: ['panamá', 'panama']
  },
  {
    code: 'py',
    sigla: 'PRY',
    name: 'Paraguai',
    flagUrl: getFlagSvgUrl('py'),
    keywords: ['paraguai', 'paraguay']
  },
  {
    code: 'uy',
    sigla: 'URY',
    name: 'Uruguai',
    flagUrl: getFlagSvgUrl('uy'),
    keywords: ['uruguai', 'uruguay', 'montevideo']
  }
];

export interface DetectCountryInput {
  title?: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  productType?: string;
  llcJurisdiction?: string;
  accountDetails?: string;
  shippingInfo?: string;
}

/**
 * Detecta países mencionados em textos de produtos de forma precisa com word boundary
 */
export const detectCountries = (input: DetectCountryInput): CountryInfo[] => {
  const textCorpus = [
    input.title || '',
    input.tagline || '',
    input.description || '',
    input.productType || '',
    input.llcJurisdiction || '',
    input.accountDetails || '',
    input.shippingInfo || '',
    (input.tags || []).join(' ')
  ].join(' ').toLowerCase();

  if (!textCorpus.trim()) return [];

  const matched = new Map<string, CountryInfo>();

  for (const country of KNOWN_COUNTRIES) {
    for (const keyword of country.keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Limite de palavra ou início/fim de linha
      const regex = new RegExp(`(?:^|[^a-záàâãéèêíïóôõöúç0-9])${escaped}(?:$|[^a-záàâãéèêíïóôõöúç0-9])`, 'i');

      if (regex.test(textCorpus)) {
        matched.set(country.code, country);
        break; // Match único por país
      }
    }
  }

  return Array.from(matched.values());
};
