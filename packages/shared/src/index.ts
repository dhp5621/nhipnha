/**
 * Nhịp Nhà – Gần nhau dù cách xa (Home Rhythm - RBPC 2026, SDG 3, 4, 8)
 * Core Domain Models, Enums and Constants
 */

export type Role = 'CHILD' | 'PARENT' | 'GRANDPARENT';

export type RhythmType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type MoodType = 'JOYFUL' | 'CALM' | 'TIRED' | 'NEED_HUG';

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
  createdAt: string;
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

// 4 Vietnamese Friendly Emotions for Rural Children (Chạm Chiều)
export interface EmotionOption {
  id: MoodType;
  label: string;
  sublabel: string;
  emoji: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export const EMOTIONS: EmotionOption[] = [
  {
    id: 'JOYFUL',
    label: 'Vui vẻ',
    sublabel: 'Nhiều chuyện vui',
    emoji: '😄',
    colorBg: '#FEF3C7', // amber-100
    colorBorder: '#F59E0B', // amber-500
    colorText: '#92400E', // amber-800
  },
  {
    id: 'CALM',
    label: 'Bình yên',
    sublabel: 'Một ngày êm đềm',
    emoji: '⛅',
    colorBg: '#E0F2FE', // sky-100
    colorBorder: '#0284C7', // sky-600
    colorText: '#075985', // sky-800
  },
  {
    id: 'TIRED',
    label: 'Hơi mệt',
    sublabel: 'Cần nghỉ ngơi xíu',
    emoji: '🌧️',
    colorBg: '#F3F4F6', // gray-100
    colorBorder: '#6B7280', // gray-500
    colorText: '#374151', // gray-700
  },
  {
    id: 'NEED_HUG',
    label: 'Cần ôm',
    sublabel: 'Nhớ bố mẹ nhiều',
    emoji: '🫂',
    colorBg: '#FCE7F3', // pink-100
    colorBorder: '#EC4899', // pink-500
    colorText: '#9D174D', // pink-800
  },
];

// 3 Daily Rhythms Definitions
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
    title: 'Chạm Sáng',
    subtitle: 'Chào ngày mới cùng ba mẹ',
    timeWindow: '06:00 - 08:30',
    icon: '☀️',
    actionTitle: 'Chạm 1 lần để báo thức & chào ngày mới',
  },
  AFTERNOON: {
    type: 'AFTERNOON',
    title: 'Chạm Chiều',
    subtitle: 'Kể chuyện tan trường & tâm trạng',
    timeWindow: '16:00 - 18:30',
    icon: '🎒',
    actionTitle: 'Chọn cảm xúc & gửi lời nói 15 giây',
  },
  EVENING: {
    type: 'EVENING',
    title: 'Chạm Tối',
    subtitle: 'Nghe lời dặn dò ấm áp từ ba mẹ',
    timeWindow: '20:00 - 22:00',
    icon: '🌙',
    actionTitle: 'Bấm nghe lời dặn dò trước khi ngủ',
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
  generatedAt: number;
}

// Empathy AI Prompt Generation DTO
export interface EmpathyAssistantResponse {
  summary: string;
  suggestedPrompts: string[];
  toneExplanation: string;
}
