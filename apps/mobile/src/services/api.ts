declare const process: any;

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

// Session credentials attached to every request (set by AuthContext after login / join)
let apiSession: { memberId: string; token?: string } | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setApiSession(session: { memberId: string; token?: string } | null) {
  apiSession = session;
}

/** Called when the server rejects our credentials (e.g. the owner removed this member). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiSession?.memberId) headers['x-member-id'] = apiSession.memberId;
  if (apiSession?.token) headers['Authorization'] = `Bearer ${apiSession.token}`;
  return headers;
}

/** JSON request that throws the server's own error message on failure. */
async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON error body
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
  // Join a family through a scanned QR payload (owner-generated invite or demo code)
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
      await offlineStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
      return {
        family: data.family,
        member: data.member,
        token: data.token,
        loginCode: data.loginCode,
      };
    }
    throw new Error(data.error || 'Không thể kết nối gia đình qua mã QR');
  },

  // Join with an invite code from the family owner (role is decided by the invite).
  // `role` is only honoured by the public demo family.
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
      await offlineStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
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
      await offlineStorage.saveAuth(data.family, data.member, data.token, data.loginCode);
      return {
        family: data.family,
        member: data.member,
        token: data.token,
        loginCode: data.loginCode,
      };
    }
    throw new Error(data.error || 'Không thể tạo không gian gia đình mới');
  },

  // Login with Email + Password
  async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ family: Family; member: Member; token?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (data.success && data.family && data.member) {
      await offlineStorage.saveAuth(data.family, data.member, data.token);
      return { family: data.family, member: data.member, token: data.token };
    }
    throw new Error(data.error || 'Email hoặc mật khẩu không đúng');
  },

  // Login by scanning personal QR login code
  async loginWithQR(
    payload: string | { memberId: string; secret: string }
  ): Promise<{ family: Family; member: Member; token?: string }> {
    const res = await fetch(`${API_BASE}/auth/qr-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, qrPayload: typeof payload === 'string' ? payload : JSON.stringify(payload) }),
    });
    const data = await res.json();
    const family = data.family || data.data?.family;
    const member = data.member || data.data?.member;
    const token = data.token || data.data?.token;
    if (data.success && family && member) {
      const loginStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      await offlineStorage.saveAuth(family, member, token, loginStr);
      return { family, member, token };
    }
    throw new Error(data.error || 'Mã QR đăng nhập không hợp lệ hoặc đã bị thay thế');
  },

  // ----- Family & permissions -----

  async getMembers(familyId: string): Promise<Member[]> {
    const data = await request<{ data: Member[] }>(
      `/family/members?familyId=${encodeURIComponent(familyId)}`
    );
    return data.data;
  },

  /** Owner only: add a member directly with role, custom name, and optional email+password */
  async addMemberByOwner(
    familyId: string,
    input: { name: string; role: Role; email?: string; password?: string }
  ): Promise<{ member: Member; loginCode: string }> {
    const data = await request<{ member: Member; loginCode: string }>('/family/members', {
      method: 'POST',
      body: JSON.stringify({ familyId, ...input }),
    });
    return { member: data.member, loginCode: data.loginCode };
  },

  /** Owner only (or self for display name) */
  async updateMember(
    familyId: string,
    memberId: string,
    patch: { role?: Role; name?: string }
  ): Promise<Member> {
    const data = await request<{ member: Member }>('/family/members', {
      method: 'PATCH',
      body: JSON.stringify({ familyId, memberId, ...patch }),
    });
    return data.member;
  },

  /** Owner only: set or clear a member's email + password */
  async setMemberCredentials(
    familyId: string,
    memberId: string,
    email?: string,
    password?: string
  ): Promise<void> {
    const action = email && password ? 'set_credentials' : 'clear_credentials';
    await request('/family/members', {
      method: 'PATCH',
      body: JSON.stringify({ familyId, memberId, action, email, password }),
    });
  },

  /** Owner only: regenerate a member's personal QR login code and revoke old sessions */
  async regenerateMemberQR(
    familyId: string,
    memberId: string,
    currentPassword?: string
  ): Promise<string> {
    const data = await request<{ loginCode: string }>('/family/members', {
      method: 'PATCH',
      body: JSON.stringify({
        familyId,
        memberId,
        action: 'regenerate_qr',
        currentPassword,
      }),
    });
    return data.loginCode;
  },

  /** Owner only: sign a member out of all devices */
  async signOutMemberDevices(familyId: string, memberId: string): Promise<void> {
    await request('/family/members', {
      method: 'PATCH',
      body: JSON.stringify({ familyId, memberId, action: 'sign_out_devices' }),
    });
  },

  /** Get signed-in member's account status */
  async getAccountInfo(
    familyId: string
  ): Promise<{ email?: string; hasPassword: boolean; activeSessions: number }> {
    return request(`/account?familyId=${encodeURIComponent(familyId)}`);
  },

  /** Change signed-in member's own password (and optionally email if owner) */
  async changeOwnPassword(
    familyId: string,
    input: { currentPassword?: string; newPassword: string; email?: string }
  ): Promise<{ email?: string; hasPassword: boolean }> {
    return request('/account', {
      method: 'PATCH',
      body: JSON.stringify({ familyId, ...input }),
    });
  },

  /** Owner removes a member, or a member removes themself (leave family) */
  async removeMember(familyId: string, memberId: string): Promise<void> {
    await request(
      `/family/members?familyId=${encodeURIComponent(familyId)}&memberId=${encodeURIComponent(memberId)}`,
      { method: 'DELETE' }
    );
  },

  /** Owner only */
  async listInvites(familyId: string): Promise<FamilyInvite[]> {
    const data = await request<{ data: FamilyInvite[] }>(
      `/family/invites?familyId=${encodeURIComponent(familyId)}`
    );
    return data.data;
  },

  /** Owner only: creates a single-use invite with a fixed role */
  async createInvite(
    familyId: string,
    input: { role: Role; memberName?: string; ttlHours?: number }
  ): Promise<{ invite: FamilyInvite; qrPayload: QRPairingPayload }> {
    const data = await request<{ data: FamilyInvite; qrPayload: QRPairingPayload }>(
      '/family/invites',
      { method: 'POST', body: JSON.stringify({ familyId, ...input }) }
    );
    return { invite: data.data, qrPayload: data.qrPayload };
  },

  /** Owner only */
  async revokeInvite(familyId: string, inviteId: string): Promise<void> {
    await request(
      `/family/invites?familyId=${encodeURIComponent(familyId)}&inviteId=${encodeURIComponent(inviteId)}`,
      { method: 'DELETE' }
    );
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

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(fullCheckIn),
      });
    } catch {
      // No network: keep it in the local queue and upload when the connection returns
      fullCheckIn.syncStatus = 'PENDING';
      await offlineStorage.enqueueOfflineCheckIn(fullCheckIn);
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
      // The server refused this check-in (permissions or validation); retrying will not help
      throw new Error(data?.error || 'Không thể lưu nhịp kết nối');
    }

    // Server error: queue it so nothing is lost
    fullCheckIn.syncStatus = 'PENDING';
    await offlineStorage.enqueueOfflineCheckIn(fullCheckIn);
    return fullCheckIn;
  },

  // Sync pending offline queue to server database
  async syncOfflineQueue(): Promise<number> {
    const queue = await offlineStorage.getOfflineQueue();
    if (queue.length === 0) return 0;

    try {
      const res = await fetch(`${API_BASE}/checkins`, {
        method: 'POST',
        headers: authHeaders(),
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
