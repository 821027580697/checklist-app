// 영수증 스캐너 — 사진 촬영/업로드 + OCR 인식 + 결과 표시
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReceiptOCR, ReceiptData } from '@/hooks/useReceiptOCR';
import { useAuthStore } from '@/stores/authStore';
import { uploadReceiptImage } from '@/lib/firebase/storage';
import { formatCurrency } from '@/hooks/useExchangeRate';
import { TRANSACTION_TYPE_LABELS, PAYMENT_METHODS, CurrencyCode, TransactionType } from '@/types/task';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  ScanLine,
  AlertCircle,
  RotateCcw,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReceiptScannerProps {
  onResult: (data: ReceiptData & { receiptImageUrl?: string }) => void;
  onClose: () => void;
}

export const ReceiptScanner = ({ onResult, onClose }: ReceiptScannerProps) => {
  const { language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { isProcessing, progress, result, error, processImage, reset } = useReceiptOCR();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 파일 형식 검증
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!validTypes.includes(file.type)) {
        toast.error(
          lang === 'ko'
            ? '지원하지 않는 파일 형식입니다 (JPG, PNG, WebP 지원)'
            : 'Unsupported file format (JPG, PNG, WebP supported)',
        );
        return;
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          lang === 'ko' ? '파일 크기는 10MB 이하여야 합니다' : 'File must be under 10MB',
        );
        return;
      }

      setSelectedFile(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);

      // OCR 시작
      await processImage(file);
    },
    [processImage, lang],
  );

  // 결과 적용
  const handleApply = useCallback(async () => {
    if (!result) return;

    let receiptImageUrl: string | undefined;

    // Firebase에 영수증 이미지 업로드
    if (selectedFile && user) {
      setIsUploading(true);
      try {
        const { url, error: uploadError } = await uploadReceiptImage(user.uid, selectedFile);
        if (uploadError) throw uploadError;
        receiptImageUrl = url || undefined;
      } catch {
        // 업로드 실패해도 나머지 데이터는 적용
        console.error('영수증 이미지 업로드 실패');
      } finally {
        setIsUploading(false);
      }
    }

    onResult({ ...result, receiptImageUrl });
  }, [result, selectedFile, user, onResult]);

  // 재시도
  const handleRetry = useCallback(() => {
    reset();
    setPreviewUrl(null);
    setSelectedFile(null);
  }, [reset]);

  // 프로그레스 상태 텍스트
  const getProgressText = () => {
    if (progress < 20) return lang === 'ko' ? '이미지 준비 중...' : 'Preparing image...';
    if (progress < 90) return lang === 'ko' ? '텍스트 인식 중...' : 'Recognizing text...';
    if (progress < 100) return lang === 'ko' ? '데이터 분석 중...' : 'Analyzing data...';
    return lang === 'ko' ? '완료!' : 'Done!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-border/50 bg-background overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[#AF52DE]" />
          <span className="text-[13px] font-semibold">
            {lang === 'ko' ? '영수증 스캔' : 'Scan Receipt'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={onClose}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* 이미지 미리보기 / 업로드 영역 */}
        {!previewUrl ? (
          // 업로드 영역
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-dashed border-border/50 bg-secondary/20 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#AF52DE]/10">
                  <ScanLine className="h-7 w-7 text-[#AF52DE]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">
                    {lang === 'ko' ? '영수증 사진을 첨부하세요' : 'Attach a receipt photo'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'ko'
                      ? 'AI가 자동으로 금액, 가맹점, 날짜를 인식합니다'
                      : 'AI will automatically detect amount, merchant, and date'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* 카메라 촬영 */}
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 rounded-xl text-[12px]"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1.5 text-[#007AFF]" />
                {lang === 'ko' ? '카메라 촬영' : 'Take Photo'}
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* 파일 업로드 */}
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 rounded-xl text-[12px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1.5 text-[#34C759]" />
                {lang === 'ko' ? '사진 선택' : 'Choose Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        ) : (
          // 이미지 미리보기 + OCR 진행
          <div className="space-y-3">
            {/* 이미지 프리뷰 */}
            <div className="relative rounded-xl overflow-hidden bg-secondary/30 max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Receipt"
                className="w-full h-auto max-h-48 object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <ScanLine className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-[12px] font-medium">{getProgressText()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 프로그레스 바 */}
            {isProcessing && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-center">
                  {progress}% — {getProgressText()}
                </p>
              </div>
            )}

            {/* 에러 표시 */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-[12px]">{error}</p>
              </div>
            )}

            {/* OCR 결과 표시 */}
            <AnimatePresence>
              {result && !isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* 성공 배너 */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#34C759]/10">
                    <Sparkles className="h-4 w-4 text-[#34C759]" />
                    <span className="text-[12px] font-medium text-[#34C759]">
                      {lang === 'ko'
                        ? `인식 완료 (정확도 ${Math.round(result.confidence)}%)`
                        : `Recognized (${Math.round(result.confidence)}% accuracy)`}
                    </span>
                  </div>

                  {/* 인식된 데이터 */}
                  <div className="rounded-xl border border-border/30 divide-y divide-border/20">
                    {/* 가맹점 */}
                    {result.merchant && (
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-[11px] text-muted-foreground">
                          {lang === 'ko' ? '가맹점' : 'Merchant'}
                        </span>
                        <span className="text-[13px] font-medium">{result.merchant}</span>
                      </div>
                    )}

                    {/* 금액 */}
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-muted-foreground">
                        {lang === 'ko' ? '금액' : 'Amount'}
                      </span>
                      <span className="text-[15px] font-bold text-[#FF3B30]">
                        {result.amount > 0
                          ? formatCurrency(result.amount, result.currency)
                          : lang === 'ko' ? '인식 불가' : 'Not detected'}
                      </span>
                    </div>

                    {/* 날짜 */}
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-muted-foreground">
                        {lang === 'ko' ? '날짜' : 'Date'}
                      </span>
                      <span className="text-[13px] font-medium">{result.date}</span>
                    </div>

                    {/* 결제 수단 */}
                    {result.paymentMethod && (
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-[11px] text-muted-foreground">
                          {lang === 'ko' ? '결제 수단' : 'Payment'}
                        </span>
                        <span className="text-[13px] font-medium">
                          {PAYMENT_METHODS.find((m) => m.value === result.paymentMethod)?.[lang] ||
                            result.paymentMethod}
                        </span>
                      </div>
                    )}

                    {/* 통화 */}
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-muted-foreground">
                        {lang === 'ko' ? '통화' : 'Currency'}
                      </span>
                      <span className="text-[13px] font-medium">{result.currency}</span>
                    </div>
                  </div>

                  {/* 인식된 항목들 */}
                  {result.items && result.items.length > 0 && (
                    <details className="group" open>
                      <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                        <span>
                          {lang === 'ko'
                            ? `인식된 항목 (${result.items.length}건)`
                            : `Items (${result.items.length})`}
                        </span>
                      </summary>
                      <div className="mt-2 rounded-lg bg-secondary/20 divide-y divide-border/20 overflow-hidden">
                        {result.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                            <span className="flex-1 truncate">
                              {item.name}
                              {item.quantity > 1 && <span className="text-muted-foreground ml-1">×{item.quantity}</span>}
                            </span>
                            <span className="font-medium ml-2 shrink-0">
                              {formatCurrency(item.price, result.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* OCR 원본 텍스트 (접기/펼치기) */}
                  <details className="group">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                      <span>{lang === 'ko' ? '인식된 원본 텍스트 보기' : 'View raw OCR text'}</span>
                    </summary>
                    <pre className="mt-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                      {result.rawText}
                    </pre>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 하단 버튼 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-9 rounded-xl text-[12px]"
                onClick={handleRetry}
                disabled={isProcessing}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {lang === 'ko' ? '다시 촬영' : 'Retake'}
              </Button>
              {result && (
                <Button
                  type="button"
                  className="flex-1 h-9 rounded-xl text-[12px]"
                  onClick={handleApply}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {lang === 'ko' ? '저장 중...' : 'Saving...'}
                    </span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {lang === 'ko' ? '적용하기' : 'Apply'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
