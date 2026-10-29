import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
  CREATIVE_ATTACHMENTS,
  type CreativeAttachment,
  type MoodType,
} from '@nhipnha/shared';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissions';
import { EmotionSelector } from '../components/EmotionSelector';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { offlineStorage } from '../services/offlineStorage';

interface AfternoonTouchScreenProps {
  onBack: () => void;
}

export const AfternoonTouchScreen: React.FC<AfternoonTouchScreenProps> = ({ onBack }) => {
  const { state, submitAfternoonTouch } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const { colors } = useTheme();
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

  const handleStartRecording = async () => {
    const granted = await permissionService.requestPermission('microphone', isVi);
    if (!granted) return;

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

  const handleSelectAttachment = async (item: CreativeAttachment) => {
    if (item.type === 'PHOTO') {
      const granted = await permissionService.requestPermission('camera', isVi);
      if (!granted) return;
    }
    setSelectedAttachment(item);
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
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backPill, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <AccessibleText variant="label" weight="800">
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={[styles.windowBadge, { backgroundColor: colors.afternoonContainer }]}>
          <AccessibleText variant="caption" color={colors.onAfternoonContainer} weight="800">
            17:00 – 18:30
          </AccessibleText>
        </View>
      </View>

      {/* Editorial Header */}
      <View style={styles.header}>
        <AccessibleText variant="display" weight="900">
          {t('afternoonTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('afternoonSubtitle')}
        </AccessibleText>
      </View>

      {/* M3 Expressive Grouped Asymmetric Stack */}
      <View style={styles.groupedStack}>
        {/* STEP 1: Mood */}
        <View
          style={[
            styles.stackTop,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {t('afternoonStep1')}
          </AccessibleText>

          <EmotionSelector
            selectedMood={selectedMood}
            onSelectMood={(mood) => setSelectedMood(mood)}
          />
        </View>

        {/* STEP 2: 15s Voice */}
        <View
          style={[
            styles.stackMiddle,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
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
                    ? `Đã lưu (${recordedVoice.duration}s)`
                    : `Saved (${recordedVoice.duration}s)`
                  : isVi
                  ? 'Kể chuyện vui ở lớp hoặc món ngon bà nấu'
                  : 'Share a story from class or dinner with grandma'
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

        {/* STEP 3: Doodle / Photo */}
        <View
          style={[
            styles.stackBottom,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {t('afternoonStep3')}
          </AccessibleText>

          <View style={styles.creativeGrid}>
            {CREATIVE_ATTACHMENTS.map((item) => {
              const isSelected = selectedAttachment.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectAttachment(item)}
                  style={[
                    styles.creativeCard,
                    {
                      backgroundColor: isSelected
                        ? colors.afternoonContainer
                        : colors.surfaceContainerHigh,
                      borderRadius: isSelected ? 30 : 20,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.creativeTopRow}>
                    <AccessibleText variant="h1">{item.emoji}</AccessibleText>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.dominantColor },
                      ]}
                    />
                  </View>

                  <AccessibleText
                    variant="bodyRegular"
                    weight="800"
                    color={isSelected ? colors.onAfternoonContainer : colors.textDark}
                    style={{ marginTop: 8 }}
                  >
                    {isVi ? item.titleVi : item.titleEn}
                  </AccessibleText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Submit */}
      <View style={{ marginTop: 14 }}>
        <BigButton
          title={t('afternoonSubmit')}
          subtitle={t('offlineSavedMsg')}
          icon="💌"
          variant="success"
          size="hero"
          loading={saving}
          onPress={handleSaveAfternoonRhythm}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 38,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  windowBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  header: {
    marginBottom: 16,
  },
  groupedStack: {
    gap: 6,
  },
  stackTop: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 20,
  },
  stackMiddle: {
    borderRadius: 14,
    padding: 20,
  },
  stackBottom: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    padding: 20,
  },
  creativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  creativeCard: {
    width: '48.2%',
    padding: 14,
    marginBottom: 10,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  creativeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
});
