// 영수증 OCR 훅 — Tesseract.js 기반 영수증 인식 및 데이터 추출
'use client';

import { useState, useCallback } from 'react';
import { CurrencyCode, TransactionType } from '@/types/task';

// OCR로 추출된 영수증 정보
export interface ReceiptData {
  title: string;          // 거래 내역 제목 (가맹점명 등)
  amount: number;         // 총 금액
  currency: CurrencyCode; // 통화
  merchant: string;       // 가맹점/상호
  date: string;           // 거래 날짜 (yyyy-MM-dd)
  transactionType: TransactionType;
  paymentMethod: string;
  rawText: string;        // 원본 OCR 텍스트
  confidence: number;     // 인식 신뢰도 (0~100)
}

interface UseReceiptOCRReturn {
  isProcessing: boolean;
  progress: number;
  result: ReceiptData | null;
  error: string | null;
  processImage: (file: File) => Promise<ReceiptData | null>;
  reset: () => void;
}

export const useReceiptOCR = (): UseReceiptOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File): Promise<ReceiptData | null> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // 동적 임포트 (코드 스플리팅)
      const Tesseract = await import('tesseract.js');

      setProgress(10);

      // 이미지를 Data URL로 변환
      const imageUrl = await fileToDataUrl(file);
      setProgress(20);

      // OCR 실행 (한국어 + 영어 동시 인식)
      const ocrResult = await Tesseract.recognize(imageUrl, 'kor+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(20 + Math.round((m.progress || 0) * 70));
          }
        },
      });

      setProgress(90);

      const rawText = ocrResult.data.text;
      const confidence = ocrResult.data.confidence;

      // 영수증 데이터 파싱
      const parsedData = parseReceipt(rawText, confidence);
      setProgress(100);
      setResult(parsedData);
      return parsedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : '영수증 인식에 실패했습니다';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    reset,
  };
};

// File → Data URL 변환
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ======== 영수증 파싱 로직 ========

function parseReceipt(rawText: string, confidence: number): ReceiptData {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  return {
    title: extractTitle(lines),
    amount: extractAmount(lines, rawText),
    currency: detectCurrency(rawText),
    merchant: extractMerchant(lines),
    date: extractDate(rawText),
    transactionType: 'expense',   // 영수증은 기본적으로 지출
    paymentMethod: detectPaymentMethod(rawText),
    rawText,
    confidence,
  };
}

// 가맹점명 추출 (첫 번째 의미 있는 텍스트 라인)
function extractMerchant(lines: string[]): string {
  // 일반적으로 영수증 상단에 가맹점명이 있음
  for (const line of lines) {
    // 숫자로만 이루어진 줄, 너무 짧은 줄 제외
    if (line.length < 2) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^[-=_*]+$/.test(line)) continue; // 구분선 제외
    if (/전화|tel|phone|fax|팩스|주소|address/i.test(line)) continue;
    // 날짜 줄 제외
    if (/\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(line)) continue;
    // 금액 관련 줄 제외
    if (/합계|총|total|합산|소계|subtotal|부가세|vat|tax/i.test(line)) continue;

    return line.substring(0, 50); // 최대 50자
  }
  return '';
}

// 제목 생성 (가맹점 기반)
function extractTitle(lines: string[]): string {
  const merchant = extractMerchant(lines);
  if (merchant) return merchant;
  // 폴백: 첫 번째 의미 있는 줄
  for (const line of lines) {
    if (line.length >= 2 && !/^[-=_*]+$/.test(line)) {
      return line.substring(0, 50);
    }
  }
  return '';
}

// 금액 추출 (가장 큰 금액 = 총 금액으로 추정)
function extractAmount(lines: string[], rawText: string): number {
  const amounts: number[] = [];

  // 패턴 1: "합계", "총", "Total", "결제" 등의 키워드 뒤에 오는 금액
  const totalPatterns = [
    /(?:합계|총\s*(?:금액|액)|total|결제\s*금액|받을\s*금액|청구\s*금액|카드\s*승인)\s*[:\s]?\s*[₩\\$€¥]?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /[₩\\$€¥]\s*([\d,]+(?:\.\d{1,2})?)/g,
  ];

  for (const pattern of totalPatterns) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      const amount = parseAmount(match[1]);
      if (amount > 0) amounts.push(amount);
    }
  }

  // 패턴 2: 쉼표로 포맷된 숫자 (1,000 이상)
  const formattedNumbers = rawText.match(/\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?/g);
  if (formattedNumbers) {
    for (const num of formattedNumbers) {
      const amount = parseAmount(num);
      if (amount > 0) amounts.push(amount);
    }
  }

  // 패턴 3: 일반 숫자 (4자리 이상)
  const plainNumbers = rawText.match(/\b\d{4,}\b/g);
  if (plainNumbers) {
    for (const num of plainNumbers) {
      const amount = parseInt(num, 10);
      // 연도처럼 보이는 숫자 제외 (1900~2099)
      if (amount >= 1900 && amount <= 2099) continue;
      // 전화번호 같은 너무 큰 숫자 제외
      if (amount > 100000000) continue;
      if (amount > 0) amounts.push(amount);
    }
  }

  if (amounts.length === 0) return 0;

  // "합계" 키워드 근처의 금액 우선, 없으면 가장 큰 금액
  // 일반적으로 총 금액이 가장 큰 값
  return Math.max(...amounts);
}

// 금액 문자열 → 숫자 변환
function parseAmount(str: string): number {
  const cleaned = str.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 날짜 추출
function extractDate(rawText: string): string {
  // yyyy.MM.dd or yyyy-MM-dd or yyyy/MM/dd
  const datePatterns = [
    /(\d{4})[./-](\d{1,2})[./-](\d{1,2})/,
    /(\d{2})[./-](\d{1,2})[./-](\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      let year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);

      // 2자리 연도 → 4자리
      if (year < 100) year += 2000;

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // 날짜를 찾지 못하면 오늘 날짜
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 통화 감지
function detectCurrency(rawText: string): CurrencyCode {
  if (/₩|원|krw/i.test(rawText)) return 'KRW';
  if (/\$|usd|dollar/i.test(rawText)) return 'USD';
  if (/€|eur|euro/i.test(rawText)) return 'EUR';
  if (/¥|円|yen|jpy/i.test(rawText)) return 'JPY';
  if (/£|gbp|pound/i.test(rawText)) return 'GBP';
  if (/¥|元|cny|rmb/i.test(rawText)) return 'CNY';
  if (/฿|thb|baht/i.test(rawText)) return 'THB';
  if (/₫|vnd|dong/i.test(rawText)) return 'VND';
  // 한국어 텍스트가 포함되어 있으면 KRW로 기본
  if (/[가-힣]/.test(rawText)) return 'KRW';
  return 'KRW'; // 기본값
}

// 결제 수단 감지
function detectPaymentMethod(rawText: string): string {
  const text = rawText.toLowerCase();
  if (/신용\s*카드|credit\s*card|visa|master|amex|mastercard/.test(text)) return 'credit_card';
  if (/체크\s*카드|debit\s*card/.test(text)) return 'debit_card';
  if (/계좌\s*이체|bank\s*transfer|입금/.test(text)) return 'bank_transfer';
  if (/카카오페이|네이버페이|삼성페이|apple\s*pay|google\s*pay|모바일|간편결제/.test(text)) return 'mobile_pay';
  if (/현금|cash/.test(text)) return 'cash';
  if (/카드|card/.test(text)) return 'credit_card';
  return '';
}
