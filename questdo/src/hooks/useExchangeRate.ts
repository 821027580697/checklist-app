// 실시간 환율 조회 훅 — Frankfurter API (무료, API 키 불필요)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencyCode } from '@/types/task';

interface ExchangeRates {
  base: CurrencyCode;
  date: string;
  rates: Record<string, number>;
}

interface UseExchangeRateReturn {
  rates: Record<string, number> | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  convert: (amount: number, from: CurrencyCode, to: CurrencyCode) => number | null;
  refresh: () => void;
}

// Frankfurter API는 KRW를 직접 지원하지 않으므로 대체 API 사용
// 무료 Exchangerate API: https://api.exchangerate-api.com/v4/latest/USD
const CACHE_KEY = 'questdo_exchange_rates';
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 캐시

export const useExchangeRate = (baseCurrency: CurrencyCode = 'USD'): UseExchangeRateReturn => {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    // 캐시 확인
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.base === baseCurrency) {
          setRates(parsed.rates);
          setLastUpdated(parsed.date);
          return;
        }
      }
    } catch {
      // 캐시 파싱 실패 시 무시
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      );
      if (!response.ok) throw new Error('환율 데이터를 가져올 수 없습니다');

      const data = await response.json();
      setRates(data.rates);
      setLastUpdated(data.date);

      // 캐시 저장
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          rates: data.rates,
          date: data.date,
          base: baseCurrency,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '환율 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  const convert = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number | null => {
      if (!rates) return null;
      if (from === to) return amount;

      // base가 USD인 경우
      const fromRate = from === baseCurrency ? 1 : rates[from];
      const toRate = to === baseCurrency ? 1 : rates[to];

      if (!fromRate || !toRate) return null;
      return (amount / fromRate) * toRate;
    },
    [rates, baseCurrency],
  );

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    isLoading,
    error,
    lastUpdated,
    convert,
    refresh: fetchRates,
  };
};

// 통화 포매팅 유틸
export const formatCurrency = (amount: number, currency: CurrencyCode): string => {
  const formatters: Record<CurrencyCode, Intl.NumberFormat> = {
    KRW: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
    AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
    CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    CHF: new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }),
    HKD: new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD' }),
    SGD: new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }),
    THB: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }),
    VND: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }),
  };

  try {
    return formatters[currency]?.format(amount) || `${amount} ${currency}`;
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
};
