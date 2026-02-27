// 영수증 OCR 훅 — Tesseract.js 기반 영수증 인식 및 데이터 추출
// ✅ 고도화: Canvas 이미지 전처리 + 다중 패스 OCR + 강화된 파싱
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
  expenseCategory: string; // 자동 분류된 지출 카테고리
  rawText: string;        // 원본 OCR 텍스트
  confidence: number;     // 인식 신뢰도 (0~100)
  items: ReceiptItem[];   // 개별 항목들
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
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
      const Tesseract = await import('tesseract.js');
      setProgress(5);

      // 1단계: 이미지 전처리 (Canvas API)
      const processedImages = await preprocessImage(file);
      setProgress(15);

      // 2단계: 다중 패스 OCR — 원본 + 전처리 이미지로 최고 결과 선택
      let bestResult = { text: '', confidence: 0 };

      for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i];
        try {
          const ocrResult = await Tesseract.recognize(img, 'kor+eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const baseProgress = 15 + i * 25;
                setProgress(baseProgress + Math.round((m.progress || 0) * 25));
              }
            },
          });

          if (ocrResult.data.confidence > bestResult.confidence) {
            bestResult = {
              text: ocrResult.data.text,
              confidence: ocrResult.data.confidence,
            };
          }
        } catch {
          // 특정 이미지 실패 시 다음 이미지로 계속
          continue;
        }
      }

      // 3단계: 결과가 부족하면 영어 단독 패스 추가
      if (bestResult.confidence < 60) {
        try {
          const engResult = await Tesseract.recognize(processedImages[1] || processedImages[0], 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProgress(85 + Math.round((m.progress || 0) * 5));
              }
            },
          });
          // 영어 결과가 더 좋으면 병합
          if (engResult.data.confidence > bestResult.confidence) {
            bestResult = {
              text: engResult.data.text,
              confidence: engResult.data.confidence,
            };
          }
        } catch {
          // 무시
        }
      }

      setProgress(92);

      if (!bestResult.text.trim()) {
        throw new Error('텍스트를 인식할 수 없습니다. 더 선명한 이미지를 사용해 주세요.');
      }

      // 4단계: 고도화된 파싱
      const parsedData = parseReceipt(bestResult.text, bestResult.confidence);
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

  return { isProcessing, progress, result, error, processImage, reset };
};

// ======== 이미지 전처리 (Canvas API) ========

async function preprocessImage(file: File): Promise<string[]> {
  const img = await loadImage(file);
  const results: string[] = [];

  // 1) 원본 이미지 (리사이즈만)
  results.push(resizeImage(img, 2000));

  // 2) 고대비 그레이스케일 + 샤프닝
  results.push(enhancedGrayscale(img));

  // 3) 적응적 이진화 (가장 효과적)
  results.push(adaptiveBinarize(img));

  return results;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

// 이미지 리사이즈 (작은 이미지를 확대하여 OCR 정확도 향상)
function resizeImage(img: HTMLImageElement, maxDim: number): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let { width, height } = img;

  // 너무 작은 이미지는 2배 확대
  if (width < 800 || height < 800) {
    width *= 2;
    height *= 2;
  }

  // 너무 큰 이미지는 축소
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // 안티앨리어싱 비활성화 (텍스트 선명도)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/png');
}

// 고대비 그레이스케일 + 언샤프 마스크 (샤프닝)
function enhancedGrayscale(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let w = img.width;
  let h = img.height;

  // 작은 이미지 확대
  if (w < 1000) {
    const scale = Math.min(2, 1600 / w);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 가중 그레이스케일 (인간 시각 기반)
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // 대비 강화 (시그모이드 커브)
    const contrast = 1.8; // 대비 계수
    const factor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
    const enhanced = Math.max(0, Math.min(255, factor * (gray - 128) + 128));

    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);

  // 언샤프 마스크 (CSS filter 대체)
  const sharpCanvas = document.createElement('canvas');
  sharpCanvas.width = w;
  sharpCanvas.height = h;
  const sharpCtx = sharpCanvas.getContext('2d')!;
  sharpCtx.filter = 'contrast(1.3) brightness(1.05)';
  sharpCtx.drawImage(canvas, 0, 0);

  return sharpCanvas.toDataURL('image/png');
}

