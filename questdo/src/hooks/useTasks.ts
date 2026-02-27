// 할 일 CRUD 훅 — MongoDB API 기반
'use client';

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { Task } from '@/types/task';
import { taskApi, userApi } from '@/lib/api/client';
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
  const setUser = useAuthStore((s) => s.setUser);

  // 할 일 목록 가져오기
  const fetchTasks = useCallback(async () => {
    if (!user || isFetched) return;
    setLoading(true);
    try {
      const data = await taskApi.list();
      setTasks(data as unknown as Task[]);
    } catch (err) {
      console.error('할 일 불러오기 실패:', err);
      toast.error('할 일을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [user, isFetched, setTasks, setLoading]);

  // 할 일 생성
  const createTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'xpEarned' | 'completedAt'>) => {
      if (!user) return;
      try {
        const created = await taskApi.create({
          ...taskData,
          xpEarned: 0,
          completedAt: null,
        });
        addTask(created as unknown as Task);
        toast.success('할 일이 추가되었습니다');
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
      const previousTask = tasks.find((t) => t.id === taskId);
      try {
        updateTask(taskId, data);
        await taskApi.update(taskId, data as Record<string, unknown>);
      } catch (error) {
        if (previousTask) updateTask(taskId, previousTask);
        console.error('할 일 수정 실패:', error);
        toast.error('할 일 수정에 실패했습니다');
      }
    },
    [tasks, updateTask],
  );

  // 할 일 완료 토글 + XP ± 처리
  const toggleComplete = useCallback(
    async (task: Task) => {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
      const xpAmount = 10;

      await editTask(task.id, { status: newStatus, completedAt });

      if (user) {
        try {
          if (newStatus === 'completed') {
            const newTotalXp = (user.totalXp || 0) + xpAmount;
            const newXp = (user.xp || 0) + xpAmount;
            const newTotalCompleted = (user.stats?.totalCompleted || 0) + 1;

            await userApi.update({
              totalXp: newTotalXp,
              xp: newXp,
              'stats.totalCompleted': newTotalCompleted,
            });

            setUser({
              ...user,
              totalXp: newTotalXp,
              xp: newXp,
              stats: { ...user.stats, totalCompleted: newTotalCompleted },
            });
          } else {
            const newTotalXp = Math.max(0, (user.totalXp || 0) - xpAmount);
            const newXp = Math.max(0, (user.xp || 0) - xpAmount);
            const newTotalCompleted = Math.max(0, (user.stats?.totalCompleted || 0) - 1);

            await userApi.update({
              totalXp: newTotalXp,
              xp: newXp,
              'stats.totalCompleted': newTotalCompleted,
            });

            setUser({
              ...user,
              totalXp: newTotalXp,
              xp: newXp,
              stats: { ...user.stats, totalCompleted: newTotalCompleted },
            });
          }
        } catch (err) {
          console.error('XP 업데이트 실패:', err);
        }
      }
    },
    [editTask, user, setUser],
  );

  // 할 일 삭제
  const deleteTask = useCallback(
    async (taskId: string) => {
      const previousTask = tasks.find((t) => t.id === taskId);
      try {
        removeTask(taskId);
        await taskApi.delete(taskId);
        toast.success('할 일이 삭제되었습니다');
      } catch (error) {
        if (previousTask) addTask(previousTask);
        console.error('할 일 삭제 실패:', error);
        toast.error('할 일 삭제에 실패했습니다');
      }
    },
    [tasks, removeTask, addTask],
  );

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!user) {
      useTaskStore.getState().reset();
      return;
    }
    fetchTasks();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tasks, isLoading, createTask, editTask, toggleComplete, deleteTask, fetchTasks };
};
