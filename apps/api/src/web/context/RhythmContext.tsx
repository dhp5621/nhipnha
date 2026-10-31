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
      // 1. Load local check-ins, messages, and greeting status from persistent storage
      const localCheckIns = await webStorage.getLocalCheckIns(family.id);
      const localMessages = await webStorage.getLocalMessages(family.id);
      const savedGreeting = await webStorage.getGreetingCompleted(family.id);

      // 2. Try syncing any offline check-in queue
      await apiClient.syncOfflineQueue();
      const offlineQueue = await webStorage.getOfflineQueue();

      // 3. Fetch full timeline from server
      let serverCheckIns: CheckIn[] = [];
      let serverMessages: Message[] = [];
      let members: Member[] = [];
      let rhythmScore = 0;

      try {
        const timelineData = await apiClient.getFamilyTimeline(family.id);
        if (timelineData) {
          serverCheckIns = timelineData.checkIns || [];
          serverMessages = timelineData.messages || [];
          members = timelineData.members || [];
          rhythmScore = timelineData.rhythmScore || 0;
        }
      } catch (e) {
        console.warn('Network error fetching family timeline, using local cache:', e);
      }

      // 4. Merge server check-ins with local check-ins (guarantees data such as greeting survives Vercel redeployments)
      const mergedCheckInsMap = new Map<string, CheckIn>();
      for (const item of serverCheckIns) {
        mergedCheckInsMap.set(item.id, item);
      }
      const missingOnServer: CheckIn[] = [];
      for (const item of localCheckIns) {
        if (!mergedCheckInsMap.has(item.id)) {
          mergedCheckInsMap.set(item.id, item);
          missingOnServer.push(item);
        }
      }

      // Re-populate server in background if server cold-started after redeployment
      if (missingOnServer.length > 0 && !isDemoAccount) {
        Promise.all(missingOnServer.map((c) => apiClient.submitCheckIn(c).catch(() => null))).catch(() => null);
      }

      // Merge server messages with local messages
      const mergedMessagesMap = new Map<string, Message>();
      for (const item of serverMessages) {
        mergedMessagesMap.set(item.id, item);
      }
      for (const item of localMessages) {
        mergedMessagesMap.set(item.id, item);
      }

      const checkIns = Array.from(mergedCheckInsMap.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      const messages = Array.from(mergedMessagesMap.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      // Persist the combined sets locally
      await webStorage.saveLocalCheckIns(family.id, checkIns);
      await webStorage.saveLocalMessages(family.id, messages);

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

      const isGreetingDone: boolean =
        !!morningCheckIn || Boolean(savedGreeting?.completed && savedGreeting?.date === todayDateStr);
      const morningGreetingTime =
        formatTimeHHMM(morningCheckIn?.createdAt) ||
        (savedGreeting?.date === todayDateStr ? savedGreeting.time : undefined);

      setState((prev) => ({
        ...prev,
        pendingOfflineCount: offlineQueue.length,
        members: members.length > 0 ? members : prev.members,
        checkIns,
        messages,
        rhythmScore: rhythmScore || prev.rhythmScore,

        // Morning Wake-Up / Greeting (persists across Vercel deployments)
        morningCompleted: isGreetingDone,
        morningTime: morningGreetingTime,

        // Afternoon 15s Diary
        afternoonCompleted: !!afternoonCheckIn,
        afternoonMood: afternoonCheckIn?.mood,
        afternoonNote: afternoonCheckIn?.note,
        afternoonVoiceDuration: afternoonCheckIn?.voiceDurationSec,
        afternoonVoiceUrl: afternoonCheckIn?.voiceUrl,
        afternoonWaveform: afternoonCheckIn?.waveform,
        afternoonAttachment: afternoonCheckIn?.attachment,
        afternoonTime: formatTimeHHMM(afternoonCheckIn?.createdAt),
        afternoonSyncStatus: afternoonCheckIn?.syncStatus || 'SYNCED',

        // Evening Bedtime Guidance
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

    const nowIso = new Date().toISOString();
    const optimisticTime = formatTimeHHMM(nowIso);
    const todayDateStr = nowIso.slice(0, 10);

    // Save morning greeting to persistent local storage immediately
    await webStorage.saveGreetingCompleted(family.id, {
      completed: true,
      time: optimisticTime,
      date: todayDateStr,
    });

    const localCheckIn: CheckIn = {
      id: `chk_morning_${Date.now()}`,
      familyId: family.id,
      memberId: member.id,
      memberName: member.name,
      rhythmType: 'MORNING',
      note: 'Con chuẩn bị đi học đây ạ!',
      syncStatus: 'SYNCED',
      createdAt: nowIso,
    };
    await webStorage.saveLocalCheckIn(localCheckIn);

    setState((prev) => ({
      ...prev,
      morningCompleted: true,
      morningTime: optimisticTime,
    }));

    try {
      await apiClient.submitCheckIn(localCheckIn);
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

    const nowIso = new Date().toISOString();
    const optimisticTime = formatTimeHHMM(nowIso);

    const checkInPayload: CheckIn = {
      id: `chk_afternoon_${Date.now()}`,
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
      syncStatus: 'SYNCED',
      createdAt: nowIso,
    };

    // Save to local persistent storage immediately
    await webStorage.saveLocalCheckIn(checkInPayload);

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
      await apiClient.submitCheckIn(checkInPayload);
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
    const nowIso = new Date().toISOString();
    const nowTime = formatTimeHHMM(nowIso);
    const finalNote = note?.trim() || 'Con chúc bố mẹ ngủ ngon ạ, con yêu bố mẹ!';

    const extraCheckIn: CheckIn = {
      id: `chk_evening_extra_${Date.now()}`,
      familyId: family.id,
      memberId: member.id,
      memberName: member.name,
      rhythmType: 'EVENING',
      note: finalNote,
      voiceDurationSec: voiceData?.duration || 5,
      voiceUrl: voiceData?.url,
      waveform: voiceData?.waveform,
      syncStatus: 'SYNCED',
      createdAt: nowIso,
    };

    await webStorage.saveLocalCheckIn(extraCheckIn);

    setState((prev) => ({
      ...prev,
      eveningExtraReplied: true,
      eveningExtraNote: finalNote,
      eveningExtraVoiceUrl: voiceData?.url,
      eveningExtraVoiceDuration: voiceData?.duration,
      eveningExtraTime: nowTime,
    }));

    try {
      await apiClient.submitCheckIn(extraCheckIn);
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
