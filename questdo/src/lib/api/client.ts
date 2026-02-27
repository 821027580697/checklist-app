// 프론트엔드 API 클라이언트 — Next.js API Route 호출 래퍼

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Tasks ──
export const taskApi = {
  list: () => request<Record<string, unknown>[]>('/api/tasks'),
  get: (id: string) => request<Record<string, unknown>>(`/api/tasks/${id}`),
  create: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// ── Habits ──
export const habitApi = {
  list: () => request<Record<string, unknown>[]>('/api/habits'),
  get: (id: string) => request<Record<string, unknown>>(`/api/habits/${id}`),
  create: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/habits/${id}`, { method: 'DELETE' }),
};

// ── Posts ──
export const postApi = {
  list: () => request<Record<string, unknown>[]>('/api/posts'),
  create: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  react: (id: string, reactionType: string) =>
    request<Record<string, unknown>>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ reactionType }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/posts/${id}`, { method: 'DELETE' }),
};

// ── Comments ──
export const commentApi = {
  list: (postId: string) => request<Record<string, unknown>[]>(`/api/comments?postId=${postId}`),
  create: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (commentId: string) =>
    request<{ success: boolean }>(`/api/comments?id=${commentId}`, { method: 'DELETE' }),
};

// ── Follows ──
export const followApi = {
  list: () => request<string[]>('/api/follows'),
  follow: (targetUserId: string) =>
    request<{ success: boolean }>('/api/follows', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  unfollow: (targetUserId: string) =>
    request<{ success: boolean }>('/api/follows', { method: 'DELETE', body: JSON.stringify({ targetUserId }) }),
};

// ── Users ──
export const userApi = {
  me: () => request<Record<string, unknown>>('/api/users'),
  search: (query: string) => request<Record<string, unknown>[]>(`/api/users?search=${encodeURIComponent(query)}`),
  get: (id: string) => request<Record<string, unknown>>(`/api/users/${id}`),
  update: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/users', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Data Export ──
export const exportApi = {
  csv: () =>
    fetch('/api/export').then((res) => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    }),
};
