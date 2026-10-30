import type { CheckIn, Family, Member } from '@nhipnha/shared';

const AUTH_STORAGE_KEY = 'nhipnha_web_auth';
const OFFLINE_QUEUE_KEY = 'nhipnha_web_offline_queue';

export interface StoredAuth {
  family: Family | null;
  member: Member | null;
  token?: string | null;
  loginCode?: string | null;
}

export const webStorage = {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  },

  async saveAuth(
    family: Family,
    member: Member,
    token?: string | null,
    loginCode?: string | null
  ): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const payload: StoredAuth = {
        family,
        member,
        token: token ?? null,
        loginCode: loginCode ?? null,
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save auth to localStorage:', e);
    }
  },

  async getAuth(): Promise<StoredAuth> {
    if (!this.isAvailable()) return { family: null, member: null };
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return { family: null, member: null };
      return JSON.parse(raw);
    } catch {
      return { family: null, member: null };
    }
  },

  async clearAuth(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear auth from localStorage:', e);
    }
  },

  async enqueueOfflineCheckIn(checkIn: CheckIn): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const queue = await this.getOfflineQueue();
      queue.push(checkIn);
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to enqueue offline check-in:', e);
    }
  },

  async getOfflineQueue(): Promise<CheckIn[]> {
    if (!this.isAvailable()) return [];
    try {
      const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async clearOfflineQueue(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.warn('Failed to clear offline queue:', e);
    }
  },
};
