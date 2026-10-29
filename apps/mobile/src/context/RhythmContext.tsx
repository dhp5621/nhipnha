import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CheckIn, CreativeAttachment, MoodType } from '@nhipnha/shared';
import { apiClient } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface RhythmState {
  morningCompleted: boolean;
  morningTime?: string;
  morningBellListened: boolean;

  afternoonCompleted: boolean;
  afternoonMood?: MoodType;
  afternoonNote?: string;
  afternoonVoiceDuration?: number;
  afternoonVoiceUrl?: string;
  afternoonAttachment?: CreativeAttachment;
  afternoonTime?: string;
  afternoonSyncStatus: 'SYNCED' | 'PENDING';

  eveningCompleted: boolean;
  eveningListened: boolean;
  eveningExtraReplied: boolean;
  eveningMessageId?: string;
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

const EMPTY_RHYTHM_STATE: RhythmState = {
  morningCompleted: false,
  morningTime: undefined,
  morningBellListened: false,
  afternoonCompleted: false,
  afternoonMood: undefined,
  afternoonNote: undefined,
  afternoonAttachment: undefined,
  afternoonSyncStatus: 'SYNCED',
  eveningCompleted: false,
  eveningListened: false,
  eveningExtraReplied: false,
  eveningMessageId: undefined,
  eveningMessageText: '',
  pendingOfflineCount: 0,
};

function formatTimeHHMM(isoString?: string): string | undefined {
  if (!isoString) return undefined;
  try {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  } catch {
    return undefined;
  }
}

export const RhythmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { family, member } = useAuth();
  const [state, setState] = useState<RhythmState>(EMPTY_RHYTHM_STATE);

  const refreshRhythm = useCallback(async () => {
    const queue = await offlineStorage.getOfflineQueue();
    if (!family?.id) {
      setState({ ...EMPTY_RHYTHM_STATE, pendingOfflineCount: queue.length });
      return;
    }

    try {
      const timelineRes = await apiClient.getFamilyTimeline(family.id);
      const checkIns = timelineRes.checkIns || [];
      const messages = timelineRes.messages || [];

      const morningChk = checkIns.find((c) => c.rhythmType === 'MORNING');
      const afternoonChk = checkIns.find((c) => c.rhythmType === 'AFTERNOON');
      const eveningExtraChk = checkIns.find((c) => c.rhythmType === 'EVENING');
      const eveningMsg = messages.find((m) => m.rhythmType === 'EVENING');

      setState((prev) => ({
        morningCompleted: !!morningChk,
        morningTime: formatTimeHHMM(morningChk?.createdAt),
        morningBellListened: prev.morningBellListened || !!morningChk,

        afternoonCompleted: !!afternoonChk,
        afternoonMood: afternoonChk?.mood,
        afternoonNote: afternoonChk?.note,
        afternoonVoiceDuration: afternoonChk?.voiceDurationSec,
        afternoonVoiceUrl: afternoonChk?.voiceUrl,
        afternoonAttachment: afternoonChk?.attachment,
        afternoonTime: formatTimeHHMM(afternoonChk?.createdAt),
        afternoonSyncStatus: afternoonChk?.syncStatus || 'SYNCED',

        eveningCompleted: !!eveningMsg?.listenedAt || !!eveningExtraChk,
        eveningListened: !!eveningMsg?.listenedAt,
        eveningExtraReplied: !!eveningExtraChk,
        eveningMessageId: eveningMsg?.id,
        eveningMessageText: eveningMsg?.transcription || '',

        pendingOfflineCount: queue.length,
      }));
    } catch {
      setState((prev) => ({ ...prev, pendingOfflineCount: queue.length }));
    }
  }, [family?.id]);

  useEffect(() => {
    refreshRhythm();
  }, [refreshRhythm]);

  const markMorningBellListened = () => {
    setState((prev) => ({ ...prev, morningBellListened: true }));
  };

  const submitMorningTouch = async () => {
    if (!family?.id) return;
    const checkIn: Partial<CheckIn> = {
      familyId: family.id,
      memberId: member?.id || `mem_child_${Date.now()}`,
      memberName: member?.name || 'Con',
      rhythmType: 'MORNING',
      note: 'Con chuẩn bị đi học đây ạ! Chúc bố mẹ đi làm vui vẻ!',
    };

    await apiClient.submitCheckIn(checkIn);
    await refreshRhythm();
  };

  const submitAfternoonTouch = async (
    mood: MoodType,
    voiceData?: { url: string; duration: number; waveform: number[] },
    attachment?: CreativeAttachment
  ) => {
    if (!family?.id) return;
    const checkIn: Partial<CheckIn> = {
      familyId: family.id,
      memberId: member?.id || `mem_child_${Date.now()}`,
      memberName: member?.name || 'Con',
      rhythmType: 'AFTERNOON',
      mood,
      voiceDurationSec: voiceData?.duration || 15,
      voiceUrl: voiceData?.url,
      waveform: voiceData?.waveform,
      attachment,
      note: 'Nhật ký tương tác 15 giây.',
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
      afternoonTime: `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      afternoonSyncStatus: saved.syncStatus || 'SYNCED',
    }));
    await refreshRhythm();
  };

  const markEveningListened = async () => {
    if (family?.id && state.eveningMessageId) {
      await apiClient.markMessageListened(family.id, state.eveningMessageId);
    }
    setState((prev) => ({
      ...prev,
      eveningCompleted: true,
      eveningListened: true,
    }));
  };

  const submitEveningExtraReply = async () => {
    if (!family?.id) return;
    const checkIn: Partial<CheckIn> = {
      familyId: family.id,
      memberId: member?.id || `mem_child_${Date.now()}`,
      memberName: member?.name || 'Con',
      rhythmType: 'EVENING',
      note: 'Con chúc bố mẹ ngủ ngon ạ!',
    };
    await apiClient.submitCheckIn(checkIn);
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
