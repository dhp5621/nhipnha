import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissions';
import { mediaCaptureService } from '../services/mediaCapture';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';

interface EveningTouchScreenProps {
  onBack: () => void;
}

export const EveningTouchScreen: React.FC<EveningTouchScreenProps> = ({ onBack }) => {
  const { state, markEveningListened, submitEveningExtraReply } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sendingExtra, setSendingExtra] = useState(false);

  const isVi = activeLanguage === 'vi';

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      markEveningListened();
      mediaCaptureService.playAudioUrl(state.eveningAudioUrl, () => {
        setIsPlaying(false);
      });
    } else {
      mediaCaptureService.stopAudioPlayback();
      setIsPlaying(false);
    }
  };

  const handleExtraReply = async () => {
    const granted = await permissionService.requestPermission('microphone', isVi);
    if (!granted) return;

    setSendingExtra(true);
    try {
      await submitEveningExtraReply();
      Alert.alert(t('eveningTitle'), t('eveningExtraReplySent'));
    } finally {
      setSendingExtra(false);
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
          <MaterialIcons name="arrow-back" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
          <AccessibleText variant="label" weight="800">
            {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={[styles.windowBadge, { backgroundColor: colors.eveningContainer }]}>
          <AccessibleText variant="caption" color={colors.onEveningContainer} weight="800">
            20:30 – 21:00
          </AccessibleText>
        </View>
      </View>

      {/* Editorial Header */}
      <View style={styles.header}>
        <AccessibleText variant="display" weight="900">
          {t('eveningTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('eveningSubtitle')}
        </AccessibleText>
      </View>

      {/* M3 Expressive Grouped Asymmetric Stack */}
      <View style={styles.groupedStack}>
        <View
          style={[
            styles.stackTop,
            { backgroundColor: colors.eveningSurface },
          ]}
        >
          <AccessibleText
            variant="label"
            color={colors.onEveningContainer}
            weight="800"
          >
            {t('eveningMotherNote')}
          </AccessibleText>

          <AccessibleText
            variant="h2"
            weight="800"
            color={colors.onEveningContainer}
            style={{ marginVertical: 10 }}
          >
            {state.eveningMessageText
              ? `“${state.eveningMessageText}”`
              : isVi
              ? 'Chưa có tin nhắn thoại tối nay từ bố mẹ.'
              : 'No bedtime voice message from parents yet tonight.'}
          </AccessibleText>

          <AudioWaveform
            isRecording={false}
            isPlaying={isPlaying}
            waveform={[30, 48, 65, 88, 94, 72, 54, 42, 68, 82, 55, 36, 62, 76, 44, 28]}
          />

          <BigButton
            title={isPlaying ? t('eveningPauseBtn') : t('eveningPlayBtn')}
            icon={isPlaying ? 'pause' : 'play-arrow'}
            variant="evening"
            size="hero"
            onPress={togglePlayback}
          />
        </View>

        <View
          style={[
            styles.stackBottom,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800" style={{ marginBottom: 8 }}>
            {t('eveningExtraReplyTitle')}
          </AccessibleText>

          <BigButton
            title={state.eveningExtraReplied ? t('eveningExtraReplySent') : t('eveningExtraReplyBtn')}
            subtitle={
              isVi
                ? '“Con chúc bố mẹ ngủ ngon ạ!”'
                : '“Goodnight Mom & Dad!”'
            }
            icon={state.eveningExtraReplied ? 'check' : 'mic'}
            variant={state.eveningExtraReplied ? 'success' : 'secondary'}
            loading={sendingExtra}
            onPress={handleExtraReply}
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
    paddingBottom: 38,
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
  stackBottom: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    padding: 20,
  },
});
