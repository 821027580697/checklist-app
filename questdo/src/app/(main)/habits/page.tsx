// 습관 페이지 → /tasks?tab=habits 리다이렉트
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HabitsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tasks?tab=habits');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-primary/20 border-t-primary" />
    </div>
  );
}
