// 칭호 시스템 — 레벨별 칭호 정의
export const TITLES: Record<string, Record<number, string>> = {
  ko: {
    1: '초보 모험가',
    5: '성실한 실행자',
    10: '할 일 전사',
    15: '습관의 달인',
    20: '생산성 마법사',
    25: '퀘스트 마스터',
    30: '시간의 지배자',
    35: '불굴의 챔피언',
    40: '전설의 영웅',
    45: '궁극의 도전자',
    50: '완료의 신',
  },
  en: {
    1: 'Novice Adventurer',
    5: 'Diligent Doer',
    10: 'Task Warrior',
    15: 'Habit Expert',
    20: 'Productivity Wizard',
    25: 'Quest Master',
    30: 'Time Lord',
    35: 'Indomitable Champion',
    40: 'Legendary Hero',
    45: 'Ultimate Challenger',
    50: 'God of Completion',
  },
};

// 주어진 레벨에 해당하는 칭호 반환
export const getTitleForLevel = (level: number, language: 'ko' | 'en' = 'ko'): string => {
  const titles = TITLES[language];
  const levels = Object.keys(titles)
    .map(Number)
    .sort((a, b) => b - a);

  for (const lvl of levels) {
    if (level >= lvl) {
      return titles[lvl];
    }
  }
  return titles[1];
};
