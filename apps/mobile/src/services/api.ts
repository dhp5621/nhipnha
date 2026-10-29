declare const process: any;

import type {
  CheckIn,
  Family,
  Member,
  Message,
  QRPairingPayload,
  EmpathyAssistantResponse,
} from '@nhipnha/shared';
import { offlineStorage } from './offlineStorage';

// API base URL - configurable via process.env or fallback to localhost
export const API_BASE =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3000/api';

export const apiClient = {
  // Zero-type QR Pairing
  async pairWithQR(qrPayload: string | QRPairingPayload): Promise<{ family: Family; member: Member }> {
    try {
      const res = await fetch(`${API_BASE}/auth/qr-pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload }),
      });
      const data = await res.json();
      if (data.success && data.family && data.member) {
        await offlineStorage.saveAuth(data.family, data.member);
        return { family: data.family, member: data.member };
      }
      throw new Error(data.error || 'Ghép đôi thất bại');
    } catch {
      // Offline fallback: Generate local demo pairing
      const fallbackFamily: Family = {
        id: 'fam_dongthap_001',
        name: 'Gia đình Bác Ba & Bé An',
        code: 'NHIP-8868',
        qrPayload: typeof qrPayload === 'string' ? qrPayload : JSON.stringify(qrPayload),
        addressProvince: 'Đồng Tháp',
        createdAt: new Date().toISOString(),
      };
      const fallbackMember: Member = {
        id: 'mem_child_an',
        familyId: fallbackFamily.id,
        name: 'Bé An (Offline)',
        role: 'CHILD',
        createdAt: new Date().toISOString(),
      };
      await offlineStorage.saveAuth(fallbackFamily, fallbackMember);
      return { family: fallbackFamily, member: fallbackMember };
    }
  },

  // Pair by manual 4-digit code (e.g. NHIP-8868)
  async pairWithCode(code: string, role: string, name: string): Promise<{ family: Family; member: Member }> {
    try {
      const res = await fetch(`${API_BASE}/auth/qr-pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, memberRole: role, memberName: name }),
      });
      const data = await res.json();
      if (data.success && data.family && data.member) {
        await offlineStorage.saveAuth(data.family, data.member);
        return { family: data.family, member: data.member };
      }
      throw new Error(data.error || 'Ghép đôi mã thất bại');
    } catch {
      const fallbackFamily: Family = {
        id: 'fam_dongthap_001',
        name: 'Gia đình Bác Ba & Bé An',
        code: code || 'NHIP-8868',
        qrPayload: '',
        addressProvince: 'Đồng Tháp',
        createdAt: new Date().toISOString(),
      };
      const fallbackMember: Member = {
        id: `mem_${Date.now()}`,
        familyId: fallbackFamily.id,
        name: name || 'Bé An',
        role: (role as any) || 'CHILD',
        createdAt: new Date().toISOString(),
      };
      await offlineStorage.saveAuth(fallbackFamily, fallbackMember);
      return { family: fallbackFamily, member: fallbackMember };
    }
  },

  // Record CheckIn (Morning, Afternoon, Evening) - with offline queuing
  async submitCheckIn(checkIn: Partial<CheckIn>): Promise<CheckIn> {
    const fullCheckIn: CheckIn = {
      id: checkIn.id || `chk_${Date.now()}`,
      familyId: checkIn.familyId || 'fam_dongthap_001',
      memberId: checkIn.memberId || 'mem_child_an',
      memberName: checkIn.memberName || 'Bé An',
      rhythmType: checkIn.rhythmType || 'MORNING',
      mood: checkIn.mood,
      note: checkIn.note,
      voiceDurationSec: checkIn.voiceDurationSec,
      voiceUrl: checkIn.voiceUrl,
      waveform: checkIn.waveform,
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
      // Offline-first: save into local queue for deferred upload
      await offlineStorage.enqueueOfflineCheckIn(fullCheckIn);
    }

    return fullCheckIn;
  },

  // Sync pending offline queue
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

  // Get Family Timeline
  async getFamilyTimeline(familyId: string) {
    try {
      const res = await fetch(`${API_BASE}/family/timeline?familyId=${familyId}`);
      const data = await res.json();
      if (data.success) return data;
    } catch {
      // Mock fallback
    }
    return {
      success: true,
      timeline: [
        {
          id: 'morning_slot',
          type: 'MORNING',
          title: 'Chạm Sáng – Báo thức & Đi học',
          timeWindow: '06:00 - 08:30',
          status: 'COMPLETED',
          summary: 'Bé đã chạm sáng lúc 06:45: "Con đã dậy và chuẩn bị đến trường!"',
        },
        {
          id: 'afternoon_slot',
          type: 'AFTERNOON',
          title: 'Chạm Chiều – Cảm xúc tan trường',
          timeWindow: '16:00 - 18:30',
          status: 'COMPLETED',
          summary: 'Tâm trạng: Vui vẻ 😄 • Lời nhắn voice: 14s',
        },
        {
          id: 'evening_slot',
          type: 'EVENING',
          title: 'Chạm Tối – Lời dặn dò ấm áp',
          timeWindow: '20:00 - 22:00',
          status: 'PENDING',
          summary: 'Đang đợi ba mẹ gửi lời dặn dò trước khi bé đi ngủ',
        },
      ],
    };
  },

  // AI Empathy Assistant: Summarizes child's day & generates non-academic empathy prompts
  async getEmpathySuggestions(mood: string, childMessage?: string): Promise<EmpathyAssistantResponse> {
    try {
      const res = await fetch(`${API_BASE}/ai/empathy-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, childMessage, childName: 'Bé An' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch {
      // Fallback
    }

    return {
      summary: 'Bé An hôm nay có nhiều chuyện vui ở lớp học, được cô giáo khen và ăn cơm ngon cùng bà.',
      suggestedPrompts: [
        'Hôm nay ở trường có chuyện gì làm con cười nhiều nhất thế?',
        'Bà nấu món canh gì cho An ăn chiều thế kể mẹ nghe nào?',
        'Mẹ ở xưởng nhớ con nhiều lắm, con ngủ ngoan nhé!',
      ],
      toneExplanation: 'Khuyến khích trò chuyện thấu cảm, tránh hoàn toàn câu hỏi gây áp lực điểm số.',
    };
  },

  // Send Bedtime Message from Parent
  async sendBedtimeMessage(message: Partial<Message>): Promise<Message> {
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch {
      // Fallback
    }

    return {
      id: `msg_${Date.now()}`,
      familyId: message.familyId || 'fam_dongthap_001',
      senderId: message.senderId || 'mem_parent_hoa',
      senderName: message.senderName || 'Mẹ Hoa',
      rhythmType: 'EVENING',
      durationSec: message.durationSec || 20,
      transcription: message.transcription || 'Mẹ chúc con yêu ngủ thật ngon nhé!',
      createdAt: new Date().toISOString(),
    };
  },
};
