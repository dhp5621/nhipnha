declare const process: any;

import type {
  CheckIn,
  Family,
  Member,
  Message,
  QRPairingPayload,
  Role,
  EmpathyAssistantResponse,
} from '@nhipnha/shared';
import { offlineStorage } from './offlineStorage';

// API base URL - configurable via process.env or fallback to live Vercel deployment
export const API_BASE =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://nhipnha.vercel.app/api';

export interface FamilyTimelineResponse {
  success: boolean;
  family: Family | null;
  members: Member[];
  checkIns: CheckIn[];
  messages: Message[];
  rhythmScore: number;
  timeline: Array<{
    id: string;
    type: 'MORNING' | 'AFTERNOON' | 'EVENING';
    title: string;
    timeWindow: string;
    status: 'COMPLETED' | 'PENDING';
    data: any;
    extraReply?: any;
    summary: string;
  }>;
}

export const apiClient = {
  // Zero-type QR Pairing against database
  async pairWithQR(
    qrPayload: string | QRPairingPayload,
    memberRole?: Role,
    memberName?: string
  ): Promise<{ family: Family; member: Member }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload, memberRole, memberName }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await offlineStorage.saveAuth(data.family, data.member);
      return { family: data.family, member: data.member };
    }
    throw new Error(data.error || 'Không thể kết nối gia đình qua mã QR');
  },

  // Pair by family code (e.g. NHIP-8868 or user's created code) against database
  async pairWithCode(
    code: string,
    role: Role,
    name: string
  ): Promise<{ family: Family; member: Member }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), memberRole: role, memberName: name }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await offlineStorage.saveAuth(data.family, data.member);
      return { family: data.family, member: data.member };
    }
    throw new Error(data.error || 'Mã gia đình không tồn tại hoặc không hợp lệ');
  },

  // Create a new family in the database
  async createFamily(
    familyName: string,
    addressProvince: string,
    memberRole: Role,
    memberName: string
  ): Promise<{ family: Family; member: Member }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        familyName,
        addressProvince,
        memberRole,
        memberName,
      }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await offlineStorage.saveAuth(data.family, data.member);
      return { family: data.family, member: data.member };
    }
    throw new Error(data.error || 'Không thể tạo không gian gia đình mới');
  },

  // Record CheckIn (Morning, Afternoon, Evening) - with offline queuing
  async submitCheckIn(checkIn: Partial<CheckIn>): Promise<CheckIn> {
    if (!checkIn.familyId) {
      throw new Error('Missing familyId for check-in');
    }

    const fullCheckIn: CheckIn = {
      id: checkIn.id || `chk_${Date.now()}`,
      familyId: checkIn.familyId,
      memberId: checkIn.memberId || `mem_${Date.now()}`,
      memberName: checkIn.memberName || 'Thành viên',
      rhythmType: checkIn.rhythmType || 'MORNING',
      mood: checkIn.mood,
      note: checkIn.note,
      voiceDurationSec: checkIn.voiceDurationSec,
      voiceUrl: checkIn.voiceUrl,
      waveform: checkIn.waveform,
      attachment: checkIn.attachment,
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullCheckIn),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch {
      // Offline-first: save into local queue for deferred upload when network returns
      fullCheckIn.syncStatus = 'PENDING';
      await offlineStorage.enqueueOfflineCheckIn(fullCheckIn);
    }

    return fullCheckIn;
  },

  // Sync pending offline queue to server database
  async syncOfflineQueue(): Promise<number> {
    const queue = await offlineStorage.getOfflineQueue();
    if (queue.length === 0) return 0;

    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: queue }),
      });
      const data = await res.json();
      if (data.success) {
        await offlineStorage.clearOfflineQueue();
        return queue.length;
      }
    } catch {
      // Still offline, retry later
    }
    return 0;
  },

  // Get Family Timeline & database check-ins/messages
  async getFamilyTimeline(familyId: string): Promise<FamilyTimelineResponse> {
    const res = await fetch(
      `${API_BASE}/family/timeline?familyId=${encodeURIComponent(familyId)}`
    );
    const data = await res.json();
    if (data.success) {
      return data as FamilyTimelineResponse;
    }
    throw new Error(data.error || 'Failed to load family timeline');
  },

  // AI Empathy Assistant: Server-side call to generate non-academic empathy prompts
  async getEmpathySuggestions(
    mood: string,
    childMessage?: string,
    attachmentTitle?: string,
    language: 'vi' | 'en' = 'vi',
    childName?: string
  ): Promise<EmpathyAssistantResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/empathy-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          childMessage,
          childName,
          attachmentTitle,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (e) {
      console.warn('Empathy AI fetch error:', e);
    }
    return null;
  },

  // Send Bedtime Message from Parent to database
  async sendBedtimeMessage(message: Partial<Message>): Promise<Message> {
    if (!message.familyId) {
      throw new Error('Missing familyId for bedtime message');
    }
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || 'Không thể gửi tin nhắn chúc ngủ ngon');
  },

  // Mark Evening Message as listened in database
  async markMessageListened(familyId: string, messageId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_listened',
          familyId,
          messageId,
        }),
      });
    } catch {
      // Ignore network error on read receipt
    }
  },
};
