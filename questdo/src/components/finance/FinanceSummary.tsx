// 가계부 요약 위젯 — 수입/지출/잔액 표시
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/hooks/useExchangeRate';
import { ExchangeRateConverter } from '@/components/finance/ExchangeRateConverter';
import {
  Task,
  CurrencyCode,
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHODS,
  CURRENCY_LABELS,
} from '@/types/task';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface FinanceSummaryProps {
  className?: string;
}

export const FinanceSummary = ({ className }: FinanceSummaryProps) => {
  const { language } = useTranslation();
  const lang = language as 'ko' | 'en';
  const tasks = useTaskStore((s) => s.tasks);

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('KRW');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [showConverter, setShowConverter] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 재정 카테고리 태스크만 필터
  const financeTasks = useMemo(() => {
    return tasks.filter((t) => t.category === 'finance' && t.financeData);
  }, [tasks]);

  // 선택 월 기준 필터
  const monthlyFinanceTasks = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    return financeTasks.filter((t) => {
      if (!t.createdAt) return false;
      try {
        const date = t.createdAt.toDate();
        return isWithinInterval(date, { start, end });
      } catch {
        return true; // fallback: include
      }
    });
  }, [financeTasks, selectedMonth]);

  // 수입/지출/잔액 계산 (선택 통화 기준)
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfer = 0;

    monthlyFinanceTasks.forEach((t) => {
      const fd = t.financeData!;
      const amount = fd.amount;

      // 같은 통화만 합산 (다른 통화는 무시 — 환율 변환기로 직접 확인)
      if (fd.currency !== selectedCurrency) return;

      switch (fd.transactionType) {
        case 'income':
          totalIncome += amount;
          break;
        case 'expense':
          totalExpense += amount;
          break;
        case 'transfer':
          totalTransfer += amount;
          break;
      }
    });

    return {
      income: totalIncome,
      expense: totalExpense,
      transfer: totalTransfer,
      balance: totalIncome - totalExpense,
    };
  }, [monthlyFinanceTasks, selectedCurrency]);

  // 최근 거래 목록
  const recentTransactions = useMemo(() => {
    return monthlyFinanceTasks
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [monthlyFinanceTasks]);

  // 월 선택 옵션 생성 (최근 6개월)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, lang === 'ko' ? 'yyyy년 M월' : 'MMM yyyy'),
      });
    }
    return options;
  }, [lang]);

  const paymentMethodLabel = (value?: string) => {
    if (!value) return '';
    const method = PAYMENT_METHODS.find((m) => m.value === value);
    return method ? method[lang] : value;
  };

  if (financeTasks.length === 0) {
    return (
      <div className={cn('apple-card p-5', className)}>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#AF52DE]/10">
            <Wallet className="h-6 w-6 text-[#AF52DE]" />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground">
            {lang === 'ko' ? '재정 기록이 없습니다' : 'No financial records'}
          </p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">
            {lang === 'ko'
              ? '할 일 추가 시 카테고리를 "재정"으로 선택하세요'
              : 'Select "Finance" category when adding tasks'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 헤더: 월/통화 선택 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="rounded-xl text-[12px] h-8 w-auto">
              <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCurrency}
            onValueChange={(v) => setSelectedCurrency(v as CurrencyCode)}
          >
            <SelectTrigger className="rounded-xl text-[12px] h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((c) => (
                <SelectItem key={c} value={c} className="text-[12px]">
                  {CURRENCY_LABELS[c].symbol} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-xl text-[11px] px-2.5"
          onClick={() => setShowConverter(!showConverter)}
        >
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          {lang === 'ko' ? '환율' : 'Rate'}
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {/* 수입 */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="apple-card p-3 text-center"
        >
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#34C759]/10 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#34C759]" />
          </div>
          <p className="text-[14px] font-bold text-[#34C759] truncate">
            {formatCurrency(summary.income, selectedCurrency)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lang === 'ko' ? '수입' : 'Income'}
          </p>
        </motion.div>

        {/* 지출 */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="apple-card p-3 text-center"
        >
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF3B30]/10 mb-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-[#FF3B30]" />
          </div>
          <p className="text-[14px] font-bold text-[#FF3B30] truncate">
            {formatCurrency(summary.expense, selectedCurrency)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lang === 'ko' ? '지출' : 'Expense'}
          </p>
        </motion.div>

        {/* 잔액 */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="apple-card p-3 text-center"
        >
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#007AFF]/10 mb-1.5">
            <Wallet className="h-3.5 w-3.5 text-[#007AFF]" />
          </div>
          <p className={cn(
            'text-[14px] font-bold truncate',
            summary.balance >= 0 ? 'text-[#007AFF]' : 'text-[#FF3B30]',
          )}>
            {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance, selectedCurrency)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lang === 'ko' ? '잔액' : 'Balance'}
          </p>
        </motion.div>
      </div>

      {/* 환율 변환기 */}
      <AnimatePresence>
        {showConverter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ExchangeRateConverter
              initialFrom={selectedCurrency}
              initialTo={selectedCurrency === 'KRW' ? 'USD' : 'KRW'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 최근 거래 목록 */}
      {recentTransactions.length > 0 && (
        <div className="apple-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="text-[13px] font-semibold">
              {lang === 'ko' ? '최근 거래' : 'Recent Transactions'}
            </span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[11px]">{recentTransactions.length}{lang === 'ko' ? '건' : ''}</span>
              {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/30">
                  {recentTransactions.map((t) => {
                    const fd = t.financeData!;
                    const color =
                      fd.transactionType === 'income'
                        ? '#34C759'
                        : fd.transactionType === 'expense'
                          ? '#FF3B30'
                          : '#007AFF';
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-border/10 last:border-0"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          {fd.transactionType === 'income' ? (
                            <TrendingUp className="h-3.5 w-3.5" style={{ color }} />
                          ) : fd.transactionType === 'expense' ? (
                            <TrendingDown className="h-3.5 w-3.5" style={{ color }} />
                          ) : (
                            <ArrowRightLeft className="h-3.5 w-3.5" style={{ color }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {fd.merchant && `${fd.merchant} · `}
                            {paymentMethodLabel(fd.paymentMethod)}
                            {t.createdAt && ` · ${format(t.createdAt.toDate(), 'M/d')}`}
                          </p>
                        </div>
                        <p
                          className="text-[13px] font-semibold shrink-0"
                          style={{ color }}
                        >
                          {fd.transactionType === 'income' ? '+' : fd.transactionType === 'expense' ? '-' : ''}
                          {formatCurrency(fd.amount, fd.currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
