import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CheckIn, Family, Member } from '@nhipnha/shared';

const STORAGE_KEYS = {
  CURRENT_MEMBER: 'nhipnha_current_member',
  CURRENT_FAMILY: 'nhipnha_current_family',
  SESSION_TOKEN: 'nhipnha_session_token',
  PERSONAL_LOGIN_CODE: 'nhipnha_personal_login_code',
  OFFLINE_QUEUE: 'nhipnha_offline_queue',
  VOICE_CACHE: 'nhipnha_voice_cache',
};

// In-memory fallback if AsyncStorage is not initialized
const memCache = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (AsyncStorage && AsyncStorage.setItem) {
      await AsyncStorage.setItem(key, value);
    }
  } catch {
    memCache.set(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (AsyncStorage && AsyncStorage.getItem) {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // fallback
  }
  return memCache.get(key) || null;
}

async function removeItem(key: string): Promise<void> {
  try {
    if (AsyncStorage && AsyncStorage.removeItem) {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // fallback
  }
  memCache.delete(key);
}

export const offlineStorage = {
  async saveAuth(
    family: Family,
    member: Member,
    token?: string,
    loginCode?: string
  ): Promise<void> {
    await setItem(STORAGE_KEYS.CURRENT_FAMILY, JSON.stringify(family));
    await setItem(STORAGE_KEYS.CURRENT_MEMBER, JSON.stringify(member));
    if (token !== undefined) {
      if (token) {
        await setItem(STORAGE_KEYS.SESSION_TOKEN, token);
      } else {
        await removeItem(STORAGE_KEYS.SESSION_TOKEN);
      }
    }
    if (loginCode !== undefined) {
      if (loginCode) {
        await setItem(STORAGE_KEYS.PERSONAL_LOGIN_CODE, loginCode);
      } else {
        await removeItem(STORAGE_KEYS.PERSONAL_LOGIN_CODE);
      }
    }
  },

  async savePersonalLoginCode(loginCode: string): Promise<void> {
    await setItem(STORAGE_KEYS.PERSONAL_LOGIN_CODE, loginCode);
  },

  async getAuth(): Promise<{
    family: Family | null;
    member: Member | null;
    token: string | null;
    loginCode: string | null;
  }> {
    const famStr = await getItem(STORAGE_KEYS.CURRENT_FAMILY);
    const memStr = await getItem(STORAGE_KEYS.CURRENT_MEMBER);
    const token = await getItem(STORAGE_KEYS.SESSION_TOKEN);
    const loginCode = await getItem(STORAGE_KEYS.PERSONAL_LOGIN_CODE);
    return {
      family: famStr ? JSON.parse(famStr) : null,
      member: memStr ? JSON.parse(memStr) : null,
      token: token || null,
      loginCode: loginCode || null,
    };
  },

  async clearAuth(): Promise<void> {
    await removeItem(STORAGE_KEYS.CURRENT_FAMILY);
    await removeItem(STORAGE_KEYS.CURRENT_MEMBER);
    await removeItem(STORAGE_KEYS.SESSION_TOKEN);
    await removeItem(STORAGE_KEYS.PERSONAL_LOGIN_CODE);
  },

  async enqueueOfflineCheckIn(checkIn: CheckIn): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push({
      ...checkIn,
      syncStatus: 'PENDING',
    });
    await setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async getOfflineQueue(): Promise<CheckIn[]> {
    const queueStr = await getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!queueStr) return [];
    try {
      return JSON.parse(queueStr);
    } catch {
      return [];
    }
  },

  async clearOfflineQueue(): Promise<void> {
    await removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  // Mock voice recorder simulation with deferred upload
  async recordMockVoice(durationSec: number): Promise<{
    voiceUrl: string;
    waveform: number[];
    durationSec: number;
  }> {
    const sampleCount = Math.min(20, Math.max(10, durationSec));
    const waveform: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const base = Math.sin((i / sampleCount) * Math.PI) * 75;
      const noise = (Math.random() - 0.5) * 25;
      waveform.push(Math.round(Math.max(15, Math.min(100, base + noise))));
    }

    const voiceUrl = `mock://voice/offline-${Date.now()}-${durationSec}s.aac`;
    return {
      voiceUrl,
      waveform,
      durationSec,
    };
  },
};
