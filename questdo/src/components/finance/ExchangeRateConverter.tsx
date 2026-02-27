// 환율 변환기 컴포넌트 — Apple 스타일
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useExchangeRate, formatCurrency } from '@/hooks/useExchangeRate';
import { CurrencyCode, CURRENCY_LABELS } from '@/types/task';
import { ArrowRightLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ExchangeRateConverterProps {
  initialAmount?: number;
  initialFrom?: CurrencyCode;
  initialTo?: CurrencyCode;
  onConvert?: (result: {
    amount: number;
    from: CurrencyCode;
    to: CurrencyCode;
    convertedAmount: number;
    rate: number;
  }) => void;
  compact?: boolean;
}

export const ExchangeRateConverter = ({
  initialAmount = 0,
  initialFrom = 'USD',
  initialTo = 'KRW',
  onConvert,
  compact = false,
}: ExchangeRateConverterProps) => {
  const { language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const { rates, isLoading, error, lastUpdated, convert, refresh } = useExchangeRate('USD');

  const [amount, setAmount] = useState(initialAmount.toString());
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(initialFrom);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(initialTo);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const currencies = Object.keys(CURRENCY_LABELS) as CurrencyCode[];

  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      const result = convert(num, fromCurrency, toCurrency);
      setConvertedAmount(result);
      if (result !== null && onConvert) {
        const fromRate = fromCurrency === 'USD' ? 1 : (rates?.[fromCurrency] || 1);
        const toRate = toCurrency === 'USD' ? 1 : (rates?.[toCurrency] || 1);
        const exchangeRate = toRate / fromRate;
        onConvert({
          amount: num,
          from: fromCurrency,
          to: toCurrency,
          convertedAmount: result,
          rate: exchangeRate,
        });
      }
    } else {
      setConvertedAmount(null);
    }
  }, [amount, fromCurrency, toCurrency, rates]); // eslint-disable-line react-hooks/exhaustive-deps

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const fromRate = fromCurrency === 'USD' ? 1 : (rates?.[fromCurrency] || 1);
  const toRate = toCurrency === 'USD' ? 1 : (rates?.[toCurrency] || 1);
  const exchangeRate = toRate / fromRate;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* 금액 입력 + 통화 선택 한 줄 */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="rounded-xl flex-1"
            min="0"
            step="any"
          />
          <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as CurrencyCode)}>
            <SelectTrigger className="rounded-xl w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c].symbol} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 변환 결과 */}
        {convertedAmount !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as CurrencyCode)}>
              <SelectTrigger className="rounded-xl w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CURRENCY_LABELS[c].symbol} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[14px] font-semibold text-primary">
              {formatCurrency(convertedAmount, toCurrency)}
            </span>
          </motion.div>
        )}

        {/* 환율 정보 */}
        {rates && (
          <p className="text-[10px] text-muted-foreground">
            1 {fromCurrency} = {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCurrency}
            {lastUpdated && ` · ${lang === 'ko' ? '기준:' : 'as of'} ${lastUpdated}`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-[#007AFF]/5 to-[#AF52DE]/5 border border-border/30">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#007AFF]" />
          {lang === 'ko' ? '환율 변환기' : 'Exchange Rate'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <p className="text-[11px] text-[#FF3B30]">{error}</p>
      )}

      {/* FROM */}
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground">
          {lang === 'ko' ? '변환할 금액' : 'Amount'}
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="rounded-xl flex-1 text-[16px] font-medium"
            min="0"
            step="any"
          />
          <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as CurrencyCode)}>
            <SelectTrigger className="rounded-xl w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-1.5">
                    <span>{CURRENCY_LABELS[c].symbol}</span>
                    <span>{CURRENCY_LABELS[c][lang]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 스왑 버튼 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-dashed"
          onClick={swapCurrencies}
          type="button"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* TO */}
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground">
          {lang === 'ko' ? '변환 결과' : 'Converted'}
        </Label>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-background border border-border/50 px-3 py-2.5 flex items-center">
            <span className="text-[16px] font-semibold text-primary">
              {convertedAmount !== null
                ? formatCurrency(convertedAmount, toCurrency)
                : '-'}
            </span>
          </div>
          <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as CurrencyCode)}>
            <SelectTrigger className="rounded-xl w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-1.5">
                    <span>{CURRENCY_LABELS[c].symbol}</span>
                    <span>{CURRENCY_LABELS[c][lang]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 환율 정보 */}
      {rates && (
        <div className="text-center space-y-0.5">
          <p className="text-[12px] font-medium text-foreground">
            1 {fromCurrency} = {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCurrency}
          </p>
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground">
              {lang === 'ko' ? `기준일: ${lastUpdated}` : `As of ${lastUpdated}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
