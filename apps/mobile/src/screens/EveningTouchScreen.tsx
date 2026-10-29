import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface EveningTouchScreenProps {
  onBack: () => void;
}

export const EveningTouchScreen: React.FC<EveningTouchScreenProps> = ({ onBack }) => {
  const { state, markEveningListened, submitEveningExtraReply } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sendingExtra, setSendingExtra] = useState(false);

  const isVi = activeLanguage === 'vi';

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      markEveningListened();
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000);
    } else {
      setIsPlaying(false);
    }
  };

  const handleExtraReply = async () => {
    setSendingExtra(true);
    try {
      await submitEveningExtraReply();
      Alert.alert(t('eveningTitle'), t('eveningExtraReplySent'));
    } finally {
      setSendingExtra(false);
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
          <AccessibleText variant="bodyLarge" weight="800" color="#312E81">
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={styles.windowBadge}>
          <AccessibleText variant="label" color="#3730A3" weight="800">
            🌙 {t('eveningTimeWindow')}
          </AccessibleText>
        </View>
      </View>

      {/* Hero Title */}
      <View style={styles.header}>
        <AccessibleText variant="display" color="#1E1B4B" weight="900" center>
          {t('eveningTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#3730A3" center style={{ marginTop: 4 }}>
          {t('eveningSubtitle')}
        </AccessibleText>
      </View>

      {/* Starry Lullaby Voice Mailbox Card */}
      <View style={[styles.card, THEME.shadows.expressive]}>
        {/* Sender Profile Banner */}
        <View style={styles.parentHeader}>
          <View style={styles.motherAvatar}>
            <AccessibleText variant="hero">👩‍🏭</AccessibleText>
          </View>
          <View style={styles.parentInfoCol}>
            <View style={styles.fromBadge}>
              <AccessibleText variant="caption" color="#4338CA" weight="800">
                {isVi ? 'HỘP THƯ THOẠI BẤT ĐỒNG BỘ' : 'ASYNC VOICE MAILBOX'}
              </AccessibleText>
            </View>
            <AccessibleText variant="h2" weight="900" color="#1E1B4B">
              Mẹ Hoa → Bé An & Bà Nội
            </AccessibleText>
            <AccessibleText variant="label" color="#4F46E5">
              {state.eveningListened
                ? t('eveningListenedBadge')
                : isVi
                ? 'Lời chúc ngủ ngon • 25 giây'
                : 'Bedtime voice note • 25s'}
            </AccessibleText>
          </View>
        </View>

        <AudioWaveform
          isRecording={false}
          isPlaying={isPlaying}
          waveform={[30, 48, 65, 88, 94, 72, 54, 42, 68, 82, 55, 36, 62, 76, 44, 28]}
        />

        <BigButton
          title={isPlaying ? t('eveningPauseBtn') : t('eveningPlayBtn')}
          subtitle={
            isPlaying
              ? isVi
                ? 'Đang phát giọng nói ấm áp của mẹ...'
                : "Playing mother's loving voice..."
              : t('eveningSubtitle')
          }
          icon={isPlaying ? '⏸️' : '▶️'}
          variant="evening"
          size="hero"
          onPress={togglePlayback}
        />

        {/* Large Readable Transcription for Grandparent & Child */}
        <View style={styles.transcriptionBox}>
          <View style={styles.transcriptionHeader}>
            <AccessibleText variant="bodyLarge" weight="800" color="#312E81">
              📜 {t('eveningMotherNote')}
            </AccessibleText>
            <AccessibleText variant="caption" color="#4F46E5" weight="700">
              {isVi ? 'NLP Tiếng Việt' : 'Vietnamese NLP'}
            </AccessibleText>
          </View>
          <AccessibleText
            variant="h2"
            weight="800"
            color="#1E1B4B"
            style={{ marginTop: 8, lineHeight: 32 }}
          >
            “{state.eveningMessageText}”
          </AccessibleText>
        </View>

        {/* Optional Extra Bedtime Reply via Async Voice Mailbox (Section 5.2) */}
        <View style={styles.extraReplyBox}>
          <AccessibleText variant="bodyLarge" weight="800" color="#1E1B4B" style={{ marginBottom: 8 }}>
            {t('eveningExtraReplyTitle')}
          </AccessibleText>
          <BigButton
            title={state.eveningExtraReplied ? t('eveningExtraReplySent') : t('eveningExtraReplyBtn')}
            subtitle={
              isVi
                ? '“Con chúc bố mẹ ngủ ngon ạ! Con yêu bố mẹ nhiều!”'
                : '“Goodnight Mom & Dad! I love you so much!”'
            }
            icon={state.eveningExtraReplied ? '✅' : '💌'}
            variant={state.eveningExtraReplied ? 'success' : 'secondary'}
            loading={sendingExtra}
            onPress={handleExtraReply}
          />
        </View>

        {/* Bedtime Bonding Value */}
        <View style={styles.bedtimeTip}>
          <AccessibleText variant="h2" style={{ marginRight: 10 }}>
            🍵
          </AccessibleText>
          <View style={{ flex: 1 }}>
            <AccessibleText variant="bodyRegular" color="#065F46" weight="700">
              {t('eveningBedtimeTip')}
            </AccessibleText>
          </View>
        </View>
      </View>

      <BigButton
        title={t('backHome')}
        icon="🏠"
        variant="secondary"
        onPress={onBack}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backPill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#818CF8',
  },
  windowBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 20,
    borderWidth: 2,
    borderColor: '#A5B4FC',
    marginBottom: 18,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    marginBottom: 8,
  },
  motherAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
    marginRight: 12,
  },
  parentInfoCol: {
    flex: 1,
  },
  fromBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3,
  },
  transcriptionBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginVertical: 14,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraReplyBox: {
    backgroundColor: '#F8FAFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    marginBottom: 14,
  },
  bedtimeTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
});
