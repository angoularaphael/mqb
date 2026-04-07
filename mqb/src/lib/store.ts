import { create } from 'zustand';
import { JWTPayload } from '@/lib/auth';

interface AuthState {
  user: JWTPayload | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: JWTPayload | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, error: null }),
}));

interface UIState {
  theme: 'light' | 'dark';
  fontSize: number;
  language: 'fr' | 'en';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  fontSize: 16,
  language: 'fr',
  sidebarOpen: true,
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setFontSize: (size) => set({ fontSize: size }),
  setLanguage: (lang) => set({ language: lang }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

interface SessionState {
  sessionStartTime: number | null;
  lastActivityTime: number | null;
  isSessionValid: boolean;
  startSession: () => void;
  updateActivity: () => void;
  endSession: () => void;
  getSessionDuration: () => number;
  getInactiveTime: () => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionStartTime: null,
  lastActivityTime: null,
  isSessionValid: true,
  startSession: () => {
    const now = Date.now();
    set({
      sessionStartTime: now,
      lastActivityTime: now,
      isSessionValid: true,
    });
  },
  updateActivity: () => set({ lastActivityTime: Date.now() }),
  endSession: () => set({ sessionStartTime: null, lastActivityTime: null, isSessionValid: false }),
  getSessionDuration: () => {
    const { sessionStartTime } = get();
    if (!sessionStartTime) return 0;
    return Date.now() - sessionStartTime;
  },
  getInactiveTime: () => {
    const { lastActivityTime } = get();
    if (!lastActivityTime) return 0;
    return Date.now() - lastActivityTime;
  },
}));

interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
  }>;
  addNotification: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (type, message) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, timestamp: Date.now() }],
    }));
    // Auto remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => set({ notifications: [] }),
}));
