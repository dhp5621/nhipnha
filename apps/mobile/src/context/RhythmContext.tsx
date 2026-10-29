import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CheckIn, MoodType } from '@nhipnha/shared';
import { apiClient } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface RhythmState {
  morningCompleted: boolean;
  morningTime?: string;

  afternoonCompleted: boolean;
  afternoonMood?: MoodType;
  afternoonVoiceDuration?: number;
  afternoonVoiceUrl?: string;
  afternoonTime?: string;
  afternoonSyncStatus: 'SYNCED' | 'PENDING';

  eveningCompleted: boolean;
  eveningListened: boolean;
  eveningMessageText: string;

  pendingOfflineCount: number;
}

interface RhythmContextType {
  state: RhythmState;
  submitMorningTouch: () => Promise<void>;
  submitAfternoonTouch: (mood: MoodType, voiceData?: { url: string; duration: number; waveform: number[] }) => Promise<void>;
  markEveningListened: () => Promise<void>;
  refreshRhythm: () => Promise<void>;
}

const RhythmContext = createContext<RhythmContextType | undefined>(undefined);

export const RhythmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { family, member } = useAuth();
  const [state, setState] = useState<RhythmState>({
    morningCompleted: true, // seeded demo state
    morningTime: '06:45',
    afternoonCompleted: false,
    afternoonSyncStatus: 'SYNCED',
    eveningCompleted: false,
    eveningListened: false,
    eveningMessageText: 'An ơi, mẹ tăng ca về rồi nè. Con nhớ uống ly nước ấm bà pha rồi đi ngủ sớm nhé. Mẹ thương con!',
    pendingOfflineCount: 0,
  });

  const refreshRhythm = async () => {
    const queue = await offlineStorage.getOfflineQueue();
    setState((prev) => ({ ...prev, pendingOfflineCount: queue.length }));
  };

  useEffect(() => {
    refreshRhythm();
  }, []);

  const submitMorningTouch = async () => {
    const checkIn: Partial<CheckIn> = {
      familyId: family?.id || 'fam_dongthap_001',
      memberId: member?.id || 'mem_child_an',
      memberName: member?.name || 'Bé An',
      rhythmType: 'MORNING',
      note: 'Con thức dậy rồi, chuẩn bị đi học đây ạ! Chúc ba mẹ làm việc vui vẻ!',
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
    voiceData?: { url: string; duration: number; waveform: number[] }
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
      note: 'Lời nhắn 15 giây sau giờ tan trường.',
    };

    const saved = await apiClient.submitCheckIn(checkIn);
    const now = new Date();
    setState((prev) => ({
      ...prev,
      afternoonCompleted: true,
      afternoonMood: mood,
      afternoonVoiceDuration: voiceData?.duration || 15,
      afternoonVoiceUrl: voiceData?.url,
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

  return (
    <RhythmContext.Provider
      value={{
        state,
        submitMorningTouch,
        submitAfternoonTouch,
        markEveningListened,
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
