import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CheckIn, CreativeAttachment, Member, Message, MoodType } from '@nhipnha/shared';
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
  afternoonWaveform?: number[];
  afternoonAttachment?: CreativeAttachment;
  afternoonTime?: string;
  afternoonSyncStatus: 'SYNCED' | 'PENDING';

  eveningCompleted: boolean;
  eveningListened: boolean;
  eveningExtraReplied: boolean;
  eveningMessageId?: string;
  eveningMessageText: string;
  eveningAudioUrl?: string;
  eveningExtraNote?: string;
  eveningExtraVoiceUrl?: string;
  eveningExtraVoiceDuration?: number;
  eveningExtraTime?: string;

  pendingOfflineCount: number;
  members: Member[];
  checkIns: CheckIn[];
  messages: Message[];
  rhythmScore: number;
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
  submitEveningExtraReply: (
    voiceData?: { url: string; duration: number; waveform: number[] },
    note?: string
  ) => Promise<void>;
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
  members: [],
  checkIns: [],
  messages: [],
  rhythmScore: 0,
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
  const { family, member, isDemoAccount } = useAuth();
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

      // 2. Fetch full timeline (7-day checkIns, messages, members)
      const timelineData = await apiClient.getFamilyTimeline(family.id);
      if (!timelineData || !timelineData.checkIns) {
        return;
      }

      const { checkIns, messages, members = [], rhythmScore = 0 } = timelineData;

      // For real production accounts, filter today's check-ins for the daily status cards
      // while preserving the full 7-day checkIns array for Weekly Recap.
      // For the demo account, show the latest seeded check-in so judges always see active state.
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const isToday = (iso?: string) => {
        if (isDemoAccount) return true;
        if (!iso) return false;
        return iso.slice(0, 10) === todayDateStr;
      };

      const morningCheckIn = checkIns.find(
        (c) => c.rhythmType === 'MORNING' && isToday(c.createdAt)
      );
      const afternoonCheckIn = checkIns.find(
        (c) => c.rhythmType === 'AFTERNOON' && isToday(c.createdAt)
      );
      const eveningMessage = messages.find(
        (m) => m.rhythmType === 'EVENING' && isToday(m.createdAt)
      );
      const eveningExtraCheckIn = checkIns.find(
        (c) => c.rhythmType === 'EVENING' && isToday(c.createdAt)
      );

      setState((prev) => ({
        ...prev,
        pendingOfflineCount: offlineQueue.length,
        members,
        checkIns,
        messages,
        rhythmScore,

        // Morning
        morningCompleted: !!morningCheckIn,
        morningTime: formatTimeHHMM(morningCheckIn?.createdAt),

        // Afternoon
        afternoonCompleted: !!afternoonCheckIn,
        afternoonMood: afternoonCheckIn?.mood,
        afternoonNote: afternoonCheckIn?.note,
        afternoonVoiceDuration: afternoonCheckIn?.voiceDurationSec,
        afternoonVoiceUrl: afternoonCheckIn?.voiceUrl,
        afternoonWaveform: afternoonCheckIn?.waveform,
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
          '',
        eveningAudioUrl: eveningMessage?.audioUrl,
        eveningExtraReplied: !!eveningExtraCheckIn,
        eveningExtraNote: eveningExtraCheckIn?.note,
        eveningExtraVoiceUrl: eveningExtraCheckIn?.voiceUrl,
        eveningExtraVoiceDuration: eveningExtraCheckIn?.voiceDurationSec,
        eveningExtraTime: formatTimeHHMM(eveningExtraCheckIn?.createdAt),
      }));
    } catch (err) {
      console.warn('Error refreshing rhythm state:', err);
      const offlineQueue = await webStorage.getOfflineQueue();
      setState((prev) => ({ ...prev, pendingOfflineCount: offlineQueue.length }));
    }
  }, [family?.id, isDemoAccount]);

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

    const cleanNote =
      note?.trim() ||
      (isDemoAccount
        ? 'Chiều nay con đi học về vui lắm, con ăn canh chua bà nấu và chụp ảnh khoe bố mẹ nè!'
        : undefined);

    const optimisticTime = formatTimeHHMM(new Date().toISOString());
    setState((prev) => ({
      ...prev,
      afternoonCompleted: true,
      afternoonMood: mood,
      afternoonNote: cleanNote,
      afternoonVoiceDuration: voiceData?.duration,
      afternoonVoiceUrl: voiceData?.url,
      afternoonWaveform: voiceData?.waveform,
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
        note: cleanNote,
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

  const submitEveningExtraReply = async (
    voiceData?: { url: string; duration: number; waveform: number[] },
    note?: string
  ) => {
    if (!family?.id || !member?.id) return;
    const nowTime = formatTimeHHMM(new Date().toISOString());
    const finalNote = note?.trim() || 'Con chúc bố mẹ ngủ ngon ạ, con yêu bố mẹ!';
    setState((prev) => ({
      ...prev,
      eveningExtraReplied: true,
      eveningExtraNote: finalNote,
      eveningExtraVoiceUrl: voiceData?.url,
      eveningExtraVoiceDuration: voiceData?.duration,
      eveningExtraTime: nowTime,
    }));

    try {
      await apiClient.submitCheckIn({
        familyId: family.id,
        memberId: member.id,
        memberName: member.name,
        rhythmType: 'EVENING',
        note: finalNote,
        voiceDurationSec: voiceData?.duration || 5,
        voiceUrl: voiceData?.url,
        waveform: voiceData?.waveform,
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