// 적응적 이진화 — 가장 효과적인 전처리
function adaptiveBinarize(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let w = img.width;
  let h = img.height;

  if (w < 1000) {
    const scale = Math.min(2, 1600 / w);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 1단계: 그레이스케일 변환
  const grayPixels = new Float32Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    grayPixels[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  // 2단계: 적응적 임계값 계산 (블록 기반)
  const blockSize = Math.max(15, Math.round(Math.min(w, h) / 40) | 1);
  const C = 10; // 임계값 오프셋

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pixelIdx = idx * 4;

      // 주변 블록 평균 계산
      let sum = 0;
      let count = 0;
      const halfBlock = Math.floor(blockSize / 2);

      for (let by = Math.max(0, y - halfBlock); by <= Math.min(h - 1, y + halfBlock); by++) {
        for (let bx = Math.max(0, x - halfBlock); bx <= Math.min(w - 1, x + halfBlock); bx++) {
          sum += grayPixels[by * w + bx];
          count++;
        }
      }

      const threshold = (sum / count) - C;
      const value = grayPixels[idx] > threshold ? 255 : 0;

      data[pixelIdx] = value;
      data[pixelIdx + 1] = value;
      data[pixelIdx + 2] = value;
      data[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ======== 고도화된 영수증 파싱 로직 ========

function parseReceipt(rawText: string, confidence: number): ReceiptData {
  // 텍스트 정제
  const cleanedText = cleanOCRText(rawText);
  const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);

  const merchant = extractMerchant(lines);
  const amount = extractAmount(lines, cleanedText);
  const items = extractItems(lines);

  const detectedTransactionType = detectTransactionType(cleanedText, merchant, amount);
  const detectedCategory = detectExpenseCategory(cleanedText, merchant, items);

  return {
    title: merchant || extractTitle(lines),
    amount,
    currency: detectCurrency(cleanedText),
    merchant,
    date: extractDate(cleanedText),
    transactionType: detectedTransactionType,
    paymentMethod: detectPaymentMethod(cleanedText),
    expenseCategory: detectedCategory,
    rawText: cleanedText,
    confidence,
    items,
  };
}

// OCR 텍스트 정제 — 노이즈 제거 및 일반적인 OCR 오류 수정
function cleanOCRText(text: string): string {
  return text
    // 일반적인 OCR 오류 수정
    .replace(/[|l]/g, (match, offset, str) => {
      // 숫자 주변의 l → 1
      const before = str[offset - 1];
      const after = str[offset + 1];
      if (before && /\d/.test(before)) return '1';
      if (after && /\d/.test(after)) return '1';
      return match;
    })
    .replace(/[oO](?=\d)/g, '0')  // 숫자 앞의 O → 0
    .replace(/(?<=\d)[oO]/g, '0') // 숫자 뒤의 O → 0
    .replace(/[Ss](?=\d{3})/g, '$')  // S123 → $123
    .replace(/\s{3,}/g, '  ')     // 과도한 공백 축소
    .replace(/\r\n/g, '\n')       // 줄바꿈 통일
    .trim();
}

// 가맹점명 추출 — 다중 전략
function extractMerchant(lines: string[]): string {
  // 전략 1: "가맹점", "상호" 등 키워드 뒤의 값
  for (const line of lines) {
    const merchantKeyword = line.match(
      /(?:가맹점(?:명)?|상호(?:명)?|사업자(?:명)?|merchant|store|shop)\s*[:：]?\s*(.+)/i,
    );
    if (merchantKeyword && merchantKeyword[1].trim().length >= 2) {
      return merchantKeyword[1].trim().substring(0, 50);
    }
  }

  // 전략 2: 영수증 상단의 가맹점명 (보통 첫 1~3줄에 위치)
  const skipPatterns = [
    /^\d+$/, /^[-=_*#·.]+$/, /^\s*$/, // 숫자, 구분선, 빈 줄
    /전화|tel|phone|fax|팩스/i,
    /주소|address|우편/i,
    /사업자\s*(?:번호|등록)/i,
    /대표|ceo|owner/i,
    /\d{2,3}[-.)]\d{3,4}[-.)]\d{4}/, // 전화번호
    /\d{3}-\d{2}-\d{5}/, // 사업자번호
    /\d{4}[./-]\d{1,2}[./-]\d{1,2}/, // 날짜
    /합계|총|total|소계|subtotal|부가|vat|tax|결제|승인|거래/i,
    /카드|card|현금|cash|거스름/i,
    /^no\./i, /^#/,
  ];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length < 2 || line.length > 50) continue;

    let skip = false;
    for (const pattern of skipPatterns) {
      if (pattern.test(line)) { skip = true; break; }
    }
    if (skip) continue;

    // 한글 또는 영문이 포함된 의미 있는 줄
    if (/[가-힣a-zA-Z]/.test(line)) {
      return line.substring(0, 50);
    }
  }

  return '';
}

