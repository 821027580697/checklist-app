// 인증 프로바이더 — Firebase 인증 상태 감시 및 Zustand 동기화
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange, getUserDocument, checkUserExists } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { User } from '@/types/user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUid = useAuthStore((state) => state.setFirebaseUid);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setNeedsOnboarding = useAuthStore((state) => state.setNeedsOnboarding);

  // 동시에 여러 onAuthStateChanged 콜백이 처리되지 않도록 가드
  const processingRef = useRef(false);

  useEffect(() => {
    // Firebase가 설정되지 않은 경우 로딩만 해제
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Firebase 인증 상태 변경 리스너
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      // 이미 처리 중이면 무시 (중복 콜백 방지)
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        if (firebaseUser) {
          setFirebaseUid(firebaseUser.uid);

          // Firestore에서 사용자 문서 확인
          try {
            const exists = await checkUserExists(firebaseUser.uid);

            if (exists) {
              const { data, error } = await getUserDocument(firebaseUser.uid);
              if (data && !error) {
                setNeedsOnboarding(false);
                setUser(data as User);
              } else {
                setNeedsOnboarding(true);
                setUser(null);
                setLoading(false);
              }
            } else {
              setNeedsOnboarding(true);
              setUser(null);
              setLoading(false);
            }
          } catch {
            setNeedsOnboarding(true);
            setUser(null);
            setLoading(false);
          }
        } else {
          setUser(null);
          setFirebaseUid(null);
          setNeedsOnboarding(false);
          setLoading(false);
        }
      } finally {
        processingRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [setUser, setFirebaseUid, setLoading, setNeedsOnboarding]);

  return <>{children}</>;
};
