// NextAuth v5 설정 — Google OAuth + MongoDB
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { DEFAULT_USER_SETTINGS, DEFAULT_USER_STATS } from '@/types/user';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.id) {
        try {
          await dbConnect();
          const existingUser = await UserModel.findById(user.id);
          if (!existingUser) {
            // 신규 사용자 — DB에 생성
            await UserModel.create({
              _id: user.id,
              email: user.email || '',
              nickname: user.name || user.email?.split('@')[0] || 'User',
              avatarUrl: user.image || '',
              bio: '',
              level: 1,
              xp: 0,
              totalXp: 0,
              title: '초보 모험가',
              stats: DEFAULT_USER_STATS,
              badges: [],
              settings: DEFAULT_USER_SETTINGS,
              followersCount: 0,
              followingCount: 0,
            });
          }
        } catch (err) {
          console.error('SignIn DB error:', err);
          // DB 에러가 나도 로그인 자체는 허용
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).uid = token.uid as string;
      }
      return session;
    },
  },
});
