import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';
import { EmpathyPromptCard } from '../components/EmpathyPromptCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';
import type { EmpathyAssistantResponse } from '@nhipnha/shared';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state } = useRhythm();
  const { t, activeLanguage } = useLanguage();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [sentMessage, setSentMessage] = useState(false);

  useEffect(() => {
    async function fetchAiInsights() {
      const mood = state.afternoonMood || 'JOYFUL';
      const insights = await apiClient.getEmpathySuggestions(mood);
      setAiData(insights);
      if (insights.suggestedPrompts.length > 0) {
        setSelectedPrompt(insights.suggestedPrompts[0]);
      }
    }
    fetchAiInsights();
  }, [state.afternoonMood]);

  // 30-second recording countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording30s && durationLeft > 0) {
      interval = setInterval(() => {
        setDurationLeft((prev) => {
          if (prev <= 1) {
            handleSendBedtimeVoice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording30s, durationLeft]);

  const handleStartRecording = () => {
    setIsRecording30s(true);
    setDurationLeft(30);
  };

  const handleSendBedtimeVoice = async () => {
    setIsRecording30s(false);
    await apiClient.sendBedtimeMessage({
      familyId: family?.id || 'fam_dongthap_001',
      senderName: member?.name || 'Mẹ Hoa',
      transcription: selectedPrompt || 'Con yêu ngủ ngoan nhé, mẹ thương con nhiều!',
      durationSec: 30 - durationLeft || 25,
    });
    setSentMessage(true);
    Alert.alert(t('quick30sTitle'), t('sentBedtimeSuccess'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#0F172A" weight="800">
          {t('parentDashboardTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#475569" style={{ marginTop: 2 }}>
          {member?.name || 'Mẹ Hoa'} • {t('parentSubtitle')}
        </AccessibleText>
      </View>

      {/* Daily Timeline */}
      <View style={styles.card}>
        <AccessibleText variant="h2" weight="800" color="#1E293B">
          📅 {t('timelineTitle')}
        </AccessibleText>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">☀️</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#854D0E">
              {t('morningTitle')} ({state.morningTime || '06:45'})
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              {t('morningAlreadyDone')}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">🎒</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#9A3412">
              {t('afternoonTitle')} ({state.afternoonTime || '16:40'})
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              {state.afternoonMood === 'JOYFUL'
                ? `😄 ${t('moodJoyful')}`
                : state.afternoonMood === 'CALM'
                ? `⛅ ${t('moodCalm')}`
                : state.afternoonMood === 'TIRED'
                ? `🌧️ ${t('moodTired')}`
                : `🫂 ${t('moodNeedHug')}`}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">🌙</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#3730A3">
              {t('eveningTitle')} ({t('eveningTimeWindow')})
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              {sentMessage ? t('sentBedtimeSuccess') : t('eveningSubtitle')}
            </AccessibleText>
          </View>
        </View>
      </View>

      {/* AI EMPATHY ASSISTANT */}
      <View style={[styles.card, styles.aiCard]}>
        <View style={styles.aiHeader}>
          <AccessibleText variant="h2" weight="800" color="#166534">
            🤖 {t('aiAssistantTitle')}
          </AccessibleText>
          <View style={styles.sdgTag}>
            <AccessibleText variant="label" color="#15803D" weight="700">
              SDG 3 & 4
            </AccessibleText>
          </View>
        </View>

        <AccessibleText variant="bodyRegular" color="#14532D" weight="600" style={styles.aiExplanation}>
          💡 {t('aiAssistantDesc')}
        </AccessibleText>

        <View style={styles.summaryBox}>
          <AccessibleText variant="bodyLarge" color="#1F2937">
            {aiData?.summary || 'Bé An có một ngày vui vẻ tại trường, được cô giáo khen và ăn cơm ngon cùng bà.'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h2" weight="700" color="#14532D" style={{ marginTop: 14 }}>
          {t('aiPromptPick')}
        </AccessibleText>

        {aiData?.suggestedPrompts.map((prompt, index) => (
          <EmpathyPromptCard
            key={index}
            index={index}
            prompt={prompt}
            isSelected={selectedPrompt === prompt}
            onSelectPrompt={(p) => setSelectedPrompt(p)}
          />
        ))}
      </View>

      {/* QUICK 30s VOICE RESPONSE */}
      <View style={styles.card}>
        <AccessibleText variant="h2" weight="800" color="#1E1B4B">
          🎙️ {t('quick30sTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#475569" style={{ marginTop: 4 }}>
          {t('quick30sDesc')}
        </AccessibleText>

        <AudioWaveform
          isRecording={isRecording30s}
          durationLeft={durationLeft}
        />

        {!isRecording30s ? (
          <BigButton
            title={sentMessage ? t('quick30sRecordBtn') : t('quick30sRecordBtn')}
            subtitle="30s empathy audio"
            icon="🎙️"
            variant="evening"
            size="hero"
            onPress={handleStartRecording}
          />
        ) : (
          <BigButton
            title={t('quick30sSendBtn')}
            subtitle={`${t('recordingTimeLeft')}: ${durationLeft}s`}
            icon="📤"
            variant="success"
            size="hero"
            onPress={handleSendBedtimeVoice}
          />
        )}
      </View>

      {/* Switch role demo button */}
      <View style={styles.footer}>
        <BigButton
          title={t('switchRoleBtn')}
          icon="🔄"
          variant="secondary"
          onPress={onNavigateToSwitch}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: THEME.colors.background,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'flex-start',
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  aiCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sdgTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  aiExplanation: {
    marginVertical: 8,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginVertical: 6,
  },
  footer: {
    marginTop: 16,
  },
});
