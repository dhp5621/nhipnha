import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CheckIn, CreativeAttachment, MoodType } from '@nhipnha/shared';
import { apiClient } from '../services/api';
import { webStorage } from '../services/webStorage';
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
  eveningAudioUrl?: string;

  pendingOfflineCount: number;
}

interface RhythmContextType {
  state: RhythmState;
  markMorningBellListened: () => void;
  submitMorningTouch: () => Promise<void>;
  submitAfternoonTouch: (
    mood: MoodType,
    voiceData?: { url: string; duration: number; waveform: number[] },
    attachment?: CreativeAttachment,
    note?: string
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
    if (!family?.id) {
      setState(EMPTY_RHYTHM_STATE);
      return;
    }

    try {
      // 1. Try syncing any offline check-in queue first
      await apiClient.syncOfflineQueue();
      const offlineQueue = await webStorage.getOfflineQueue();

      // 2. Fetch full timeline
      const timelineData = await apiClient.getFamilyTimeline(family.id);
      if (!timelineData || !timelineData.checkIns) {
        return;
      }

      const { checkIns, messages } = timelineData;

      // Extract today's rhythms
      const morningCheckIn = checkIns.find((c) => c.rhythmType === 'MORNING');
      const afternoonCheckIn = checkIns.find((c) => c.rhythmType === 'AFTERNOON');
      const eveningMessage = messages.find((m) => m.rhythmType === 'EVENING');

      setState((prev) => ({
        ...prev,
        pendingOfflineCount: offlineQueue.length,

        // Morning
        morningCompleted: !!morningCheckIn,
        morningTime: formatTimeHHMM(morningCheckIn?.createdAt),

        // Afternoon
        afternoonCompleted: !!afternoonCheckIn,
        afternoonMood: afternoonCheckIn?.mood,
        afternoonNote: afternoonCheckIn?.note,
        afternoonVoiceDuration: afternoonCheckIn?.voiceDurationSec,
        afternoonVoiceUrl: afternoonCheckIn?.voiceUrl,
        afternoonAttachment: afternoonCheckIn?.attachment,
        afternoonTime: formatTimeHHMM(afternoonCheckIn?.createdAt),
        afternoonSyncStatus: afternoonCheckIn?.syncStatus || 'SYNCED',

        // Evening
        eveningCompleted: !!eveningMessage,
        eveningListened: !!eveningMessage?.listenedAt,
        eveningMessageId: eveningMessage?.id,
        eveningMessageText:
          eveningMessage?.transcription ||
          eveningMessage?.aiSummary ||
          'Con yêu ngủ ngon nhé, bố mẹ thương con nhiều!',
        eveningAudioUrl: eveningMessage?.audioUrl,
      }));
    } catch (err) {
      console.warn('Error refreshing rhythm state:', err);
      const offlineQueue = await webStorage.getOfflineQueue();
      setState((prev) => ({ ...prev, pendingOfflineCount: offlineQueue.length }));
    }
  }, [family?.id]);

  useEffect(() => {
    refreshRhythm();
  }, [refreshRhythm]);

  const markMorningBellListened = () => {
    setState((prev) => ({ ...prev, morningBellListened: true }));
  };

  const submitMorningTouch = async () => {
    if (!family?.id || !member?.id) return;

    const optimisticTime = formatTimeHHMM(new Date().toISOString());
    setState((prev) => ({
      ...prev,
      morningCompleted: true,
      morningTime: optimisticTime,
    }));

    try {
      await apiClient.submitCheckIn({
        familyId: family.id,
        memberId: member.id,
        memberName: member.name,
        rhythmType: 'MORNING',
        note: 'Con chuẩn bị đi học đây ạ!',
      });
      await refreshRhythm();
    } catch (err) {
      console.error('Error submitting morning touch:', err);
    }
  };

  const submitAfternoonTouch = async (
    mood: MoodType,
    voiceData?: { url: string; duration: number; waveform: number[] },
    attachment?: CreativeAttachment,
    note?: string
  ) => {
    if (!family?.id || !member?.id) return;

    const optimisticTime = formatTimeHHMM(new Date().toISOString());
    setState((prev) => ({
      ...prev,
      afternoonCompleted: true,
      afternoonMood: mood,
      afternoonNote: note,
      afternoonVoiceDuration: voiceData?.duration,
      afternoonVoiceUrl: voiceData?.url,
      afternoonAttachment: attachment,
      afternoonTime: optimisticTime,
    }));

    try {
      await apiClient.submitCheckIn({
        familyId: family.id,
        memberId: member.id,
        memberName: member.name,
        rhythmType: 'AFTERNOON',
        mood,
        note: note || attachment?.titleVi || undefined,
        voiceDurationSec: voiceData?.duration,
        voiceUrl: voiceData?.url,
        waveform: voiceData?.waveform,
        attachment,
      });
      await refreshRhythm();
    } catch (err) {
      console.error('Error submitting afternoon touch:', err);
    }
  };

  const markEveningListened = async () => {
    setState((prev) => ({ ...prev, eveningListened: true }));
    if (family?.id && state.eveningMessageId) {
      await apiClient.markMessageListened(family.id, state.eveningMessageId);
    }
  };

  const submitEveningExtraReply = async () => {
    if (!family?.id || !member?.id) return;
    setState((prev) => ({ ...prev, eveningExtraReplied: true }));

    try {
      await apiClient.submitCheckIn({
        familyId: family.id,
        memberId: member.id,
        memberName: member.name,
        rhythmType: 'EVENING',
        note: 'Con chúc bố mẹ ngủ ngon ạ, con yêu bố mẹ!',
        voiceDurationSec: 5,
      });
      await refreshRhythm();
    } catch (err) {
      console.error('Error submitting evening extra reply:', err);
    }
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
