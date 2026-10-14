import React from 'react';
import { Coins } from 'lucide-react';

export interface UsdtQuote {
  enabled: boolean;
  estimatedAmount?: number;
  payCurrency?: string;
  minAmount?: number;
  meetsMinimum?: boolean;
  error?: string;
}

interface UsdtEstimateProps {
  amount: number;
  compact?: boolean;
  onQuote?: (quote: UsdtQuote | null) => void;
}

export const UsdtEstimate: React.FC<UsdtEstimateProps> = ({ amount, compact = false, onQuote }) => {
  const [quote, setQuote] = React.useState<UsdtQuote | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setQuote(null);
      onQuote?.(null);
      return;
    }

    const controller = new AbortController();
    setQuote(null);
    onQuote?.(null);
    void fetch(`/api/nowpayments/estimate?amount=${encodeURIComponent(amount.toFixed(2))}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async response => {
        const result = await response.json();
        if (!response.ok && !result.enabled) return null;
        return result as UsdtQuote;
      })
      .then(result => {
        if (result) {
          setQuote(result);
          onQuote?.(result);
        }
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setQuote(null);
      });

    return () => controller.abort();
  }, [amount, onQuote]);

  if (!quote?.enabled) return null;

  const currency = (quote.payCurrency || 'usdt').toUpperCase();
  const value = quote.estimatedAmount?.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  if (compact) {
    return (
      <div className="mt-1 text-[11px] leading-snug" aria-live="polite">
        {quote.error ? (
          <span className="text-rose-700">Cotação USDT indisponível no momento.</span>
        ) : (
          <>
            <span className="font-semibold text-emerald-800">≈ {value} {currency}</span>
            {quote.meetsMinimum === false && (
              <span className="block text-amber-800">Abaixo do mínimo de {Number(quote.minAmount || 0).toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {currency}.</span>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-950" aria-live="polite">
      <div className="flex items-start gap-2">
        <Coins className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-emerald-800">Valor estimado em USDT</div>
          {quote.error ? (
            <div className="mt-0.5 text-xs text-rose-700">Cotação indisponível. Tente novamente em instantes.</div>
          ) : (
            <>
              <div className="mt-0.5 font-mono text-base font-bold tabular-nums">≈ {value} {currency}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-emerald-800">
                Estimativa ao vivo. O valor exato é fixado quando a cobrança é gerada.
              </div>
              {quote.meetsMinimum === false && (
                <div className="mt-1 text-[11px] font-semibold text-amber-800">
                  Este total está abaixo do mínimo atual de {Number(quote.minAmount || 0).toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {currency}.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
