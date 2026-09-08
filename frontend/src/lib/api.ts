'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: string[]) {
    super(message);
  }
}

const ACCESS = 'mf_access';
const REFRESH = 'mf_refresh';
const WORKSPACE = 'mf_workspace';

export const tokens = {
  get access() { return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS); },
  get refresh() { return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH); },
  get workspace() { return typeof window === 'undefined' ? null : localStorage.getItem(WORKSPACE); },
  set(access: string, refresh: string) { localStorage.setItem(ACCESS, access); localStorage.setItem(REFRESH, refresh); },
  setWorkspace(id: string) { localStorage.setItem(WORKSPACE, id); },
  clear() { [ACCESS, REFRESH, WORKSPACE].forEach((k) => localStorage.removeItem(k)); },
};

let refreshing: Promise<boolean> | null = null;

/** Single-flight refresh so a burst of 401s produces one refresh call. */
async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const token = tokens.refresh;
      if (!token) return false;
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!res.ok) { tokens.clear(); return false; }
      const json = await res.json();
      tokens.set(json.data.accessToken, json.data.refreshToken);
      return true;
    })().finally(() => { setTimeout(() => (refreshing = null), 0); });
  }
  return refreshing;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, any>;
  skipWorkspace?: boolean;
  raw?: boolean;
}

export async function apiFetch<T = any>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { body, params, skipWorkspace, raw, headers, ...rest } = options;

  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const finalHeaders: Record<string, string> = { ...(headers as any) };
  if (!raw) finalHeaders['Content-Type'] = 'application/json';
  if (tokens.access) finalHeaders.Authorization = `Bearer ${tokens.access}`;
  if (!skipWorkspace && tokens.workspace) finalHeaders['x-workspace-id'] = tokens.workspace;

  const res = await fetch(url.toString(), {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
    body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && tokens.refresh) {
    if (await refreshSession()) return apiFetch<T>(path, options, false);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message || 'Something went wrong', res.status, json?.errors);
  return (json?.data !== undefined ? json.data : json) as T;
}

/** Paginated endpoints return { data, meta } at the top level. */
export async function apiList<T = any>(path: string, params?: Record<string, any>) {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
  if (tokens.workspace) headers['x-workspace-id'] = tokens.workspace;

  let res = await fetch(url.toString(), { headers, credentials: 'include' });
  if (res.status === 401 && (await refreshSession())) {
    headers.Authorization = `Bearer ${tokens.access}`;
    res = await fetch(url.toString(), { headers, credentials: 'include' });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message || 'Request failed', res.status, json?.errors);
  return {
    data: (json.data ?? []) as T[],
    meta: json.meta ?? { page: 1, limit: 20, total: (json.data ?? []).length, totalPages: 1 },
  };
}

export const api = {
  get: <T = any>(p: string, params?: Record<string, any>) => apiFetch<T>(p, { params }),
  post: <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: 'POST', body }),
  patch: <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: 'PATCH', body }),
  put: <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: 'PUT', body }),
  delete: <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: 'DELETE', body }),
  upload: <T = any>(p: string, form: FormData, params?: Record<string, any>) =>
    apiFetch<T>(p, { method: 'POST', body: form, raw: true, params }),
  list: apiList,
};
