// 할 일(Task) 관련 타입 정의
import { Timestamp } from 'firebase/firestore';

// 할 일 카테고리
export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'study'
  | 'creative'
  | 'finance'
  | 'social'
  | 'other';

// 우선순위
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

// 상태
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

// 반복 주기
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

// 리마인더 타입
export type ReminderType = 'at_time' | '10min' | '30min' | '1hour' | '1day';

// 서브태스크 인터페이스
export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

// 반복 패턴 설정
export interface RecurringPattern {
  frequency: RecurringFrequency;
  daysOfWeek: number[];     // 0(일) ~ 6(토)
  endDate: Timestamp | null;
}

// 리마인더 설정
export interface TaskReminder {
  enabled: boolean;
  type: ReminderType;
}

// 재정/가계부 거래 유형
export type TransactionType = 'income' | 'expense' | 'transfer';

// 통화 코드
export type CurrencyCode =
  | 'KRW'
  | 'USD'
  | 'EUR'
  | 'JPY'
  | 'GBP'
  | 'CNY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'HKD'
  | 'SGD'
  | 'THB'
  | 'VND';

// 재정 데이터 인터페이스
export interface FinanceData {
  transactionType: TransactionType;      // 수입/지출/이체
  amount: number;                         // 금액
  currency: CurrencyCode;                // 통화
  convertedAmount?: number;               // 환산 금액 (기준 통화)
  convertedCurrency?: CurrencyCode;       // 환산 통화
  exchangeRate?: number;                  // 적용 환율
  paymentMethod?: string;                 // 결제 수단
  merchant?: string;                      // 가맹점/상호
}

// 통화 라벨 (다국어)
export const CURRENCY_LABELS: Record<CurrencyCode, { ko: string; en: string; symbol: string }> = {
  KRW: { ko: '원 (KRW)', en: 'Won (KRW)', symbol: '₩' },
  USD: { ko: '달러 (USD)', en: 'Dollar (USD)', symbol: '$' },
  EUR: { ko: '유로 (EUR)', en: 'Euro (EUR)', symbol: '€' },
  JPY: { ko: '엔 (JPY)', en: 'Yen (JPY)', symbol: '¥' },
  GBP: { ko: '파운드 (GBP)', en: 'Pound (GBP)', symbol: '£' },
  CNY: { ko: '위안 (CNY)', en: 'Yuan (CNY)', symbol: '¥' },
  AUD: { ko: '호주 달러 (AUD)', en: 'AUD', symbol: 'A$' },
  CAD: { ko: '캐나다 달러 (CAD)', en: 'CAD', symbol: 'C$' },
  CHF: { ko: '스위스 프랑 (CHF)', en: 'CHF', symbol: 'CHF' },
  HKD: { ko: '홍콩 달러 (HKD)', en: 'HKD', symbol: 'HK$' },
  SGD: { ko: '싱가포르 달러 (SGD)', en: 'SGD', symbol: 'S$' },
  THB: { ko: '태국 바트 (THB)', en: 'THB', symbol: '฿' },
  VND: { ko: '베트남 동 (VND)', en: 'VND', symbol: '₫' },
};

// 거래 유형 라벨 (다국어)
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, { ko: string; en: string }> = {
  income: { ko: '수입', en: 'Income' },
  expense: { ko: '지출', en: 'Expense' },
  transfer: { ko: '이체', en: 'Transfer' },
};

// 결제 수단 목록
export const PAYMENT_METHODS = [
  { value: 'cash', ko: '현금', en: 'Cash' },
  { value: 'credit_card', ko: '신용카드', en: 'Credit Card' },
  { value: 'debit_card', ko: '체크카드', en: 'Debit Card' },
  { value: 'bank_transfer', ko: '계좌이체', en: 'Bank Transfer' },
  { value: 'mobile_pay', ko: '모바일 결제', en: 'Mobile Pay' },
  { value: 'other', ko: '기타', en: 'Other' },
];

// 할 일 메인 인터페이스
export interface Task {
  id: string;
  userId: string;
  title: string;                // 할 일 제목 (최대 100자)
  description: string;          // 상세 설명 (최대 500자)
  category: TaskCategory;       // 카테고리
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Timestamp | null;    // 마감일
  dueTime: string | null;       // 마감 시간 (HH:mm)
  reminder: TaskReminder;
  isRecurring: boolean;
  recurringPattern: RecurringPattern | null;
  subtasks: Subtask[];
  financeData?: FinanceData;       // 재정/가계부 데이터 (카테고리가 finance일 때)
  xpEarned: number;             // 완료 시 획득한 XP
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 카테고리별 색상 매핑
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: '#007AFF',
  personal: '#5856D6',
  health: '#34C759',
  study: '#FF9500',
  creative: '#FF2D55',
  finance: '#AF52DE',
  social: '#00C7BE',
  other: '#8E8E93',
};

// 카테고리 라벨 (다국어)
export const CATEGORY_LABELS: Record<TaskCategory, { ko: string; en: string }> = {
  work: { ko: '업무', en: 'Work' },
  personal: { ko: '개인', en: 'Personal' },
  health: { ko: '건강', en: 'Health' },
  study: { ko: '학습', en: 'Study' },
  creative: { ko: '창작', en: 'Creative' },
  finance: { ko: '재정', en: 'Finance' },
  social: { ko: '소셜', en: 'Social' },
  other: { ko: '기타', en: 'Other' },
};

// 우선순위 색상 매핑
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#FF3B30',
  high: '#FF9500',
  medium: '#007AFF',
  low: '#8E8E93',
};

// 우선순위 라벨 (다국어)
export const PRIORITY_LABELS: Record<TaskPriority, { ko: string; en: string }> = {
  urgent: { ko: '긴급', en: 'Urgent' },
  high: { ko: '높음', en: 'High' },
  medium: { ko: '보통', en: 'Medium' },
  low: { ko: '낮음', en: 'Low' },
};
