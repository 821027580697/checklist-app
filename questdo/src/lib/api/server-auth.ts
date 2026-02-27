// 서버 사이드 인증 헬퍼 — API Route에서 현재 유저 가져오기
import { auth } from '@/auth';

export async function getServerUser(): Promise<{ uid: string; email: string; name: string; image: string } | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  return {
    uid: (user.uid as string) || '',
    email: (user.email as string) || '',
    name: (user.name as string) || '',
    image: (user.image as string) || '',
  };
}
