export interface AdAccountFact {
  key: string;
  label: string;
  value: string;
}

export interface AdAccountMetadataSource {
  supplier?: string;
  title?: string;
  tagline?: string;
  description?: string;
  accountDetails?: string;
}

export function extractAdAccountMetadata(product: AdAccountMetadataSource): AdAccountFact[];

