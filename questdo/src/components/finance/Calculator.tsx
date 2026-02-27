// 계산기 컴포넌트 — Apple 스타일 인라인 계산기
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calculator as CalcIcon, Check, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CalculatorProps {
  onResult: (value: number) => void;
  onClose: () => void;
  initialValue?: number;
}

type CalcOperator = '+' | '-' | '×' | '÷' | null;

export const Calculator = ({ onResult, onClose, initialValue }: CalculatorProps) => {
  const { language } = useTranslation();
  const lang = language as 'ko' | 'en';

  const [display, setDisplay] = useState(initialValue?.toString() || '0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
  }, []);

  const calculate = useCallback((left: number, right: number, op: CalcOperator): number => {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '×': return left * right;
      case '÷': return right !== 0 ? left / right : 0;
      default: return right;
    }
  }, []);

  const performOperation = useCallback((nextOperator: CalcOperator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(`${inputValue} ${nextOperator} `);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setPreviousValue(result);
      setDisplay(String(result));
      setExpression(`${result} ${nextOperator} `);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  }, [display, previousValue, operator, calculate]);

  const handleEquals = useCallback(() => {
    if (operator === null || previousValue === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operator);
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setExpression('');
  }, [display, previousValue, operator, calculate]);

  const handlePercent = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  }, [display]);

  const handleConfirm = useCallback(() => {
    const value = parseFloat(display);
    if (!isNaN(value)) {
      onResult(Math.abs(value));
    }
    onClose();
  }, [display, onResult, onClose]);

  const buttons: { label: string; action: () => void; type: 'number' | 'operator' | 'function' | 'equals' }[][] = [
    [
      { label: 'C', action: clearAll, type: 'function' },
      { label: '±', action: toggleSign, type: 'function' },
      { label: '%', action: handlePercent, type: 'function' },
      { label: '÷', action: () => performOperation('÷'), type: 'operator' },
    ],
    [
      { label: '7', action: () => inputDigit('7'), type: 'number' },
      { label: '8', action: () => inputDigit('8'), type: 'number' },
      { label: '9', action: () => inputDigit('9'), type: 'number' },
      { label: '×', action: () => performOperation('×'), type: 'operator' },
    ],
    [
      { label: '4', action: () => inputDigit('4'), type: 'number' },
      { label: '5', action: () => inputDigit('5'), type: 'number' },
      { label: '6', action: () => inputDigit('6'), type: 'number' },
      { label: '-', action: () => performOperation('-'), type: 'operator' },
    ],
    [
      { label: '1', action: () => inputDigit('1'), type: 'number' },
      { label: '2', action: () => inputDigit('2'), type: 'number' },
      { label: '3', action: () => inputDigit('3'), type: 'number' },
      { label: '+', action: () => performOperation('+'), type: 'operator' },
    ],
    [
      { label: '0', action: () => inputDigit('0'), type: 'number' },
      { label: '.', action: inputDot, type: 'number' },
      { label: '=', action: handleEquals, type: 'equals' },
    ],
  ];

  // 디스플레이 값 포맷
  const displayValue = (() => {
    const num = parseFloat(display);
    if (isNaN(num)) return '0';
    if (display.endsWith('.')) return display;
    if (display.includes('.') && display.endsWith('0')) return display;
    return num.toLocaleString(undefined, { maximumFractionDigits: 10 });
  })();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      className="rounded-2xl bg-background border border-border/50 shadow-xl overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <CalcIcon className="h-4 w-4 text-[#FF9500]" />
          <span className="text-[13px] font-semibold">
            {lang === 'ko' ? '계산기' : 'Calculator'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={handleConfirm}
            type="button"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 디스플레이 */}
      <div className="px-4 py-3 text-right bg-secondary/30">
        {expression && (
          <p className="text-[11px] text-muted-foreground mb-0.5 truncate">{expression}</p>
        )}
        <p className="text-[28px] font-light tracking-tight truncate">{displayValue}</p>
      </div>

      {/* 버튼 그리드 */}
      <div className="p-2 space-y-1.5">
        {buttons.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-1.5">
            {row.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className={cn(
                  'h-11 rounded-xl text-[16px] font-medium transition-all active:scale-95',
                  btn.type === 'number' && 'bg-secondary/60 hover:bg-secondary text-foreground',
                  btn.type === 'function' && 'bg-secondary/40 hover:bg-secondary/80 text-muted-foreground',
                  btn.type === 'operator' && 'bg-[#FF9500]/10 hover:bg-[#FF9500]/20 text-[#FF9500] font-semibold',
                  btn.type === 'equals' && 'bg-[#FF9500] hover:bg-[#FF9500]/90 text-white font-semibold',
                  btn.label === '0' && 'col-span-2',
                  operator && (
                    (operator === '+' && btn.label === '+') ||
                    (operator === '-' && btn.label === '-') ||
                    (operator === '×' && btn.label === '×') ||
                    (operator === '÷' && btn.label === '÷')
                  ) && !waitingForOperand && 'ring-2 ring-[#FF9500]/50',
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
