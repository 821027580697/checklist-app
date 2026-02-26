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
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        if (firebaseUser) {
          setFirebaseUid(firebaseUser.uid);

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
