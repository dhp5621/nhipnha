import type { CheckIn, Family, Member, Message } from '@nhipnha/shared';

const AUTH_STORAGE_KEY = 'nhipnha_web_auth';
const OFFLINE_QUEUE_KEY = 'nhipnha_web_offline_queue';
const CHECKINS_PREFIX = 'nhipnha_checkins_';
const MESSAGES_PREFIX = 'nhipnha_messages_';
const TIMELINE_PREFIX = 'nhipnha_timeline_';
const GREETING_PREFIX = 'nhipnha_greeting_';

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

  // Persistent storage for check-ins across deployments on Vercel
  async saveLocalCheckIn(checkIn: CheckIn): Promise<void> {
    if (!this.isAvailable() || !checkIn.familyId) return;
    try {
      const list = await this.getLocalCheckIns(checkIn.familyId);
      const idx = list.findIndex((c) => c.id === checkIn.id);
      if (idx >= 0) {
        list[idx] = checkIn;
      } else {
        list.unshift(checkIn);
      }
      window.localStorage.setItem(
        `${CHECKINS_PREFIX}${checkIn.familyId}`,
        JSON.stringify(list.slice(0, 50))
      );
    } catch (e) {
      console.warn('Failed to save local check-in:', e);
    }
  },

  async saveLocalCheckIns(familyId: string, checkIns: CheckIn[]): Promise<void> {
    if (!this.isAvailable() || !familyId) return;
    try {
      window.localStorage.setItem(
        `${CHECKINS_PREFIX}${familyId}`,
        JSON.stringify(checkIns.slice(0, 50))
      );
    } catch (e) {
      console.warn('Failed to batch save local check-ins:', e);
    }
  },

  async getLocalCheckIns(familyId: string): Promise<CheckIn[]> {
    if (!this.isAvailable() || !familyId) return [];
    try {
      const raw = window.localStorage.getItem(`${CHECKINS_PREFIX}${familyId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Persistent storage for messages (e.g. bedtime guidance) across deployments on Vercel
  async saveLocalMessage(message: Message): Promise<void> {
    if (!this.isAvailable() || !message.familyId) return;
    try {
      const list = await this.getLocalMessages(message.familyId);
      const idx = list.findIndex((m) => m.id === message.id);
      if (idx >= 0) {
        list[idx] = message;
      } else {
        list.unshift(message);
      }
      window.localStorage.setItem(
        `${MESSAGES_PREFIX}${message.familyId}`,
        JSON.stringify(list.slice(0, 50))
      );
    } catch (e) {
      console.warn('Failed to save local message:', e);
    }
  },

  async saveLocalMessages(familyId: string, messages: Message[]): Promise<void> {
    if (!this.isAvailable() || !familyId) return;
    try {
      window.localStorage.setItem(
        `${MESSAGES_PREFIX}${familyId}`,
        JSON.stringify(messages.slice(0, 50))
      );
    } catch (e) {
      console.warn('Failed to batch save local messages:', e);
    }
  },

  async getLocalMessages(familyId: string): Promise<Message[]> {
    if (!this.isAvailable() || !familyId) return [];
    try {
      const raw = window.localStorage.getItem(`${MESSAGES_PREFIX}${familyId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Persistent storage for full timeline snapshots across deployments on Vercel
  async saveLocalTimeline(familyId: string, data: any): Promise<void> {
    if (!this.isAvailable() || !familyId) return;
    try {
      window.localStorage.setItem(`${TIMELINE_PREFIX}${familyId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save local timeline:', e);
    }
  },

  async getLocalTimeline(familyId: string): Promise<any | null> {
    if (!this.isAvailable() || !familyId) return null;
    try {
      const raw = window.localStorage.getItem(`${TIMELINE_PREFIX}${familyId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Explicit greeting status persistence across deployments on Vercel
  async saveGreetingCompleted(
    familyId: string,
    info: { completed: boolean; time?: string; date: string }
  ): Promise<void> {
    if (!this.isAvailable() || !familyId) return;
    try {
      window.localStorage.setItem(`${GREETING_PREFIX}${familyId}`, JSON.stringify(info));
    } catch (e) {
      console.warn('Failed to save greeting status:', e);
    }
  },

  async getGreetingCompleted(
    familyId: string
  ): Promise<{ completed: boolean; time?: string; date: string } | null> {
    if (!this.isAvailable() || !familyId) return null;
    try {
      const raw = window.localStorage.getItem(`${GREETING_PREFIX}${familyId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
