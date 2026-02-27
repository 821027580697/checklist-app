// XP 시스템 — 할 일/습관 완료 시 XP 계산 로직
import { Task } from '@/types/task';

// XP 보너스 규칙 상수
const XP_BASE_TASK = 10;          // 기본 할 일 완료 XP
const XP_BONUS_EARLY = 5;         // 마감일 전 완료 보너스
const XP_BONUS_URGENT = 5;        // 긴급 우선순위 완료 보너스
const XP_BONUS_SUBTASKS = 3;      // 서브태스크 모두 완료 보너스
const XP_BONUS_ALL_TODAY = 20;    // 오늘 할 일 전부 완료 보너스

const XP_BASE_HABIT = 5;          // 기본 습관 체크 XP
const XP_BONUS_STREAK_7 = 15;     // 7일 연속 달성 보너스
const XP_BONUS_STREAK_30 = 50;    // 30일 연속 달성 보너스
const XP_BONUS_STREAK_100 = 200;  // 100일 연속 달성 보너스

// 할 일 완료 시 XP 계산
export const calculateTaskXp = (task: Task): number => {
  let xp = XP_BASE_TASK;

  // 마감일 전 완료 보너스
  if (task.dueDate) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    if (now < dueDate) {
      xp += XP_BONUS_EARLY;
    }
  }

  // 긴급 우선순위 완료 보너스
  if (task.priority === 'urgent') {
    xp += XP_BONUS_URGENT;
  }

  // 서브태스크 모두 완료 보너스
  if (task.subtasks.length > 0) {
    const allSubtasksCompleted = task.subtasks.every((st) => st.isCompleted);
    if (allSubtasksCompleted) {
      xp += XP_BONUS_SUBTASKS;
    }
  }

  return xp;
};

// 오늘 모든 할 일 완료 보너스 체크
export const getAllTodayBonusXp = (): number => {
  return XP_BONUS_ALL_TODAY;
};

// 습관 체크 시 XP 계산
export const calculateHabitXp = (streak: number): number => {
  let xp = XP_BASE_HABIT;

  // 스트릭 마일스톤 보너스 (달성 시점에만)
  if (streak === 7) xp += XP_BONUS_STREAK_7;
  if (streak === 30) xp += XP_BONUS_STREAK_30;
  if (streak === 100) xp += XP_BONUS_STREAK_100;

  return xp;
};

// 배지 획득 시 XP
export const getBadgeXp = (xpReward: number): number => {
  return xpReward;
};

// XP 상수 내보내기 (UI에서 표시용)
export const XP_RULES = {
  taskBase: XP_BASE_TASK,
  earlyBonus: XP_BONUS_EARLY,
  urgentBonus: XP_BONUS_URGENT,
  subtasksBonus: XP_BONUS_SUBTASKS,
  allTodayBonus: XP_BONUS_ALL_TODAY,
  habitBase: XP_BASE_HABIT,
  streak7Bonus: XP_BONUS_STREAK_7,
  streak30Bonus: XP_BONUS_STREAK_30,
  streak100Bonus: XP_BONUS_STREAK_100,
};
