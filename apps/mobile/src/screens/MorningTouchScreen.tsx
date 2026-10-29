import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { AudioWaveform } from '../components/AudioWaveform';
import { THEME } from '../constants/theme';

interface MorningTouchScreenProps {
  onBack: () => void;
}

export const MorningTouchScreen: React.FC<MorningTouchScreenProps> = ({ onBack }) => {
  const { state, markMorningBellListened, submitMorningTouch } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [justTouched, setJustTouched] = useState(false);
  const [isPlayingBell, setIsPlayingBell] = useState(false);

  const isVi = activeLanguage === 'vi';
  const isDone = state.morningCompleted || justTouched;

  const handlePlayMorningBell = () => {
    if (!isPlayingBell) {
      setIsPlayingBell(true);
      markMorningBellListened();
      setTimeout(() => {
        setIsPlayingBell(false);
      }, 4500);
    } else {
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top App Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backPill}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <AccessibleText variant="bodyLarge" weight="800" color="#78350F">
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={styles.windowBadge}>
          <AccessibleText variant="label" color="#92400E" weight="800">
            ⏰ {t('morningTimeWindow')}
          </AccessibleText>
        </View>
      </View>

      {/* Hero Title */}
      <View style={styles.header}>
        <AccessibleText variant="display" color="#78350F" weight="900" center>
          {t('morningTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#92400E" center style={{ marginTop: 4 }}>
          {t('morningSubtitle')}
        </AccessibleText>
      </View>

      {/* PART 1: Parents' Scheduled Morning Bell (Tiếng chuông buổi sáng hẹn giờ) */}
      <View style={[styles.bellCard, THEME.shadows.card]}>
        <View style={styles.bellHeaderRow}>
          <View style={styles.bellIconBubble}>
            <AccessibleText variant="h1">🔔</AccessibleText>
          </View>
          <View style={{ flex: 1 }}>
            <AccessibleText variant="caption" color="#B45309" weight="900">
              {isVi ? 'HỘP THƯ THOẠI BẤT ĐỒNG BỘ • 06:30' : 'ASYNC VOICE MAILBOX • 06:30 AM'}
            </AccessibleText>
            <AccessibleText variant="h2" color="#451A03" weight="900">
              {t('morningBellTitle')}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.bellQuoteBox}>
          <AccessibleText variant="bodyLarge" color="#78350F" weight="700">
            {t('morningBellMessage')}
          </AccessibleText>
        </View>

        <AudioWaveform
          isRecording={false}
          isPlaying={isPlayingBell}
          waveform={[35, 55, 78, 92, 64, 48, 82, 90, 58, 40, 72, 85, 50, 62]}
        />

        <BigButton
          title={isPlayingBell ? t('eveningPauseBtn') : t('morningListenBellBtn')}
          subtitle={
            isVi
              ? 'Xóa bỏ áp lực phải gọi cùng lúc • Nghe bất cứ khi nào con thức dậy'
              : 'No simultaneous call pressure • Listen whenever you wake up'
          }
          icon={isPlayingBell ? '⏸️' : '🔊'}
          variant="secondary"
          onPress={handlePlayMorningBell}
        />
      </View>

      {/* PART 2: Child 1-Touch Morning Voice Reply ("Con chuẩn bị đi học đây ạ!") */}
      <View style={[styles.sunCard, THEME.shadows.expressive]}>
        <View style={styles.sunOrbOuter}>
          <View style={styles.sunOrbInner}>
            <AccessibleText variant="display" center style={styles.sunEmoji}>
              {isDone ? '🌞' : '🌅'}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.quotePill}>
          <AccessibleText variant="caption" color="#B45309" weight="900">
            {isVi ? 'PHẢN HỒI HỘP THƯ THOẠI 1 CHẠM' : '1-TOUCH VOICE MAILBOX REPLY'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h1" weight="900" color="#451A03" center style={{ marginTop: 10 }}>
          “{t('morningQuote')}”
        </AccessibleText>

        {/* Little Independence Checklist ("Bước Chân Nhỏ") */}
        <View style={styles.checklistRow}>
          <View style={styles.checkItem}>
            <AccessibleText variant="h2">🪥</AccessibleText>
            <AccessibleText variant="caption" color="#78350F" weight="800">
              {isVi ? 'Vệ sinh cá nhân' : 'Fresh & clean'}
            </AccessibleText>
          </View>
          <View style={styles.checkItem}>
            <AccessibleText variant="h2">🍚</AccessibleText>
            <AccessibleText variant="caption" color="#78350F" weight="800">
              {isVi ? 'Ăn sáng cùng bà' : 'Breakfast'}
            </AccessibleText>
          </View>
          <View style={styles.checkItem}>
            <AccessibleText variant="h2">🎒</AccessibleText>
            <AccessibleText variant="caption" color="#78350F" weight="800">
              {isVi ? 'Tự giác tới lớp' : 'Off to school'}
            </AccessibleText>
          </View>
        </View>

        <View style={{ width: '100%', marginTop: 12 }}>
          <BigButton
            title={isDone ? t('morningAlreadyDone') : t('morningButtonPrompt')}
            subtitle={
              isDone
                ? isVi
                  ? `Đã gửi vào hộp thư lúc ${state.morningTime || '06:45'} • Bấm để gửi lại`
                  : `Sent to mailbox at ${state.morningTime || '06:45'} • Tap to resend`
                : t('morningQuote')
            }
            icon={isDone ? '✅' : '🎙️'}
            variant={isDone ? 'success' : 'morning'}
            size="hero"
            loading={submitting}
            onPress={handleTouch}
          />
        </View>
      </View>

      {/* Value & Affirmation Card */}
      <View style={[styles.affirmationBox, THEME.shadows.card]}>
        <View style={styles.affirmationHeader}>
          <AccessibleText variant="h2">🌱</AccessibleText>
          <AccessibleText variant="bodyLarge" color="#14532D" weight="800" style={{ marginLeft: 8 }}>
            {isVi ? 'Giá trị kết nối "Bước Chân Nhỏ"' : '"Little Footsteps" Bonding Value'}
          </AccessibleText>
        </View>
        <AccessibleText variant="bodyLarge" color="#166534" weight="600" style={{ marginTop: 6 }}>
          {t('morningAffirmation')}
        </AccessibleText>
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
    paddingHorizontal: 18,
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  windowBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  bellCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  bellHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bellIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  bellQuoteBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  sunCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 22,
    borderWidth: 2.5,
    borderColor: '#FCD34D',
    alignItems: 'center',
    marginBottom: 16,
  },
  sunOrbOuter: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  sunOrbInner: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#FDE047',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunEmoji: {
    fontSize: 42,
  },
  quotePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  checkItem: {
    alignItems: 'center',
    gap: 4,
  },
  affirmationBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: THEME.borderRadius.card,
    padding: 18,
    borderWidth: 2,
    borderColor: '#86EFAC',
    marginBottom: 12,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
