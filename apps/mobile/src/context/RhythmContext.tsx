import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CREATIVE_ATTACHMENTS,
  type CheckIn,
  type CreativeAttachment,
  type MoodType,
} from '@nhipnha/shared';
import { apiClient } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface RhythmState {
  morningCompleted: boolean;
  morningTime?: string;
  morningBellListened: boolean;

  afternoonCompleted: boolean;
  afternoonMood?: MoodType;
  afternoonVoiceDuration?: number;
  afternoonVoiceUrl?: string;
  afternoonAttachment?: CreativeAttachment;
  afternoonTime?: string;
  afternoonSyncStatus: 'SYNCED' | 'PENDING';

  eveningCompleted: boolean;
  eveningListened: boolean;
  eveningExtraReplied: boolean;
  eveningMessageText: string;

  pendingOfflineCount: number;
}

interface RhythmContextType {
  state: RhythmState;
  markMorningBellListened: () => void;
  submitMorningTouch: () => Promise<void>;
  submitAfternoonTouch: (
    mood: MoodType,
    voiceData?: { url: string; duration: number; waveform: number[] },
    attachment?: CreativeAttachment
  ) => Promise<void>;
  markEveningListened: () => Promise<void>;
  submitEveningExtraReply: () => Promise<void>;
  refreshRhythm: () => Promise<void>;
}

const RhythmContext = createContext<RhythmContextType | undefined>(undefined);

export const RhythmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { family, member } = useAuth();
  const [state, setState] = useState<RhythmState>({
    morningCompleted: true, // seeded demo state
    morningTime: '06:45',
    morningBellListened: true,
    afternoonCompleted: false,
    afternoonMood: 'JOYFUL',
    afternoonAttachment: CREATIVE_ATTACHMENTS[0], // Default lotus doodle
    afternoonSyncStatus: 'SYNCED',
    eveningCompleted: false,
    eveningListened: false,
    eveningExtraReplied: false,
    eveningMessageText:
      'An ơi, mẹ tăng ca về rồi nè. Mẹ thấy bức vẽ hoa sen hồng của con đẹp quá! Con nhớ uống ly nước ấm bà pha rồi đi ngủ sớm nhé. Cuối tuần bố mẹ về thăm con!',
    pendingOfflineCount: 0,
  });

  const refreshRhythm = async () => {
    const queue = await offlineStorage.getOfflineQueue();
    setState((prev) => ({ ...prev, pendingOfflineCount: queue.length }));
  };

  useEffect(() => {
    refreshRhythm();
  }, []);

  const markMorningBellListened = () => {
    setState((prev) => ({ ...prev, morningBellListened: true }));
  };

  const submitMorningTouch = async () => {
    const checkIn: Partial<CheckIn> = {
      familyId: family?.id || 'fam_dongthap_001',
      memberId: member?.id || 'mem_child_an',
      memberName: member?.name || 'Bé An',
      rhythmType: 'MORNING',
      note: 'Con chuẩn bị đi học đây ạ! Chúc bố mẹ đi làm vui vẻ!',
    };

    await apiClient.submitCheckIn(checkIn);
    const now = new Date();
    setState((prev) => ({
      ...prev,
      morningCompleted: true,
      morningTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    }));
    await refreshRhythm();
  };

  const submitAfternoonTouch = async (
    mood: MoodType,
    voiceData?: { url: string; duration: number; waveform: number[] },
    attachment?: CreativeAttachment
  ) => {
    const checkIn: Partial<CheckIn> = {
      familyId: family?.id || 'fam_dongthap_001',
      memberId: member?.id || 'mem_child_an',
      memberName: member?.name || 'Bé An',
      rhythmType: 'AFTERNOON',
      mood,
      voiceDurationSec: voiceData?.duration || 15,
      voiceUrl: voiceData?.url,
      waveform: voiceData?.waveform,
      attachment: attachment || CREATIVE_ATTACHMENTS[0],
      note: 'Nhật ký tương tác 15 giây (Cảm xúc + Giọng nói + Nét vẽ/Ảnh chụp).',
    };

    const saved = await apiClient.submitCheckIn(checkIn);
    const now = new Date();
    setState((prev) => ({
      ...prev,
      afternoonCompleted: true,
      afternoonMood: mood,
      afternoonVoiceDuration: voiceData?.duration || 15,
      afternoonVoiceUrl: voiceData?.url,
      afternoonAttachment: attachment || prev.afternoonAttachment,
      afternoonTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      afternoonSyncStatus: saved.syncStatus || 'SYNCED',
    }));
    await refreshRhythm();
  };

  const markEveningListened = async () => {
    setState((prev) => ({
      ...prev,
      eveningCompleted: true,
      eveningListened: true,
    }));
  };

  const submitEveningExtraReply = async () => {
    const checkIn: Partial<CheckIn> = {
      familyId: family?.id || 'fam_dongthap_001',
      memberId: member?.id || 'mem_child_an',
      memberName: member?.name || 'Bé An',
      rhythmType: 'EVENING',
      note: 'Tâm sự tối qua hộp thư thoại: Con chúc bố mẹ ngủ ngon ạ!',
    };
    await apiClient.submitCheckIn(checkIn);
    setState((prev) => ({
      ...prev,
      eveningCompleted: true,
      eveningExtraReplied: true,
    }));
    await refreshRhythm();
  };

  return (
    <RhythmContext.Provider
      value={{
        state,
        markMorningBellListened,
        submitMorningTouch,
        submitAfternoonTouch,
        markEveningListened,
        submitEveningExtraReply,
        refreshRhythm,
      }}
    >
      {children}
    </RhythmContext.Provider>
  );
};

export const useRhythm = () => {
  const context = useContext(RhythmContext);
  if (!context) {
    throw new Error('useRhythm must be used within a RhythmProvider');
  }
  return context;
};
