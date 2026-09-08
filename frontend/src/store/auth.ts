'use client';

import { create } from 'zustand';
import { api, tokens } from '@/lib/api';
import type { User, Workspace } from '@/types';

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName?: string; workspaceName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  addWorkspace: (w: Workspace) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  workspaces: [],
  activeWorkspace: null,
  loading: true,

  async bootstrap() {
    if (!tokens.access && !tokens.refresh) { set({ loading: false }); return; }
    try {
      const me = await api.get<{ user: User; workspaces: Workspace[] }>('/auth/me');
      const stored = tokens.workspace;
      const active = me.workspaces.find((w) => w.id === stored) || me.workspaces[0] || null;
      if (active) tokens.setWorkspace(active.id);
      set({ user: me.user, workspaces: me.workspaces, activeWorkspace: active, loading: false });
    } catch {
      tokens.clear();
      set({ user: null, workspaces: [], activeWorkspace: null, loading: false });
    }
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    tokens.set(res.accessToken, res.refreshToken);
    await get().bootstrap();
  },

  async register(input) {
    const res = await api.post('/auth/register', input);
    tokens.set(res.accessToken, res.refreshToken);
    await get().bootstrap();
  },

  async logout() {
    await api.post('/auth/logout', { refreshToken: tokens.refresh }).catch(() => null);
    tokens.clear();
    set({ user: null, workspaces: [], activeWorkspace: null });
  },

  switchWorkspace(id) {
    const ws = get().workspaces.find((w) => w.id === id);
    if (!ws) return;
    tokens.setWorkspace(id);
    set({ activeWorkspace: ws });
  },

  addWorkspace(w) {
    set({ workspaces: [...get().workspaces, w] });
  },
}));

export const useRole = () => useAuth((s) => s.activeWorkspace?.role ?? 'viewer');
export const canEdit = (role?: string) => ['owner', 'admin', 'editor'].includes(role || '');
export const canAdmin = (role?: string) => ['owner', 'admin'].includes(role || '');
