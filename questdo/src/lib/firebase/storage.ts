// Firebase Storage 업로드/다운로드 함수
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

// 이미지 압축 유틸 — Canvas로 리사이즈 + JPEG 압축
async function compressImage(file: File, maxDim: number = 800, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // 최대 크기 제한
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Blob 생성 실패 시 원본 파일 사용
              resolve(file);
            }
          },
          'image/jpeg',
          quality,
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다'));
    reader.readAsDataURL(file);
  });
}

// 이미지를 base64 Data URL로 변환 (Firebase Storage 없이 Firestore에 직접 저장용)
async function imageToDataUrl(file: File, maxDim: number = 200, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // 프로필 사진은 200px 정도면 충분
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG data URL로 변환 (가장 작은 용량)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다'));
    reader.readAsDataURL(file);
  });
}

// 이미지 업로드 (프로필 아바타)
// 1차: Firebase Storage 시도
// 2차: Storage 사용 불가 시 base64 Data URL로 Firestore 직접 저장
export const uploadAvatar = async (
  userId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }

    // Firebase Storage가 있으면 Storage에 업로드 시도
    if (storage) {
      try {
        // 이미지 압축 (프로필은 400px 정도면 충분)
        let uploadData: Blob | File;
        try {
          uploadData = await compressImage(file, 400, 0.85);
        } catch {
          uploadData = file;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_avatar.${ext}`;
        const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: { userId, type: 'avatar' },
        };

        await uploadBytes(storageRef, uploadData, metadata);
        const url = await getDownloadURL(storageRef);
        return { url, error: null };
      } catch (storageError) {
        console.warn('[Storage] Firebase Storage upload failed, falling back to base64:', storageError);
        // Storage 실패 시 base64 fallback
      }
    }

    // Fallback: base64 Data URL (Firebase Storage 없이 사용 가능)
    console.log('[Storage] Using base64 Data URL fallback for avatar');
    const dataUrl = await imageToDataUrl(file, 200, 0.7);

    // 데이터 URL 크기 확인 (Firestore 문서 크기 제한: 1MB)
    if (dataUrl.length > 500_000) {
      // 품질을 더 낮춰서 재시도
      const smallerDataUrl = await imageToDataUrl(file, 150, 0.5);
      return { url: smallerDataUrl, error: null };
    }

    return { url: dataUrl, error: null };
  } catch (error) {
    console.error('[Storage] Avatar upload failed:', error);
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

    // 이미지 압축
    let uploadData: Blob | File;
    try {
      uploadData = await compressImage(file, 1200, 0.85);
    } catch {
      uploadData = file;
    }

    const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, uploadData, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    console.error('[Storage] Post image upload failed:', error);
    return { url: null, error: error as Error };
  }
};

// 영수증 이미지 업로드
export const uploadReceiptImage = async (
  userId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    if (!storage) throw new Error('Firebase Storage not initialized');
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('파일 크기는 10MB 이하여야 합니다.');
    }

    // 영수증은 해상도 유지가 중요하므로 가볍게 압축
    let uploadData: Blob | File;
    try {
      uploadData = await compressImage(file, 1600, 0.9);
    } catch {
      uploadData = file;
    }

    const storageRef = ref(storage, `receipts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, uploadData, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    console.error('[Storage] Receipt image upload failed:', error);
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
