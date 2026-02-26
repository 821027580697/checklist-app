// 레벨별 필요 누적 XP 테이블 (점진적 증가)
// 레벨 인덱스 = 배열 인덱스 (0 = Lv.1)
export const XP_TABLE: number[] = [
  0,       // Lv.1 (시작)
  100,     // Lv.2
  250,     // Lv.3
  450,     // Lv.4
  700,     // Lv.5
  1000,    // Lv.6
  1400,    // Lv.7
  1900,    // Lv.8
  2500,    // Lv.9
  3200,    // Lv.10
  4000,    // Lv.11
  4900,    // Lv.12
  5900,    // Lv.13
  7000,    // Lv.14
  8200,    // Lv.15
  9500,    // Lv.16
  11000,   // Lv.17
  12700,   // Lv.18
  14600,   // Lv.19
  16700,   // Lv.20
  19000,   // Lv.21
  21500,   // Lv.22
  24200,   // Lv.23
  27100,   // Lv.24
  30200,   // Lv.25
  33500,   // Lv.26
  37000,   // Lv.27
  40700,   // Lv.28
  44600,   // Lv.29
  48700,   // Lv.30
  53000,   // Lv.31
  57500,   // Lv.32
  62200,   // Lv.33
  67100,   // Lv.34
  72200,   // Lv.35
  77500,   // Lv.36
  83000,   // Lv.37
  88700,   // Lv.38
  94600,   // Lv.39
  100700,  // Lv.40
  107000,  // Lv.41
  113500,  // Lv.42
  120200,  // Lv.43
  127100,  // Lv.44
  134200,  // Lv.45
  141500,  // Lv.46
  149000,  // Lv.47
  156700,  // Lv.48
  164600,  // Lv.49
  172700,  // Lv.50
];

// 최대 레벨
export const MAX_LEVEL = 50;

// 현재 레벨에서 다음 레벨까지 필요한 XP 계산
export const getXpForNextLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return 0;
  return XP_TABLE[level] - XP_TABLE[level - 1];
};

// 현재 레벨에서의 진행률 계산 (0~1)
export const getLevelProgress = (level: number, totalXp: number): number => {
  if (level >= MAX_LEVEL) return 1;
  const currentLevelXp = XP_TABLE[level - 1];
  const nextLevelXp = XP_TABLE[level];
  const progress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return Math.max(0, Math.min(1, progress));
};

// 총 XP로 레벨 계산
export const calculateLevel = (totalXp: number): number => {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (totalXp >= XP_TABLE[i]) {
      return i + 1;
    }
  }
  return 1;
};
