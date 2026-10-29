/**
 * Nhịp Nhà – Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ" (Little Footsteps)
 * Core Domain Models, Enums and Constants
 */

export type Role = 'CHILD' | 'PARENT' | 'GRANDPARENT';

export type RhythmType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type MoodType = 'JOYFUL' | 'CALM' | 'TIRED' | 'NEED_HUG';

export type AttachmentType = 'DOODLE' | 'PHOTO' | 'STICKER';

export interface CreativeAttachment {
  type: 'DOODLE' | 'PHOTO' | 'STICKER';
  id: string;
  titleVi: string;
  titleEn: string;
  emoji: string; // Material Icon name
  dominantColor: string;
  imageUrl?: string; // Uploaded photo data URL or CDN URI
  cvSignalVi: string; // Computer Vision non-diagnostic supplemental signal
  cvSignalEn: string;
}

export interface Family {
  id: string;
  name: string;
  code: string; // Pairing code (e.g. NHIP-8868)
  qrPayload: string; // Zero-type pairing payload
  addressProvince?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  deviceId?: string;
  /** The family host. Only the owner can invite, change roles or remove members. */
  isOwner?: boolean;
  /** Only filled in for the owner's view of the roster, and for the member themself. */
  email?: string;
  hasPassword?: boolean;
  createdAt: string;
}

/** Public demo family used for testing. Its data is seeded on the server only. */
export const DEMO_FAMILY_ID = 'fam_dongthap_001';
export const DEMO_FAMILY_CODE = 'NHIP-8868';

export const ALL_ROLES: Role[] = ['CHILD', 'PARENT', 'GRANDPARENT'];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as string[]).includes(value);
}

/**
 * A single-use invitation created by the family owner. The role is fixed by the
 * owner at creation time, so the person joining cannot choose it.
 */
export interface FamilyInvite {
  id: string;
  familyId: string;
  code: string; // e.g. MOI-7K3F9QXA
  role: Role;
  memberName?: string; // optional pre-filled display name
  createdBy: string; // owner member id
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedByName?: string;
  revokedAt?: string;
}

export type InviteStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

export const INVITE_TTL_OPTIONS_HOURS = [24, 72, 168];
export const INVITE_DEFAULT_TTL_HOURS = 72;

export function getInviteStatus(invite: FamilyInvite, now: number = Date.now()): InviteStatus {
  if (invite.revokedAt) return 'REVOKED';
  if (invite.usedAt) return 'USED';
  if (new Date(invite.expiresAt).getTime() <= now) return 'EXPIRED';
  return 'ACTIVE';
}

export interface CheckIn {
  id: string;
  familyId: string;
  memberId: string;
  memberName?: string;
  rhythmType: RhythmType;
  mood?: MoodType;
  note?: string;
  voiceDurationSec?: number;
  voiceUrl?: string; // audio data url or cdn link
  waveform?: number[]; // simulated or recorded amplitude array
  attachment?: CreativeAttachment; // Quick doodle or photo from 15s interactive diary
  syncStatus: 'SYNCED' | 'PENDING';
  createdAt: string;
}

export interface Message {
  id: string;
  familyId: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  rhythmType: RhythmType;
  audioUrl?: string;
  transcription?: string;
  durationSec: number;
  aiSummary?: string;
  aiSuggestedPrompts?: string[];
  listenedAt?: string;
  createdAt: string;
}

