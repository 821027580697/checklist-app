// 번역 딕셔너리 로딩 유틸리티
import koCommon from '../../../public/locales/ko/common.json';
import enCommon from '../../../public/locales/en/common.json';

// 지원 언어
export type Locale = 'ko' | 'en';

// 딕셔너리 타입 (ko를 기준)
export type Dictionary = typeof koCommon;

// 언어별 딕셔너리
const dictionaries: Record<Locale, Dictionary> = {
  ko: koCommon,
  en: enCommon,
};

// 딕셔너리 가져오기
export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] || dictionaries.ko;
};

// 번역 키에서 값을 가져오는 헬퍼 함수
export const t = (
  dictionary: Dictionary,
  key: string,
  params?: Record<string, string | number>,
): string => {
  // 점 표기법으로 중첩 객체 접근 (예: 'dashboard.title')
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = dictionary;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 키를 찾지 못하면 키 자체를 반환
    }
  }

  if (typeof value !== 'string') return key;

  // 파라미터 치환 (예: {count} → 실제 값)
  if (params) {
    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
      value,
    );
  }

  return value;
};
