import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  CREATIVE_ATTACHMENTS,
  type CreativeAttachment,
  type MoodType,
} from '@nhipnha/shared';
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
  const { t, activeLanguage } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<MoodType>(state.afternoonMood || 'JOYFUL');
  const [selectedAttachment, setSelectedAttachment] = useState<CreativeAttachment>(
    state.afternoonAttachment || CREATIVE_ATTACHMENTS[0]
  );
  const [isRecording, setIsRecording] = useState(false);
  const [durationLeft, setDurationLeft] = useState(15);
  const [recordedVoice, setRecordedVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const isVi = activeLanguage === 'vi';

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
      await submitAfternoonTouch(selectedMood, recordedVoice || undefined, selectedAttachment);
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backPill}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <AccessibleText variant="bodyLarge" weight="800" color="#9A3412">
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={styles.windowBadge}>
          <AccessibleText variant="label" color="#9A3412" weight="800">
            ⏰ {t('afternoonTimeWindow')}
          </AccessibleText>
        </View>
      </View>

      {/* Hero Title */}
      <View style={styles.header}>
        <AccessibleText variant="display" color="#9A3412" weight="900" center>
          {t('afternoonTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#7C2D12" center style={{ marginTop: 4 }}>
          {t('afternoonSubtitle')}
        </AccessibleText>

        <View style={styles.safeChannelBanner}>
          <AccessibleText variant="label" color="#166534" weight="800" center>
            {t('afternoonSafeChannelBadge')}
          </AccessibleText>
        </View>
      </View>

      {/* STEP 1: Mood Selector */}
      <View style={[styles.sectionCard, THEME.shadows.card]}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadge}>
            <AccessibleText variant="caption" color="#FFFFFF" weight="900">
              {isVi ? 'BƯỚC 1 / 3' : 'STEP 1 / 3'}
            </AccessibleText>
          </View>
          <AccessibleText variant="caption" color="#9A3412" weight="700">
            {isVi ? 'Tự nguyện & Nhẹ nhàng' : 'Voluntary & Gentle'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h2" weight="900" color="#431407" style={{ marginTop: 6 }}>
          {t('afternoonStep1')}
        </AccessibleText>

        <EmotionSelector
          selectedMood={selectedMood}
          onSelectMood={(mood) => setSelectedMood(mood)}
        />
      </View>

      {/* STEP 2: 15s Voice Message with countdown and waveform */}
      <View style={[styles.sectionCard, THEME.shadows.card]}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadge}>
            <AccessibleText variant="caption" color="#FFFFFF" weight="900">
              {isVi ? 'BƯỚC 2 / 3' : 'STEP 2 / 3'}
            </AccessibleText>
          </View>
          <AccessibleText variant="caption" color="#9A3412" weight="700">
            {isVi ? 'NLP giọng nói tiếng Việt' : 'Vietnamese Voice NLP'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h2" weight="900" color="#431407" style={{ marginTop: 6 }}>
          {t('afternoonStep2')}
        </AccessibleText>

        <AudioWaveform
          isRecording={isRecording}
          durationLeft={durationLeft}
          maxDuration={15}
          waveform={recordedVoice?.waveform}
        />

        {!isRecording ? (
          <BigButton
            title={recordedVoice ? t('afternoonRecordAgain') : t('afternoonRecordBtn')}
            subtitle={
              recordedVoice
                ? isVi
                  ? `Đã lưu giọng nói (${recordedVoice.duration}s) • Bấm nếu muốn thu lại`
                  : `Saved voice note (${recordedVoice.duration}s) • Tap to re-record`
                : isVi
                ? 'Kể chuyện vui ở lớp hoặc món ngon bà nấu'
                : 'Share a happy story from class or dinner with grandma'
            }
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

      {/* STEP 3: Quick Photo or Hand-drawn Doodle (Section 5.1 & 5.3 Computer Vision) */}
      <View style={[styles.sectionCard, THEME.shadows.card]}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadge}>
            <AccessibleText variant="caption" color="#FFFFFF" weight="900">
              {isVi ? 'BƯỚC 3 / 3' : 'STEP 3 / 3'}
            </AccessibleText>
          </View>
          <AccessibleText variant="caption" color="#9A3412" weight="700">
            {isVi ? 'Nét vẽ tay / Ảnh chụp nhanh' : 'Quick Doodle / Photo'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h2" weight="900" color="#431407" style={{ marginTop: 6 }}>
          {t('afternoonStep3')}
        </AccessibleText>

        <View style={styles.creativeGrid}>
          {CREATIVE_ATTACHMENTS.map((item) => {
            const isSelected = selectedAttachment.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => setSelectedAttachment(item)}
                style={[
                  styles.creativeCard,
                  {
                    backgroundColor: isSelected ? '#FFF7ED' : '#FAF6F0',
                    borderColor: isSelected ? '#EA580C' : '#E6DFD7',
                    borderWidth: isSelected ? 3 : 2,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.creativeTopRow}>
                  <View
                    style={[
                      styles.creativeEmojiBox,
                      { backgroundColor: isSelected ? '#FFEDD5' : '#FFFFFF' },
                    ]}
                  >
                    <AccessibleText variant="h1">{item.emoji}</AccessibleText>
                  </View>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.dominantColor },
                    ]}
                  />
                </View>

                <AccessibleText variant="bodyRegular" weight="800" color="#431407" style={{ marginTop: 6 }}>
                  {isVi ? item.titleVi : item.titleEn}
                </AccessibleText>

                <View style={styles.typeChip}>
                  <AccessibleText variant="caption" color="#9A3412" weight="800">
                    {item.type === 'DOODLE'
                      ? isVi
                        ? '🎨 Nét vẽ tay'
                        : '🎨 Doodle'
                      : isVi
                      ? '📷 Ảnh chụp'
                      : '📷 Photo'}
                  </AccessibleText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SUBMIT */}
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
          title={t('backHome')}
          icon="🏠"
          variant="secondary"
          onPress={onBack}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 42,
    backgroundColor: THEME.colors.background,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FB923C',
  },
  windowBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  header: {
    marginBottom: 14,
    alignItems: 'center',
  },
  safeChannelBanner: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 18,
    marginVertical: 9,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  creativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  creativeCard: {
    width: '48.2%',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 138,
  },
  creativeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creativeEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  submitSection: {
    marginTop: 10,
  },
});
