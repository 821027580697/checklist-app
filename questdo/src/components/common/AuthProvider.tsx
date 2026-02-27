// 인증 프로바이더 — NextAuth 세션 감시 및 Zustand 동기화
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api/client';
import { User } from '@/types/user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setNeedsOnboarding = useAuthStore((state) => state.setNeedsOnboarding);
  const processingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    // authenticated — DB에서 유저 데이터 가져오기
    if (status === 'authenticated' && session?.user && !processingRef.current) {
      processingRef.current = true;

      userApi.me()
        .then((data) => {
          // 닉네임이 Google 기본값이면 온보딩 필요
          const nickname = (data as Record<string, unknown>).nickname as string;
          const googleName = session.user?.name;
          if (!nickname || nickname === googleName || nickname === (session.user?.email as string)?.split('@')[0]) {
            setNeedsOnboarding(true);
            setUser(null);
          } else {
            setNeedsOnboarding(false);
            setUser(data as unknown as User);
          }
        })
        .catch(() => {
          // 유저 문서가 없으면 온보딩 필요
          setNeedsOnboarding(true);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
          processingRef.current = false;
        });
    }
  }, [status, session, setUser, setLoading, setNeedsOnboarding]);

  return <>{children}</>;
};
