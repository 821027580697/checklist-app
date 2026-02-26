// 스트릭 시스템 — 연속 달성 일수 계산
import { format, subDays, differenceInDays, parseISO, isToday, isYesterday } from 'date-fns';

// 오늘 날짜 문자열 (YYYY-MM-DD)
export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

// 스트릭 계산 (완료된 날짜 배열 기반)
export const calculateStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0;

  // 날짜를 내림차순 정렬
  const sortedDates = [...completedDates].sort().reverse();
  const latestDate = parseISO(sortedDates[0]);

  // 가장 최근 완료가 오늘이나 어제가 아니면 스트릭 끊김
  if (!isToday(latestDate) && !isYesterday(latestDate)) {
    return 0;
  }

  let streak = 1;
  let currentDate = latestDate;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i]);
    const daysDiff = differenceInDays(currentDate, prevDate);

    if (daysDiff === 1) {
      streak++;
      currentDate = prevDate;
    } else if (daysDiff === 0) {
      // 같은 날 중복 — 건너뛰기
      continue;
    } else {
      // 하루 이상 차이 → 스트릭 끊김
      break;
    }
  }

  return streak;
};

// 최장 스트릭 계산
export const calculateLongestStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0;

  const sortedDates = [...new Set(completedDates)].sort(); // 중복 제거 후 오름차순
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = differenceInDays(
      parseISO(sortedDates[i]),
      parseISO(sortedDates[i - 1]),
    );

    if (daysDiff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (daysDiff > 1) {
      current = 1;
    }
  }

  return Math.max(longest, current);
};

// 최근 N일의 날짜 목록 생성 (스트릭 캘린더용)
export const getRecentDays = (days: number): string[] => {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return result;
};

// 날짜가 오늘인지 확인
export const isTodayCheck = (dateStr: string): boolean => {
  return isToday(parseISO(dateStr));
};