// 4 Friendly Emotions for Rural Children (Chạm Chiều - Nhật ký tương tác 15s)
export interface EmotionOption {
  id: MoodType;
  label: string;
  sublabel: string;
  emoji: string; // Material Icon name
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export const EMOTIONS: EmotionOption[] = [
  {
    id: 'JOYFUL',
    label: 'Vui vẻ',
    sublabel: 'Nhiều chuyện vui',
    emoji: 'sentiment-very-satisfied',
    colorBg: '#FEF3C7',
    colorBorder: '#F59E0B',
    colorText: '#92400E',
  },
  {
    id: 'CALM',
    label: 'Bình yên',
    sublabel: 'Một ngày êm đềm',
    emoji: 'wb-cloudy',
    colorBg: '#E0F2FE',
    colorBorder: '#0284C7',
    colorText: '#075985',
  },
  {
    id: 'TIRED',
    label: 'Hơi mệt',
    sublabel: 'Cần nghỉ ngơi xíu',
    emoji: 'bedtime',
    colorBg: '#F3F4F6',
    colorBorder: '#6B7280',
    colorText: '#374151',
  },
  {
    id: 'NEED_HUG',
    label: 'Cần ôm',
    sublabel: 'Nhớ bố mẹ nhiều',
    emoji: 'favorite',
    colorBg: '#FCE7F3',
    colorBorder: '#EC4899',
    colorText: '#9D174D',
  },
];

// Preset Doodle / Photo Canvas options for 15s Interactive Flash Diary (Section 5.1 & 5.3)
export const CREATIVE_ATTACHMENTS: CreativeAttachment[] = [
  {
    id: 'doodle_lotus',
    type: 'DOODLE',
    titleVi: 'Nét vẽ: Hoa sen hồng tặng mẹ',
    titleEn: 'Doodle: Pink lotus flower for Mom',
    emoji: 'local-florist',
    dominantColor: '#F472B6',
    cvSignalVi: 'Màu hồng ấm & vàng tươi — Tín hiệu thị giác tích cực, giàu tình cảm hướng về gia đình.',
    cvSignalEn: 'Warm pink & bright yellow — Positive visual signal showing strong family affection.',
  },
  {
    id: 'doodle_house',
    type: 'DOODLE',
    titleVi: 'Nét vẽ: Cả nhà mình sum họp',
    titleEn: 'Doodle: Our family together at home',
    emoji: 'home',
    dominantColor: '#F59E0B',
    cvSignalVi: 'Chủ đề ngôi nhà & mặt trời — Trẻ mong ngóng ngày cuối tuần bố mẹ về thăm.',
    cvSignalEn: 'Home & sunshine theme — Child is looking forward to parents visiting on the weekend.',
  },
  {
    id: 'photo_meal',
    type: 'PHOTO',
    titleVi: 'Ảnh chụp: Bữa cơm canh chua bà nấu',
    titleEn: "Photo: Grandma's sour soup dinner",
    emoji: 'restaurant',
    dominantColor: '#10B981',
    cvSignalVi: 'Chủ đề sinh hoạt gia đình — Bữa ăn đầy đủ cùng ông bà tại quê nhà.',
    cvSignalEn: 'Daily home life theme — Nutritious meal shared with grandparents at home.',
  },
  {
    id: 'doodle_rain',
    type: 'DOODLE',
    titleVi: 'Nét vẽ: Chiều mưa ngoài hiên nhà',
    titleEn: 'Doodle: Rainy afternoon on the porch',
    emoji: 'grain',
    dominantColor: '#60A5FA',
    cvSignalVi: 'Gam màu xanh trầm — Tín hiệu bổ trợ: Trẻ có chút lắng đọng, cần lời hỏi thăm ấm áp.',
    cvSignalEn: 'Cool blue palette — Supplemental signal: Child feels quiet and needs warm reassurance.',
  },
];

// 3 Daily Rhythms Definitions (Section 5.2: Khung hoạt động 3 nhịp gắn kết)
export interface RhythmConfig {
  type: RhythmType;
  title: string;
  subtitle: string;
  timeWindow: string;
  icon: string;
  actionTitle: string;
}

export const RHYTHM_CONFIGS: Record<RhythmType, RhythmConfig> = {
  MORNING: {
    type: 'MORNING',
    title: 'Nhịp Sáng',
    subtitle: 'Tiếng chuông buổi sáng & Hộp thư thoại 1 chạm',
    timeWindow: '06:30 - 07:15',
    icon: 'wb-sunny',
    actionTitle: 'Nghe lời chúc hẹn giờ & bấm gửi lời chào đi học',
  },
  AFTERNOON: {
    type: 'AFTERNOON',
    title: 'Nhịp Chiều',
    subtitle: 'Nhật ký tương tác 15s (Cảm xúc, Giọng nói & Nét vẽ)',
    timeWindow: '17:00 - 18:30',
    icon: 'palette',
    actionTitle: 'Chọn cảm xúc, thu âm 15s & đính kèm nét vẽ/ảnh chụp',
  },
  EVENING: {
    type: 'EVENING',
    title: 'Nhịp Tối & Cuối Tuần',
    subtitle: 'Hộp thư thoại chúc ngủ ngon & Bản tin tổng kết tuần',
    timeWindow: '20:30 - 21:00',
    icon: 'nights-stay',
    actionTitle: 'Nghe thông điệp yêu thương & tâm sự trước giờ ngủ',
  },
};

// Zero-type QR Pairing Payload Format
export interface QRPairingPayload {
  version: '1.0';
  app: 'nhipnha';
  familyId: string;
  familyCode: string;
  familyName: string;
  token: string;
  suggestedRole?: Role;
  suggestedName?: string;
  /** Present on owner-generated invites: the single-use code to join with. */
  inviteCode?: string;
  generatedAt: number;
}

// Empathy AI Prompt Generation DTO (Human-Centered AI Level 1 & Level 2)
export interface EmpathyAssistantResponse {
  summary: string;
  keywords?: string[];
  suggestedPrompts: string[];
  toneExplanation: string;
  cvInsight?: string;
}
