// 할 일 CRUD 훅
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
  orderBy,
} from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export const useTasks = () => {
  const { tasks, setTasks, addTask, updateTask, removeTask, setLoading, isLoading } = useTaskStore();
  const user = useAuthStore((state) => state.user);

  // 할 일 목록 불러오기
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await getDocuments('tasks', [
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      ]);
      if (error) throw error;
      setTasks(data as Task[]);
    } catch (error) {
      console.error('할 일 목록 불러오기 실패:', error);
      toast.error('할 일 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [user, setTasks, setLoading]);

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

  // 할 일 업데이트
  const editTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      try {
        const { error } = await updateDocument('tasks', taskId, data);
        if (error) throw error;
        updateTask(taskId, data);
      } catch (error) {
        console.error('할 일 수정 실패:', error);
        toast.error('할 일 수정에 실패했습니다');
      }
    },
    [updateTask],
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

  // 할 일 삭제
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const { error } = await deleteDocument('tasks', taskId);
        if (error) throw error;
        removeTask(taskId);
        toast.success('할 일이 삭제되었습니다');
      } catch (error) {
        console.error('할 일 삭제 실패:', error);
        toast.error('할 일 삭제에 실패했습니다');
      }
    },
    [removeTask],
  );

  // 초기 로드
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    createTask,
    editTask,
    toggleComplete,
    deleteTask,
    fetchTasks,
  };
};
