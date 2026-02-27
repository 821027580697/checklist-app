// NextAuth SessionProvider 래퍼 (클라이언트 컴포넌트)
'use client';

import { SessionProvider } from 'next-auth/react';

export const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
