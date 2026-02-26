// 인증 프로바이더 — Firebase 인증 상태 감시 및 Zustand 동기화
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange, getUserDocument, checkUserExists } from '@/lib/firebase/auth';
import { User } from '@/types/user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUid = useAuthStore((state) => state.setFirebaseUid);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setNeedsOnboarding = useAuthStore((state) => state.setNeedsOnboarding);

  useEffect(() => {
    // Firebase 인증 상태 변경 리스너
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);

        // Firestore에서 사용자 문서 확인
        const exists = await checkUserExists(firebaseUser.uid);

        if (exists) {
          // 사용자 문서가 있으면 로드
          const { data } = await getUserDocument(firebaseUser.uid);
          if (data) {
            setUser(data as User);
            setNeedsOnboarding(false);
          }
        } else {
          // 사용자 문서가 없으면 온보딩 필요
          setNeedsOnboarding(true);
          setUser(null);
          setLoading(false);
        }
      } else {
        // 로그아웃 상태
        setUser(null);
        setFirebaseUid(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setFirebaseUid, setLoading, setNeedsOnboarding]);

  return <>{children}</>;
};
