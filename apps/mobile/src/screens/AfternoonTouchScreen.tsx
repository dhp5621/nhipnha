import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import type { MoodType } from '@nhipnha/shared';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { EmotionSelector } from '../components/EmotionSelector';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { offlineStorage } from '../services/offlineStorage';
import { THEME } from '../constants/theme';

interface AfternoonTouchScreenProps {
  onBack: () => void;
}

export const AfternoonTouchScreen: React.FC<AfternoonTouchScreenProps> = ({ onBack }) => {
  const { state, submitAfternoonTouch } = useRhythm();
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<MoodType>(state.afternoonMood || 'JOYFUL');
  const [isRecording, setIsRecording] = useState(false);
  const [durationLeft, setDurationLeft] = useState(15);
  const [recordedVoice, setRecordedVoice] = useState<{ url: string; duration: number; waveform: number[] } | null>(null);
  const [saving, setSaving] = useState(false);

  // 15-second countdown timer during recording
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording && durationLeft > 0) {
      timer = setInterval(() => {
        setDurationLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, durationLeft]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setDurationLeft(15);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const mockAudio = await offlineStorage.recordMockVoice(15 - durationLeft || 14);
    setRecordedVoice({
      url: mockAudio.voiceUrl,
      duration: mockAudio.durationSec,
      waveform: mockAudio.waveform,
    });
  };

  const handleSaveAfternoonRhythm = async () => {
    setSaving(true);
    try {
      await submitAfternoonTouch(selectedMood, recordedVoice || undefined);
      Alert.alert(t('afternoonTitle'), t('offlineSavedMsg'));
      onBack();
    } catch {
      Alert.alert(t('afternoonTitle'), t('offlineSavedMsg'));
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#C2410C" weight="800" center>
          🎒 {t('afternoonTitle')}: {t('afternoonSubtitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 4 }}>
          {t('afternoonTimeWindow')}
        </AccessibleText>
      </View>

      {/* Step 1: Mood */}
      <View style={styles.sectionCard}>
        <AccessibleText variant="h2" weight="800" color="#7C2D12">
          {t('afternoonStep1')}
        </AccessibleText>

        <EmotionSelector
          selectedMood={selectedMood}
          onSelectMood={(mood) => setSelectedMood(mood)}
        />
      </View>

      {/* Step 2: 15s Voice Message with countdown and waveform */}
      <View style={styles.sectionCard}>
        <AccessibleText variant="h2" weight="800" color="#7C2D12">
          {t('afternoonStep2')}
        </AccessibleText>

        <AudioWaveform
          isRecording={isRecording}
          durationLeft={durationLeft}
          waveform={recordedVoice?.waveform}
        />

        {!isRecording ? (
          <BigButton
            title={recordedVoice ? t('afternoonRecordAgain') : t('afternoonRecordBtn')}
            subtitle="15s audio memo"
            icon="🎙️"
            variant="afternoon"
            size="hero"
            onPress={handleStartRecording}
          />
        ) : (
          <BigButton
            title={t('afternoonStopBtn')}
            subtitle={`${t('recordingTimeLeft')}: ${durationLeft}s`}
            icon="⏹️"
            variant="primary"
            size="hero"
            onPress={handleStopRecording}
          />
        )}
      </View>

      {/* Step 3: Offline-first submit */}
      <View style={styles.submitSection}>
        <BigButton
          title={t('afternoonSubmit')}
          subtitle={t('offlineSavedMsg')}
          icon="💌"
          variant="success"
          size="hero"
          loading={saving}
          onPress={handleSaveAfternoonRhythm}
        />

        <BigButton
          title={t('back')}
          variant="secondary"
          onPress={onBack}
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  submitSection: {
    marginTop: 12,
  },
});