// 제목 생성
function extractTitle(lines: string[]): string {
  const merchant = extractMerchant(lines);
  if (merchant) return merchant;
  for (const line of lines) {
    if (line.length >= 2 && !/^[-=_*#]+$/.test(line) && /[가-힣a-zA-Z]/.test(line)) {
      return line.substring(0, 50);
    }
  }
  return '';
}

// 금액 추출 — 다중 전략 + 우선순위 기반
function extractAmount(lines: string[], rawText: string): number {
  // 전략 1: "합계", "Total" 등 키워드 라인에서 금액 추출 (최우선)
  const totalKeywords = /(?:합\s*계|총\s*(?:금\s*액|액)|total|결\s*제\s*금\s*액|받\s*을\s*금\s*액|청\s*구\s*(?:금\s*액)?|카\s*드\s*(?:결\s*제|승\s*인)|grand\s*total|amount\s*due|net\s*amount|판\s*매\s*금\s*액)/i;

  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const amount = extractAmountFromLine(line);
      if (amount > 0) return amount;
    }
  }

  // 전략 2: "합계" 다음 줄에서 금액 추출
  for (let i = 0; i < lines.length - 1; i++) {
    if (totalKeywords.test(lines[i])) {
      const amount = extractAmountFromLine(lines[i + 1]);
      if (amount > 0) return amount;
    }
  }

  // 전략 3: 통화 기호 뒤의 가장 큰 금액
  const currencyAmounts: number[] = [];
  const currencyPattern = /[₩$€¥£]\s*([\d,]+(?:\.\d{1,2})?)/g;
  let match;
  while ((match = currencyPattern.exec(rawText)) !== null) {
    const amt = parseAmount(match[1]);
    if (amt > 0 && amt < 100000000) currencyAmounts.push(amt);
  }
  if (currencyAmounts.length > 0) return Math.max(...currencyAmounts);

  // 전략 4: "원" 키워드 앞의 금액
  const wonPattern = /([\d,]+)\s*원/g;
  const wonAmounts: number[] = [];
  while ((match = wonPattern.exec(rawText)) !== null) {
    const amt = parseAmount(match[1]);
    if (amt > 0 && amt < 100000000) wonAmounts.push(amt);
  }
  if (wonAmounts.length > 0) return Math.max(...wonAmounts);

  // 전략 5: 콤마 포맷 숫자 중 가장 큰 것
  const allAmounts: number[] = [];
  const formattedNumbers = rawText.match(/\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?/g);
  if (formattedNumbers) {
    for (const num of formattedNumbers) {
      const amt = parseAmount(num);
      if (amt > 0 && amt < 100000000) allAmounts.push(amt);
    }
  }

  // 전략 6: 4자리 이상 숫자 (연도, 전화번호 등 제외)
  const plainNumbers = rawText.match(/(?<!\d[-./])\b(\d{4,8})\b(?![-./]\d)/g);
  if (plainNumbers) {
    for (const num of plainNumbers) {
      const amt = parseInt(num, 10);
      if (amt >= 1900 && amt <= 2099) continue; // 연도
      if (amt > 100000000) continue; // 너무 큰 숫자
      if (/^\d{10,}$/.test(num)) continue; // 전화번호 등
      allAmounts.push(amt);
    }
  }

  if (allAmounts.length === 0) return 0;
  return Math.max(...allAmounts);
}

