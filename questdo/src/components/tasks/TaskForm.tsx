// 할 일 생성/편집 폼 (모달) — 재정 카테고리 선택 시 가계부 기능 포함
'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  TaskCategory,
  TaskPriority,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TransactionType,
  CurrencyCode,
  ExpenseCategory,
  FinanceData,
  CURRENCY_LABELS,
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHODS,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/task';
import { CATEGORY_ICONS } from '@/constants/categories';
import { formatCurrency } from '@/hooks/useExchangeRate';
import { Calculator } from '@/components/finance/Calculator';
import { ExchangeRateConverter } from '@/components/finance/ExchangeRateConverter';
import { ReceiptScanner } from '@/components/finance/ReceiptScanner';
import { ReceiptData } from '@/hooks/useReceiptOCR';
import {
  Plus,
  X,
  Calculator as CalcIcon,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Wallet,
  Store,
  CreditCard,
  Receipt,
  Tag,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  isRecurring: boolean;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
  financeData?: FinanceData;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  isEdit?: boolean;
}

export const TaskForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: TaskFormProps) => {
  const { t, language } = useTranslation();
  const lang = language as 'ko' | 'en';

  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'personal',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate || '',
    dueTime: initialData?.dueTime || '',
    isRecurring: initialData?.isRecurring || false,
    subtasks: initialData?.subtasks || [],
    financeData: initialData?.financeData || undefined,
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showExchangeRate, setShowExchangeRate] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  // initialData 변경 시 폼 리셋
  useEffect(() => {
    if (open) {
      setFormData({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'personal',
        priority: initialData?.priority || 'medium',
        dueDate: initialData?.dueDate || '',
        dueTime: initialData?.dueTime || '',
        isRecurring: initialData?.isRecurring || false,
        subtasks: initialData?.subtasks || [],
        financeData: initialData?.financeData || undefined,
      });
      setShowCalculator(false);
      setShowExchangeRate(false);
      setShowReceiptScanner(false);
    }
  }, [open, initialData]);

  // 카테고리가 finance로 변경되면 기본 financeData 생성
  useEffect(() => {
    if (formData.category === 'finance' && !formData.financeData) {
      setFormData((prev) => ({
        ...prev,
        financeData: {
          transactionType: 'expense',
          amount: 0,
          currency: 'KRW',
        },
      }));
    }
    if (formData.category !== 'finance') {
      setFormData((prev) => ({
        ...prev,
        financeData: undefined,
      }));
      setShowCalculator(false);
      setShowExchangeRate(false);
      setShowReceiptScanner(false);
    }
  }, [formData.category]); // eslint-disable-line react-hooks/exhaustive-deps

  // 서브태스크 추가
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: Date.now().toString(), title: newSubtask.trim(), isCompleted: false },
      ],
    }));
    setNewSubtask('');
  };

  // 서브태스크 삭제
  const removeSubtask = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }));
  };

  // 재정 데이터 업데이트 헬퍼
  const updateFinanceData = (updates: Partial<FinanceData>) => {
    setFormData((prev) => ({
      ...prev,
      financeData: prev.financeData ? { ...prev.financeData, ...updates } : undefined,
    }));
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onClose();
  };

  const isFinanceCategory = formData.category === 'finance';

  const transactionTypeIcons: Record<TransactionType, React.ReactNode> = {
    income: <TrendingUp className="h-4 w-4" />,
    expense: <TrendingDown className="h-4 w-4" />,
    transfer: <ArrowLeftRight className="h-4 w-4" />,
  };

  const transactionTypeColors: Record<TransactionType, string> = {
    income: '#34C759',
    expense: '#FF3B30',
    transfer: '#007AFF',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('tasks.edit') : t('tasks.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('tasks.titleLabel')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={
                isFinanceCategory
                  ? lang === 'ko' ? '지출/수입 내역을 입력하세요' : 'Enter transaction description'
                  : t('tasks.titlePlaceholder')
              }
              maxLength={100}
              className="rounded-xl"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('tasks.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('tasks.descriptionPlaceholder')}
              maxLength={500}
              className="rounded-xl min-h-[80px] resize-none"
            />
          </div>

          {/* 카테고리 & 우선순위 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.categoryLabel')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value as TaskCategory }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat][lang]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.priorityLabel')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value as TaskPriority }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p][lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ======== 재정/가계부 섹션 ======== */}
          <AnimatePresence>
            {isFinanceCategory && formData.financeData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-4 overflow-hidden"
              >
                {/* 재정 섹션 헤더 */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#AF52DE]" />
                    <span className="text-[13px] font-semibold text-[#AF52DE]">
                      {lang === 'ko' ? '가계부 정보' : 'Finance Details'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-lg text-[11px] px-2.5 border-[#AF52DE]/30 text-[#AF52DE] hover:bg-[#AF52DE]/5"
                    onClick={() => setShowReceiptScanner(!showReceiptScanner)}
                  >
                    <Receipt className="h-3 w-3 mr-1" />
                    {lang === 'ko' ? '영수증 스캔' : 'Scan Receipt'}
                  </Button>
                </div>

                {/* 영수증 스캐너 */}
                <AnimatePresence>
                  {showReceiptScanner && (
                    <ReceiptScanner
                      onResult={(data) => {
                        // OCR 결과를 폼에 반영
                        if (data.title && !formData.title) {
                          setFormData((prev) => ({ ...prev, title: data.title }));
                        }
                        const financeUpdates: Partial<FinanceData> = {};
                        if (data.merchant) financeUpdates.merchant = data.merchant;
                        if (data.amount > 0) financeUpdates.amount = data.amount;
                        if (data.currency) financeUpdates.currency = data.currency;
                        if (data.transactionType) financeUpdates.transactionType = data.transactionType;
                        if (data.paymentMethod) financeUpdates.paymentMethod = data.paymentMethod;
                        if (data.receiptImageUrl) financeUpdates.receiptImageUrl = data.receiptImageUrl;
                        // OCR에서 자동 분류된 지출 카테고리 적용
                        if (data.expenseCategory) {
                          financeUpdates.expenseCategory = data.expenseCategory as ExpenseCategory;
                        }
                        updateFinanceData(financeUpdates);
                        if (data.date) {
                          setFormData((prev) => ({ ...prev, dueDate: data.date }));
                        }
                        // 메모에 인식된 항목 자동 추가
                        if (data.items && data.items.length > 0) {
                          const itemsText = data.items.map(item =>
                            `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`
                          ).join(', ');
                          updateFinanceData({ memo: itemsText });
                        }
                        setShowReceiptScanner(false);
                      }}
                      onClose={() => setShowReceiptScanner(false)}
                    />
                  )}
                </AnimatePresence>

                {/* 거래 유형 선택 — 세그먼트 컨트롤 */}
                <div className="space-y-2">
                  <Label className="text-[12px]">
                    {lang === 'ko' ? '거래 유형' : 'Transaction Type'}
                  </Label>
                  <div className="flex rounded-xl bg-secondary/60 p-1 gap-1">
                    {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateFinanceData({ transactionType: type })}
                        className={cn(
                          'relative flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-all duration-200',
                          formData.financeData?.transactionType === type
                            ? 'text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground/70',
                        )}
                        style={{
                          backgroundColor:
                            formData.financeData?.transactionType === type
                              ? transactionTypeColors[type]
                              : 'transparent',
                        }}
                      >
                        {transactionTypeIcons[type]}
                        {TRANSACTION_TYPE_LABELS[type][lang]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 금액 & 통화 */}
                <div className="space-y-2">
                  <Label className="text-[12px]">
                    {lang === 'ko' ? '금액' : 'Amount'}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={formData.financeData.amount || ''}
                        onChange={(e) =>
                          updateFinanceData({ amount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="rounded-xl pr-10 text-[16px] font-medium"
                        min="0"
                        step="any"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg"
                        onClick={() => setShowCalculator(!showCalculator)}
                        title={lang === 'ko' ? '계산기' : 'Calculator'}
                      >
                        <CalcIcon className="h-3.5 w-3.5 text-[#FF9500]" />
                      </Button>
                    </div>
                    <Select
                      value={formData.financeData.currency}
                      onValueChange={(v) => updateFinanceData({ currency: v as CurrencyCode })}
                    >
                      <SelectTrigger className="rounded-xl w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_LABELS) as CurrencyCode[]).map((c) => (
                          <SelectItem key={c} value={c}>
                            {CURRENCY_LABELS[c].symbol} {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 금액 미리보기 */}
                  {formData.financeData.amount > 0 && (
                    <p
                      className="text-[13px] font-medium px-1"
                      style={{ color: transactionTypeColors[formData.financeData.transactionType] }}
                    >
                      {formData.financeData.transactionType === 'income' ? '+' : formData.financeData.transactionType === 'expense' ? '-' : ''}
                      {formatCurrency(formData.financeData.amount, formData.financeData.currency)}
                    </p>
                  )}
                </div>

                {/* 계산기 (토글) */}
                <AnimatePresence>
                  {showCalculator && (
                    <Calculator
                      initialValue={formData.financeData.amount}
                      onResult={(value) => updateFinanceData({ amount: value })}
                      onClose={() => setShowCalculator(false)}
                    />
                  )}
                </AnimatePresence>

                {/* 결제 수단 & 가맹점 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[12px] flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      {lang === 'ko' ? '결제 수단' : 'Payment'}
                    </Label>
                    <Select
                      value={formData.financeData.paymentMethod || ''}
                      onValueChange={(v) => updateFinanceData({ paymentMethod: v })}
                    >
                      <SelectTrigger className="rounded-xl text-[12px]">
                        <SelectValue placeholder={lang === 'ko' ? '선택' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m[lang]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[12px] flex items-center gap-1.5">
                      <Store className="h-3 w-3 text-muted-foreground" />
                      {lang === 'ko' ? '가맹점/메모' : 'Merchant'}
                    </Label>
                    <Input
                      value={formData.financeData.merchant || ''}
                      onChange={(e) => updateFinanceData({ merchant: e.target.value })}
                      placeholder={lang === 'ko' ? '가맹점명' : 'Name'}
                      className="rounded-xl text-[12px]"
                      maxLength={50}
                    />
                  </div>
                </div>

                {/* 지출 카테고리 */}
                <div className="space-y-2">
                  <Label className="text-[12px] flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {lang === 'ko' ? '지출 카테고리' : 'Expense Category'}
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[])
                      .filter((cat) => {
                        // 수입일 때는 급여/저축만, 지출일 때는 급여 제외
                        if (formData.financeData?.transactionType === 'income') {
                          return cat === 'salary' || cat === 'savings' || cat === 'other_expense';
                        }
                        return cat !== 'salary';
                      })
                      .map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updateFinanceData({ expenseCategory: cat })}
                          className={cn(
                            'flex flex-col items-center gap-0.5 rounded-lg py-2 px-1 text-[10px] transition-all duration-150 border',
                            formData.financeData?.expenseCategory === cat
                              ? 'border-[#AF52DE] bg-[#AF52DE]/10 text-[#AF52DE] font-medium'
                              : 'border-transparent bg-secondary/40 text-muted-foreground hover:bg-secondary/70',
                          )}
                        >
                          <span className="text-[14px]">{EXPENSE_CATEGORY_LABELS[cat].emoji}</span>
                          <span className="truncate w-full text-center">{EXPENSE_CATEGORY_LABELS[cat][lang]}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* 메모 */}
                <div className="space-y-2">
                  <Label className="text-[12px] flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    {lang === 'ko' ? '메모' : 'Memo'}
                  </Label>
                  <Input
                    value={formData.financeData.memo || ''}
                    onChange={(e) => updateFinanceData({ memo: e.target.value })}
                    placeholder={lang === 'ko' ? '추가 메모 (선택)' : 'Additional note (optional)'}
                    className="rounded-xl text-[12px]"
                    maxLength={100}
                  />
                </div>

                {/* 영수증 이미지 미리보기 */}
                {formData.financeData.receiptImageUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-[12px] flex items-center gap-1.5">
                      <Receipt className="h-3 w-3 text-muted-foreground" />
                      {lang === 'ko' ? '첨부된 영수증' : 'Attached Receipt'}
                    </Label>
                    <div className="relative rounded-xl overflow-hidden bg-secondary/30 border border-border/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.financeData.receiptImageUrl}
                        alt="Receipt"
                        className="w-full h-auto max-h-32 object-contain"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/40 text-white hover:bg-black/60"
                        onClick={() => updateFinanceData({ receiptImageUrl: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 환율 변환 토글 버튼 */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl text-[12px] h-9 border-dashed"
                  onClick={() => setShowExchangeRate(!showExchangeRate)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-[#007AFF]" />
                  {showExchangeRate
                    ? lang === 'ko' ? '환율 변환기 닫기' : 'Close Exchange Rate'
                    : lang === 'ko' ? '환율 변환기 열기' : 'Open Exchange Rate'}
                </Button>

                {/* 환율 변환기 (토글) */}
                <AnimatePresence>
                  {showExchangeRate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ExchangeRateConverter
                        initialAmount={formData.financeData.amount}
                        initialFrom={formData.financeData.currency}
                        initialTo={formData.financeData.currency === 'KRW' ? 'USD' : 'KRW'}
                        onConvert={(result) => {
                          updateFinanceData({
                            convertedAmount: result.convertedAmount,
                            convertedCurrency: result.to,
                            exchangeRate: result.rate,
                          });
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 마감일 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('tasks.dueDateLabel')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">{t('tasks.dueTimeLabel')}</Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueTime: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 반복 설정 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring">{t('tasks.recurringLabel')}</Label>
            <Switch
              id="recurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isRecurring: checked }))
              }
            />
          </div>

          {/* 서브태스크 */}
          <div className="space-y-3">
            <Label>{t('tasks.subtasksLabel')}</Label>

            {/* 서브태스크 목록 */}
            {formData.subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <span className="flex-1 text-sm">{st.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeSubtask(st.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* 서브태스크 추가 입력 */}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder={t('tasks.addSubtask')}
                className="rounded-xl"
                onKeyDown={(e) => {
                  // 한글 IME 조합 중이면 무시 (마지막 글자 중복 방지)
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addSubtask}
                className="rounded-xl shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 rounded-xl">
              {isEdit ? t('common.save') : t('tasks.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
