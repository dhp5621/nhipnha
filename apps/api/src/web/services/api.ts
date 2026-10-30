import type {
  CheckIn,
  Family,
  FamilyInvite,
  Member,
  Message,
  QRPairingPayload,
  Role,
  EmpathyAssistantResponse,
} from '@nhipnha/shared';
import { webStorage } from './webStorage';

// On web running on same domain, API base is relative /api
export const API_BASE = '/api';

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

let apiSession: { memberId: string; token?: string } | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setApiSession(session: { memberId: string; token?: string } | null) {
  apiSession = session;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiSession?.memberId) headers['x-member-id'] = apiSession.memberId;
  if (apiSession?.token) headers['Authorization'] = `Bearer ${apiSession.token}`;
  return headers;
}

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body
  }
  if (res.status === 401 && apiSession?.token && unauthorizedHandler) {
    unauthorizedHandler();
  }
  if (!res.ok || !data || data.success === false) {
    throw new Error(data?.error || `Yêu cầu thất bại (${res.status})`);
  }
  return data as T;
}

export const apiClient = {
  // Join a family through a scanned QR payload
  async pairWithQR(
    qrPayload: string | QRPairingPayload,
    memberRole?: Role,
    memberName?: string
  ): Promise<{ family: Family; member: Member; token?: string; loginCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload, memberRole, memberName }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await webStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
      return {
        family: data.family,
        member: data.member,
        token: data.token,
        loginCode: data.loginCode,
      };
    }
    throw new Error(data.error || 'Không thể kết nối gia đình qua mã QR');
  },

  // Join with an invite code from the family owner
  async pairWithCode(
    code: string,
    role?: Role,
    name?: string
  ): Promise<{ family: Family; member: Member; token?: string; loginCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), memberRole: role, memberName: name }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await webStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
      return {
        family: data.family,
        member: data.member,
        token: data.token,
        loginCode: data.loginCode,
      };
    }
    throw new Error(data.error || 'Mã mời không hợp lệ');
  },

  // Create a new family; the creator becomes its owner
  async createFamily(
    familyName: string,
    addressProvince: string,
    memberRole: Role,
    memberName: string,
    email?: string,
    password?: string
  ): Promise<{ family: Family; member: Member; token?: string; loginCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/qr-pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        familyName,
        addressProvince,
        memberRole,
        memberName,
        email,
        password,
      }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await webStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
      return {
        family: data.family,
        member: data.member,
        token: data.token,
        loginCode: data.loginCode,
      };
    }
    throw new Error(data.error || 'Không thể khởi tạo gia đình');
  },

  // Email + password login
  async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ family: Family; member: Member; token: string; loginCode?: string }> {
    const data = await request<{
      data: { family: Family; member: Member; token: string; loginCode?: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await webStorage.saveAuth(
      data.data.family,
      data.data.member,
      data.data.token,
      data.data.loginCode
    );
    return data.data;
  },

  // Personal QR login
  async loginWithQR(
    qrPayload: string
  ): Promise<{ family: Family; member: Member; token: string; loginCode?: string }> {
    const res = await request<{
      data?: { family: Family; member: Member; token: string; loginCode?: string };
      family?: Family;
      member?: Member;
      token?: string;
      loginCode?: string;
    }>('/auth/qr-login', {
      method: 'POST',
      body: JSON.stringify({ payload: qrPayload, qrPayload }),
    });
    const result = res.data || (res as any);
    await webStorage.saveAuth(
      result.family,
      result.member,
      result.token,
      result.loginCode || qrPayload
    );
    return {
      family: result.family,
      member: result.member,
      token: result.token,
      loginCode: result.loginCode || qrPayload,
    };
  },

  // Fetch full member profile
  async fetchSession(): Promise<{ family: Family; member: Member; activeSessions?: number }> {
    const data = await request<{
      data: { family: Family; member: Member; activeSessions?: number };
    }>('/auth/session', { method: 'GET' });
    return data.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request('/account', {
      method: 'POST',
      body: JSON.stringify({ action: 'change_password', currentPassword, newPassword }),
    });
  },

  // Family Members Management (Owner only)
  async getFamilyMembers(familyId: string): Promise<Member[]> {
    const data = await request<{ data: Member[] }>(
      `/family/members?familyId=${encodeURIComponent(familyId)}`
    );
    return data.data;
  },

  async addFamilyMember(
    familyId: string,
    input: { name: string; role: Role; email?: string; password?: string }
  ): Promise<{ member: Member; loginCode?: string }> {
    const data = await request<{ data: Member; loginCode?: string }>('/family/members', {
      method: 'POST',
      body: JSON.stringify({ familyId, ...input }),
    });
    return { member: data.data, loginCode: data.loginCode };
  },

  async updateFamilyMember(
    familyId: string,
    memberId: string,
    patch: { name?: string; role?: Role; email?: string; password?: string }
  ): Promise<{ member: Member; loginCode?: string }> {
    const data = await request<{ data: Member; loginCode?: string }>(
      `/family/members?familyId=${encodeURIComponent(familyId)}&memberId=${encodeURIComponent(memberId)}`,
      { method: 'PATCH', body: JSON.stringify(patch) }
    );
    return { member: data.data, loginCode: data.loginCode };
  },

  async deleteFamilyMember(familyId: string, memberId: string): Promise<void> {
    await request(
      `/family/members?familyId=${encodeURIComponent(familyId)}&memberId=${encodeURIComponent(memberId)}`,
      { method: 'DELETE' }
    );
  },

  // Family Invites Management (Owner only)
  async getFamilyInvites(familyId: string): Promise<FamilyInvite[]> {
    const data = await request<{ data: FamilyInvite[] }>(
      `/family/invites?familyId=${encodeURIComponent(familyId)}`
    );
    return data.data;
  },

  async createFamilyInvite(
    familyId: string,
    input: { role: Role; memberName?: string; ttlHours?: number }
  ): Promise<{ invite: FamilyInvite; qrPayload: string }> {
    const data = await request<{ data: FamilyInvite; qrPayload: string }>('/family/invites', {
      method: 'POST',
      body: JSON.stringify({ familyId, ...input }),
    });
    return { invite: data.data, qrPayload: data.qrPayload };
  },

  async revokeInvite(familyId: string, inviteId: string): Promise<void> {
    await request(
      `/family/invites?familyId=${encodeURIComponent(familyId)}&inviteId=${encodeURIComponent(inviteId)}`,
      { method: 'DELETE' }
    );
  },

  // Record CheckIn (Morning, Afternoon, Evening) - with offline queue
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

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(fullCheckIn),
      });
    } catch {
      // Offline fallback: enqueue
      fullCheckIn.syncStatus = 'PENDING';
      await webStorage.enqueueOfflineCheckIn(fullCheckIn);
      return fullCheckIn;
    }

    const data = await res.json().catch(() => null);
    if (res.status === 401 && apiSession?.token && unauthorizedHandler) {
      unauthorizedHandler();
    }
    if (res.ok && data?.success && data.data) {
      return data.data;
    }
    if (res.status >= 400 && res.status < 500) {
      throw new Error(data?.error || 'Không thể lưu nhịp kết nối');
    }

    fullCheckIn.syncStatus = 'PENDING';
    await webStorage.enqueueOfflineCheckIn(fullCheckIn);
    return fullCheckIn;
  },

  // Sync pending offline queue to server database
  async syncOfflineQueue(): Promise<number> {
    const queue = await webStorage.getOfflineQueue();
    if (queue.length === 0) return 0;

    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ batch: queue }),
      });
      const data = await res.json();
      if (data.success) {
        await webStorage.clearOfflineQueue();
        return queue.length;
      }
    } catch {
      // Still offline
    }
    return 0;
  },

  // Get Family Timeline & database check-ins/messages
  async getFamilyTimeline(familyId: string): Promise<FamilyTimelineResponse> {
    return request<FamilyTimelineResponse>(
      `/family/timeline?familyId=${encodeURIComponent(familyId)}`
    );
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
    const data = await request<{ data: Message }>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
    return data.data;
  },

  // Mark Evening Message as listened in database
  async markMessageListened(familyId: string, messageId: string): Promise<void> {
    try {
      await request('/messages', {
        method: 'POST',
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
