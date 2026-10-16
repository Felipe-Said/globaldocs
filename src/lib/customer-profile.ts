export const normalizeCustomerName = (value: string) => value.trim().replace(/\s+/g, ' ');

export const normalizeTaxId = (value: string) => value.replace(/\D/g, '').slice(0, 14);

const allDigitsEqual = (value: string) => /^(\d)\1+$/.test(value);

const isValidCpf = (value: string) => {
  if (value.length !== 11 || allDigitsEqual(value)) return false;
  const digit = (length: number) => {
    const sum = value.slice(0, length).split('').reduce((total, number, index) => (
      total + Number(number) * (length + 1 - index)
    ), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(value[9]) && digit(10) === Number(value[10]);
};

const isValidCnpj = (value: string) => {
  if (value.length !== 14 || allDigitsEqual(value)) return false;
  const calculateDigit = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = value.slice(0, length).split('').reduce((total, number, index) => (
      total + Number(number) * weights[index]
    ), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculateDigit(12) === Number(value[12]) && calculateDigit(13) === Number(value[13]);
};

export const isValidTaxId = (value: string) => {
  const digits = normalizeTaxId(value);
  return digits.length === 11 ? isValidCpf(digits) : isValidCnpj(digits);
};

export const formatTaxId = (value: string) => {
  const digits = normalizeTaxId(value);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

