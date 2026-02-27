// 할 일 CRUD 훅 — Firestore 쿼리 안정화
'use client';

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { Task } from '@/types/task';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  where,
} from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export const useTasks = () => {
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const isFetched = useTaskStore((s) => s.isFetched);
  const setTasks = useTaskStore((s) => s.setTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const setLoading = useTaskStore((s) => s.setLoading);
  const setFetched = useTaskStore((s) => s.setFetched);
  const user = useAuthStore((s) => s.user);

  // 할 일 목록 불러오기 (중복 방지)
  const fetchTasks = useCallback(async (force = false) => {
    if (!user || !isFirebaseConfigured) return;
    if (isLoading) return; // 이미 요청 중
    if (isFetched && !force) return; // 이미 로드 완료

    setLoading(true);
    try {
      const { data, error } = await getDocuments('tasks', [
        where('userId', '==', user.uid),
      ]);

      if (error) {
        const errMsg = (error as Error)?.message || '';
        if (errMsg.includes('permission') || errMsg.includes('PERMISSION_DENIED')) {
          setTasks([]);
          return;
        }
        throw error;
      }

      // 클라이언트 정렬 (Firestore 복합 인덱스 불필요)
      const sorted = (data as Task[]).sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setTasks(sorted);
    } catch (error) {
      console.error('할 일 목록 불러오기 실패:', error);
      if (!isFetched) {
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isLoading, isFetched, setTasks, setLoading]);

  // 할 일 생성
  const createTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'xpEarned' | 'completedAt'>) => {
      if (!user) return;
      try {
        const { id, error } = await createDocument('tasks', {
          ...taskData,
          userId: user.uid,
          xpEarned: 0,
          completedAt: null,
        });
        if (error) throw error;
        if (id) {
          const newTask = {
            ...taskData,
            id,
            userId: user.uid,
            xpEarned: 0,
            completedAt: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Task;
          addTask(newTask);
          toast.success('할 일이 추가되었습니다');
        }
      } catch (error) {
        console.error('할 일 생성 실패:', error);
        toast.error('할 일 생성에 실패했습니다');
      }
    },
    [user, addTask],
  );

  // 할 일 업데이트 (낙관적 업데이트)
  const editTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      const previousTask = tasks.find((t) => t.id === taskId);
      try {
        updateTask(taskId, data); // UI 먼저 반영
        const { error } = await updateDocument('tasks', taskId, data);
        if (error) {
          // 실패 시 되돌리기
          if (previousTask) {
            updateTask(taskId, previousTask);
          }
          throw error;
        }
      } catch (error) {
        console.error('할 일 수정 실패:', error);
        toast.error('할 일 수정에 실패했습니다');
      }
    },
    [tasks, updateTask],
  );

  // 할 일 완료 토글
  const toggleComplete = useCallback(
    async (task: Task) => {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      const completedAt = newStatus === 'completed' ? Timestamp.now() : null;
      await editTask(task.id, { status: newStatus, completedAt });
    },
    [editTask],
  );

  // 할 일 삭제 (낙관적 삭제)
  const deleteTask = useCallback(
    async (taskId: string) => {
      const previousTask = tasks.find((t) => t.id === taskId);
      try {
        removeTask(taskId);
        const { error } = await deleteDocument('tasks', taskId);
        if (error) {
          if (previousTask) {
            addTask(previousTask);
          }
          throw error;
        }
        toast.success('할 일이 삭제되었습니다');
      } catch (error) {
        console.error('할 일 삭제 실패:', error);
        toast.error('할 일 삭제에 실패했습니다');
      }
    },
    [tasks, removeTask, addTask],
  );

  // 초기 로드 (user 변경 시)
  useEffect(() => {
    if (user) {
      if (!isFetched) {
        fetchTasks();
      }
    } else {
      useTaskStore.getState().reset();
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasks,
    isLoading,
    createTask,
    editTask,
    toggleComplete,
    deleteTask,
    fetchTasks: () => fetchTasks(true),
  };
};