// 한 줄에서 금액 추출
function extractAmountFromLine(line: string): number {
  // 통화 기호 뒤의 숫자
  const withSymbol = line.match(/[₩$€¥£]\s*([\d,]+(?:\.\d{1,2})?)/);
  if (withSymbol) return parseAmount(withSymbol[1]);

  // 콤마 포맷 숫자
  const formatted = line.match(/(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?)/);
  if (formatted) return parseAmount(formatted[1]);

  // "원" 앞의 숫자
  const withWon = line.match(/([\d,]+)\s*원/);
  if (withWon) return parseAmount(withWon[1]);

  // 4자리 이상 숫자
  const plain = line.match(/(\d{4,})/);
  if (plain) {
    const amt = parseInt(plain[1], 10);
    if (amt >= 1900 && amt <= 2099) return 0;
    return amt;
  }

  return 0;
}

// 금액 문자열 → 숫자
function parseAmount(str: string): number {
  const cleaned = str.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 개별 항목 추출
function extractItems(lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  // 항목 패턴: 이름 + 수량 + 가격
  const itemPatterns = [
    // 이름 수량 가격 (한국 영수증)
    /^(.{2,20})\s+(\d+)\s+([\d,]+)$/,
    // 이름 가격 (간단한 형태)
    /^(.{2,30})\s+([\d,]{3,})$/,
  ];

  for (const line of lines) {
    // 총합/소계 줄은 스킵
    if (/합계|총|total|소계|subtotal|부가|vat|tax/i.test(line)) continue;
    if (/^[-=_*]+$/.test(line)) continue;

    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 4) {
          // 이름 + 수량 + 가격
          const price = parseAmount(match[3]);
          if (price > 0 && price < 10000000) {
            items.push({
              name: match[1].trim(),
              quantity: parseInt(match[2], 10) || 1,
              price,
            });
          }
        } else if (match.length === 3) {
          // 이름 + 가격
          const price = parseAmount(match[2]);
          if (price > 0 && price < 10000000) {
            items.push({
              name: match[1].trim(),
              quantity: 1,
              price,
            });
          }
        }
        break;
      }
    }
  }

  return items;
}

