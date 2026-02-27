// 할 일 CRUD 훅 — Firestore 실시간 리스너 기반
'use client';

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { Task } from '@/types/task';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  where,
} from '@/lib/firebase/firestore';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { Timestamp, DocumentData } from 'firebase/firestore';
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
  const user = useAuthStore((s) => s.user);

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
          // 낙관적 업데이트 — 실시간 리스너가 곧 최종 데이터를 가져옴
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

  // Firestore 실시간 리스너로 연동
  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      useTaskStore.getState().reset();
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToCollection(
      'tasks',
      [where('userId', '==', user.uid)],
      (docs: DocumentData[]) => {
        const sorted = (docs as Task[]).sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setTasks(sorted);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasks,
    isLoading,
    createTask,
    editTask,
    toggleComplete,
    deleteTask,
  };
};
