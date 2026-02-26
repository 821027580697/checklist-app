// Firebase Storage 업로드/다운로드 함수
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

// 이미지 업로드 (프로필 아바타)
export const uploadAvatar = async (
  userId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    if (!storage) throw new Error('Firebase Storage not initialized');
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }

    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
};

// 포스트 이미지 업로드
export const uploadPostImage = async (
  userId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    if (!storage) throw new Error('Firebase Storage not initialized');
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('파일 크기는 10MB 이하여야 합니다.');
    }

    const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
};

// 파일 삭제
export const deleteFile = async (fileUrl: string) => {
  try {
    if (!storage) throw new Error('Firebase Storage not initialized');
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
