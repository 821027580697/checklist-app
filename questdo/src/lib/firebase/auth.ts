// Firebase 인증 관련 함수
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { DEFAULT_USER_SETTINGS, DEFAULT_USER_STATS } from '@/types/user';

// Google 로그인 프로바이더
const googleProvider = new GoogleAuthProvider();

// 이메일/비밀번호 회원가입
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// 이메일/비밀번호 로그인
export const signInWithEmail = async (email: string, password: string) => {
  try {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Google 소셜 로그인
export const signInWithGoogle = async () => {
  try {
    if (!auth) throw new Error('Firebase Auth not initialized');
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
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
    await setDoc(userRef, {
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
    });

    // Firebase Auth 프로필도 업데이트
    await updateProfile(firebaseUser, {
      displayName: nickname,
      photoURL: avatarUrl,
    });

    return { error: null };
  } catch (error) {
    return { error: error as Error };
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

// 사용자 문서 존재 여부 확인 (온보딩 필요 여부 판단)
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
    return snapshot.empty; // 비어있으면 사용 가능
  } catch {
    return false;
  }
};

// 인증 상태 변경 리스너
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    // Firebase 미초기화 시 로그아웃 상태로 처리
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
