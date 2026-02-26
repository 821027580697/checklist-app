// Firebase 인증 관련 함수 — Google 전용
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import { DEFAULT_USER_SETTINGS, DEFAULT_USER_STATS } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

// Firebase 에러 메시지 매핑
const getAuthErrorMessage = (error: unknown): string => {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError?.code || '';

  switch (code) {
    case 'auth/too-many-requests':
      return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    case 'auth/popup-closed-by-user':
      return '로그인 팝업이 닫혔습니다. 다시 시도해주세요.';
    case 'auth/popup-blocked':
      return '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
    case 'auth/internal-error':
      return '내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/cancelled-popup-request':
      return '';
    default:
      return `로그인 오류가 발생했습니다. (${code || '알 수 없음'})`;
  }
};

const ensureFirebase = () => {
  if (!isFirebaseConfigured || !auth) {
    return 'Firebase가 초기화되지 않았습니다.';
  }
  return null;
};

// Google 소셜 로그인
export const signInWithGoogle = async () => {
  const configError = ensureFirebase();
  if (configError) return { user: null, error: new Error(configError), message: configError };

  try {
    const result = await signInWithPopup(auth!, googleProvider);
    return { user: result.user, error: null, message: null };
  } catch (error) {
    const message = getAuthErrorMessage(error);
    if (!message) return { user: null, error: null, message: null }; // cancelled popup
    return { user: null, error: error as Error, message };
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Firestore에 사용자 문서 생성 (온보딩 완료 시)
export const createUserDocument = async (
  firebaseUser: FirebaseUser,
  nickname: string,
  avatarUrl: string,
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      nickname,
      avatarUrl,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);

    await updateProfile(firebaseUser, {
      displayName: nickname,
      photoURL: avatarUrl,
    });

    const createdDoc = await getDoc(userRef);
    const createdData = createdDoc.exists() ? { ...createdDoc.data() } : null;

    return { data: createdData, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// Firestore에서 사용자 문서 조회
export const getUserDocument = async (uid: string) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { data: userSnap.data(), error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// 사용자 문서 존재 여부 확인
export const checkUserExists = async (uid: string): Promise<boolean> => {
  try {
    if (!db) return false;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch {
    return false;
  }
};

// 닉네임 중복 체크
export const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
  try {
    if (!db) return false;
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'users'), where('nickname', '==', nickname));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch {
    return false;
  }
};

// 인증 상태 변경 리스너
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
