// 다국어 번역 훅
'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { getDictionary, t as translate, Dictionary } from '@/lib/i18n/dictionaries';

export const useTranslation = () => {
  const language = useUIStore((state) => state.language);
  const dictionary: Dictionary = getDictionary(language);

  // 번역 함수
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(dictionary, key, params);
    },
    [dictionary],
  );

  return { t, language, dictionary };
};
