// Firestore CRUD 유틸리티 함수
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// 문서 생성
export const createDocument = async (
  collectionName: string,
  data: DocumentData,
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error as Error };
  }
};

// 문서 업데이트
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// 문서 삭제
export const deleteDocument = async (
  collectionName: string,
  docId: string,
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    await deleteDoc(doc(db, collectionName, docId));
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// 단일 문서 조회
export const getDocument = async (
  collectionName: string,
  docId: string,
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// 복수 문서 조회 (쿼리 빌더)
export const getDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = [],
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    return { data: docs, lastDoc: snapshot.docs[snapshot.docs.length - 1], error: null };
  } catch (error) {
    return { data: [], lastDoc: null, error: error as Error };
  }
};

// 실시간 리스너 (onSnapshot)
export const subscribeToCollection = (
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (docs: DocumentData[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!db) {
    // Firestore not initialized
    return () => {};
  }
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(docs);
    },
    (error) => {
      console.error(`Firestore listener error (${collectionName}):`, error);
      onError?.(error);
    },
  );
};

// 배치 업데이트 (여러 문서 동시 업데이트)
export const batchUpdate = async (
  updates: { collectionName: string; docId: string; data: Partial<DocumentData> }[],
) => {
  try {
    if (!db) throw new Error('Firestore not initialized');
    const firestore = db;
    const batch = writeBatch(firestore);
    updates.forEach(({ collectionName, docId, data }) => {
      const docRef = doc(firestore, collectionName, docId);
      batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
    });
    await batch.commit();
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// 쿼리 헬퍼 재내보내기
export { where, orderBy, limit, startAfter, serverTimestamp };