// 날짜 추출 — 다양한 형식 지원
function extractDate(rawText: string): string {
  const datePatterns = [
    // yyyy.MM.dd HH:mm:ss (한국 영수증)
    /(\d{4})[.\-/년](\d{1,2})[.\-/월](\d{1,2})(?:일)?/,
    // dd/MM/yyyy (유럽 형식)
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/,
    // MM-dd-yyyy (미국 형식)
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/,
    // 한국어 날짜
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      let year = parseInt(match[1], 10);
      let month = parseInt(match[2], 10);
      let day = parseInt(match[3], 10);

      // 첫 번째가 일이고 세 번째가 년도인 경우 (dd/MM/yyyy)
      if (year > 31 && year < 100) year += 2000;
      if (year <= 31 && day >= 1900) {
        [year, day] = [day, year];
      }
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

// 통화 감지 — 우선순위 기반
function detectCurrency(rawText: string): CurrencyCode {
  // 통화 기호 감지 (가장 정확)
  if (/₩/.test(rawText)) return 'KRW';
  if (/€/.test(rawText)) return 'EUR';
  if (/£/.test(rawText)) return 'GBP';
  if (/₫/.test(rawText)) return 'VND';
  if (/฿/.test(rawText)) return 'THB';

  // 통화 코드 감지
  if (/\bKRW\b/i.test(rawText)) return 'KRW';
  if (/\bUSD\b/i.test(rawText)) return 'USD';
  if (/\bEUR\b/i.test(rawText)) return 'EUR';
  if (/\bJPY\b/i.test(rawText)) return 'JPY';
  if (/\bGBP\b/i.test(rawText)) return 'GBP';
  if (/\bCNY\b|RMB/i.test(rawText)) return 'CNY';

  // 통화 명칭 감지
  if (/원(?:\s|$|,|\.)/.test(rawText)) return 'KRW';
  if (/dollar/i.test(rawText)) return 'USD';
  if (/euro/i.test(rawText)) return 'EUR';
  if (/円|yen/i.test(rawText)) return 'JPY';
  if (/元|yuan/i.test(rawText)) return 'CNY';

  // $ 기호는 여러 통화에서 사용 — 문맥으로 판단
  if (/\$/.test(rawText)) {
    if (/A\$|AUD/i.test(rawText)) return 'AUD';
    if (/C\$|CAD/i.test(rawText)) return 'CAD';
    if (/S\$|SGD/i.test(rawText)) return 'SGD';
    if (/HK\$|HKD/i.test(rawText)) return 'HKD';
    return 'USD';
  }

  // ¥는 JPY 또는 CNY — 문맥으로 판단
  if (/¥/.test(rawText)) {
    if (/[가-힣]/.test(rawText)) return 'JPY'; // 한국 영수증에 엔화
    if (/元|人民币|RMB/.test(rawText)) return 'CNY';
    return 'JPY';
  }

  // 한국어 텍스트가 있으면 KRW
  if (/[가-힣]/.test(rawText)) return 'KRW';
  return 'KRW';
}

// 수입/지출 자동 감지
function detectTransactionType(rawText: string, merchant: string, amount: number): TransactionType {
  const text = (rawText + ' ' + merchant).toLowerCase();

  // 수입 키워드
  const incomeKeywords = /급여|월급|salary|wage|보너스|bonus|이자|interest|배당|dividend|환급|refund|입금|deposit|수입|income|송금\s*받|received|정산금|용돈|상여/i;
  if (incomeKeywords.test(text)) return 'income';

  // 이체 키워드
  const transferKeywords = /이체|transfer|송금|remit|출금|withdraw/i;
  if (transferKeywords.test(text)) return 'transfer';

  // 기본적으로 영수증은 지출
  return 'expense';
}

// 지출 카테고리 자동 분류 — 가맹점명 + 항목 분석
function detectExpenseCategory(rawText: string, merchant: string, items: ReceiptItem[]): string {
  const text = (rawText + ' ' + merchant + ' ' + items.map(i => i.name).join(' ')).toLowerCase();

  // 식비 (food)
  const foodKeywords = /식당|레스토랑|restaurant|카페|cafe|coffee|커피|베이커리|bakery|빵|치킨|chicken|피자|pizza|버거|burger|맥도날드|mcdonald|스타벅스|starbucks|이디야|ediya|투썸|twosome|배달|delivery|떡볶이|김밥|편의점|convenience|cu\b|gs25|세븐일레븐|7-?eleven|이마트|emart|홈플러스|homeplus|롯데마트|음식|food|meal|lunch|dinner|breakfast|반찬|마트|mart|grocery|supermarket|고기|meat|생선|fish|야채|vegetable|과일|fruit|음료|drink|beverage|주류|alcohol|술|맥주|beer|소주|와인|wine|디저트|dessert|케이크|cake|아이스크림|ice\s*cream|라면|noodle|밥|rice|국|soup|찌개|요기요|배민|baemin|쿠팡이츠|coupang/i;
  if (foodKeywords.test(text)) return 'food';

  // 교통 (transport)
  const transportKeywords = /주유소|gas\s*station|fuel|휘발유|경유|diesel|택시|taxi|uber|카카오택시|버스|bus|지하철|subway|metro|기차|train|ktx|srt|항공|airline|비행기|flight|주차|parking|톨게이트|toll|하이패스|고속도로|highway|교통|transport|카카오모빌리티|네이버지도|tmap/i;
  if (transportKeywords.test(text)) return 'transport';

  // 쇼핑 (shopping)
  const shoppingKeywords = /쇼핑|shopping|의류|clothing|옷|fashion|패션|신발|shoes|가방|bag|백화점|department|올리브영|olive\s*young|다이소|daiso|아울렛|outlet|온라인\s*쇼핑|쿠팡|coupang|11번가|g마켓|gmarket|위메프|인터파크|네이버\s*쇼핑|amazon|아마존|무신사|musinsa|잡화|생활용품|가전|electronics/i;
  if (shoppingKeywords.test(text)) return 'shopping';

  // 주거/생활 (housing)
  const housingKeywords = /전기|electricity|수도|water|가스|gas\s*bill|관리비|maintenance|월세|rent|보증금|deposit|인테리어|interior|가구|furniture|이케아|ikea|세탁|laundry|청소|cleaning|아파트|apartment|부동산|real\s*estate/i;
  if (housingKeywords.test(text)) return 'housing';

  // 의료/건강 (medical)
  const medicalKeywords = /병원|hospital|clinic|약국|pharmacy|의원|medical|치과|dental|안과|eye|피부과|derma|한의원|한약|건강검진|health\s*check|약|medicine|drug|헬스|gym|fitness|필라테스|pilates|요가|yoga|pt|personal\s*training|건강|health|진료|treatment|수술|surgery|보험료|premium/i;
  if (medicalKeywords.test(text)) return 'medical';

  // 교육 (education)
  const educationKeywords = /학원|academy|학교|school|대학|university|교육|education|강의|lecture|수업|class|학비|tuition|교재|textbook|서점|bookstore|도서|book|인강|온라인\s*강의|udemy|coursera|인프런|노트|스터디|study|학습|learning/i;
  if (educationKeywords.test(text)) return 'education';

  // 여가/문화 (entertainment)
  const entertainmentKeywords = /영화|movie|cinema|cgv|megabox|롯데시네마|공연|concert|show|놀이공원|amusement|테마파크|theme\s*park|게임|game|넷플릭스|netflix|유튜브|youtube|디즈니|disney|음악|music|스포츠|sports|여행|travel|호텔|hotel|숙소|accommodation|airbnb|에어비앤비|리조트|resort|관광|tour|미술관|museum|갤러리|gallery|도서관|library/i;
  if (entertainmentKeywords.test(text)) return 'entertainment';

  // 통신 (communication)
  const communicationKeywords = /통신|telecom|핸드폰|phone|skt|sk텔레콤|kt|lg유플러스|lgu\+|알뜰폰|인터넷|internet|와이파이|wifi|데이터|data\s*plan|요금|bill|앱스토어|app\s*store|구글\s*플레이|google\s*play/i;
  if (communicationKeywords.test(text)) return 'communication';

  // 보험 (insurance)
  const insuranceKeywords = /보험|insurance|생명보험|life\s*insurance|자동차\s*보험|car\s*insurance|실손|건강보험|화재보험|삼성생명|한화생명|현대해상|db손보|보험료/i;
  if (insuranceKeywords.test(text)) return 'insurance';

  // 저축/투자 (savings)
  const savingsKeywords = /저축|savings|투자|invest|주식|stock|펀드|fund|적금|deposit|예금|은행|bank|증권|securities|코인|crypto|bitcoin|이자|interest\s*(?:income|earned)/i;
  if (savingsKeywords.test(text)) return 'savings';

  // 기타
  return 'other_expense';
}

// 결제 수단 감지 — 강화
function detectPaymentMethod(rawText: string): string {
  const text = rawText.toLowerCase();

  // 구체적인 카드사/결제 수단 (더 정확)
  if (/삼성\s*카드|samsung\s*card/.test(text)) return 'credit_card';
  if (/현대\s*카드|hyundai\s*card/.test(text)) return 'credit_card';
  if (/신한\s*카드|shinhan\s*card/.test(text)) return 'credit_card';
  if (/국민\s*카드|kb\s*card|kookmin/.test(text)) return 'credit_card';
  if (/롯데\s*카드|lotte\s*card/.test(text)) return 'credit_card';
  if (/하나\s*카드|hana\s*card/.test(text)) return 'credit_card';
  if (/우리\s*카드|woori\s*card/.test(text)) return 'credit_card';
  if (/bc\s*카드|bc\s*card/.test(text)) return 'credit_card';
  if (/visa|master(?:card)?|amex|american\s*express|jcb|unionpay/.test(text)) return 'credit_card';

  if (/신용\s*카드|credit\s*card/.test(text)) return 'credit_card';
  if (/체크\s*카드|debit\s*card/.test(text)) return 'debit_card';
  if (/계좌\s*이체|bank\s*transfer|입금|이체/.test(text)) return 'bank_transfer';
  if (/카카오페이|kakao\s*pay/.test(text)) return 'mobile_pay';
  if (/네이버페이|naver\s*pay/.test(text)) return 'mobile_pay';
  if (/삼성페이|samsung\s*pay/.test(text)) return 'mobile_pay';
  if (/apple\s*pay|애플페이/.test(text)) return 'mobile_pay';
  if (/google\s*pay|구글페이/.test(text)) return 'mobile_pay';
  if (/페이코|payco/.test(text)) return 'mobile_pay';
  if (/토스|toss/.test(text)) return 'mobile_pay';
  if (/간편\s*결제|mobile\s*pay|qr/i.test(text)) return 'mobile_pay';
  if (/현금|cash|거스름/.test(text)) return 'cash';
  if (/카드|card/.test(text)) return 'credit_card';
  return '';
}
