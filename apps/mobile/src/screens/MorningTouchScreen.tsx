import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { mediaCaptureService } from '../services/mediaCapture';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { AudioWaveform } from '../components/AudioWaveform';

interface MorningTouchScreenProps {
  onBack: () => void;
}

export const MorningTouchScreen: React.FC<MorningTouchScreenProps> = ({ onBack }) => {
  const { state, markMorningBellListened, submitMorningTouch } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [justTouched, setJustTouched] = useState(false);
  const [isPlayingBell, setIsPlayingBell] = useState(false);

  const isVi = activeLanguage === 'vi';
  const isDone = state.morningCompleted || justTouched;

  const handlePlayMorningBell = () => {
    if (!isPlayingBell) {
      setIsPlayingBell(true);
      markMorningBellListened();
      mediaCaptureService.playMorningBellChime(() => {
        setIsPlayingBell(false);
      });
    } else {
      mediaCaptureService.stopAudioPlayback();
      setIsPlayingBell(false);
    }
  };

  const handleTouch = async () => {
    setSubmitting(true);
    try {
      await submitMorningTouch();
      setJustTouched(true);
      Alert.alert(t('morningTitle'), t('morningAlreadyDone'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top App Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backPill, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <MaterialIcons name="arrow-back" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
          <AccessibleText variant="label" weight="800">
            {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={[styles.windowBadge, { backgroundColor: colors.morningContainer }]}>
          <AccessibleText variant="caption" color={colors.onMorningContainer} weight="800">
            06:30 – 07:15
          </AccessibleText>
        </View>
      </View>

      {/* Editorial Title */}
      <View style={styles.header}>
        <AccessibleText variant="display" weight="900">
          {t('morningTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('morningSubtitle')}
        </AccessibleText>
      </View>

      {/* Grouped Stack: Part 1 (Scheduled Morning Bell) + Part 2 (1-Touch Reply) */}
      <View style={styles.groupedStack}>
        <View
          style={[
            styles.stackTop,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <View style={styles.labelRow}>
            <MaterialIcons name="notifications-active" size={18} color={colors.morningPrimary} style={{ marginRight: 6 }} />
            <AccessibleText variant="label" color={colors.morningPrimary} weight="800">
              {t('morningBellTitle')}
            </AccessibleText>
          </View>

          <AccessibleText variant="h2" weight="700" style={{ marginTop: 8 }}>
            {t('morningBellMessage')}
          </AccessibleText>

          <AudioWaveform
            isRecording={false}
            isPlaying={isPlayingBell}
            waveform={[35, 55, 78, 92, 64, 48, 82, 90, 58, 40, 72, 85, 50, 62]}
          />

          <BigButton
            title={isPlayingBell ? t('eveningPauseBtn') : t('morningListenBellBtn')}
            icon={isPlayingBell ? 'pause' : 'volume-up'}
            variant="secondary"
            onPress={handlePlayMorningBell}
          />
        </View>

        <View
          style={[
            styles.stackBottom,
            { backgroundColor: colors.morningSurface },
          ]}
        >
          <AccessibleText
            variant="label"
            color={colors.onMorningContainer}
            weight="800"
          >
            {isVi ? 'PHẢN HỒI 1 CHẠM TRƯỚC KHI ĐI HỌC' : '1-TOUCH REPLY BEFORE SCHOOL'}
          </AccessibleText>

          <AccessibleText
            variant="h1"
            weight="900"
            color={colors.onMorningContainer}
            style={{ marginVertical: 10 }}
          >
            “{t('morningQuote')}”
          </AccessibleText>

          <BigButton
            title={isDone ? t('morningAlreadyDone') : t('morningButtonPrompt')}
            subtitle={
              isDone
                ? isVi
                  ? `Đã gửi lúc ${state.morningTime || '06:45'}`
                  : `Sent at ${state.morningTime || '06:45'}`
                : t('morningAffirmation')
            }
            icon={isDone ? 'check' : 'mic'}
            variant={isDone ? 'success' : 'morning'}
            size="hero"
            loading={submitting}
            onPress={handleTouch}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
    flexGrow: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stackBottom: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    padding: 20,
  },
});
