import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface ChildHomeScreenProps {
  onNavigateToMorning: () => void;
  onNavigateToAfternoon: () => void;
  onNavigateToEvening: () => void;
  onNavigateToSwitch: () => void;
}

export const ChildHomeScreen: React.FC<ChildHomeScreenProps> = ({
  onNavigateToMorning,
  onNavigateToAfternoon,
  onNavigateToEvening,
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state } = useRhythm();
  const { t, activeLanguage, setLanguagePreference } = useLanguage();

  const isVi = activeLanguage === 'vi';
  const isGrandparent = member?.role === 'GRANDPARENT';

  const completedCount =
    (state.morningCompleted ? 1 : 0) +
    (state.afternoonCompleted ? 1 : 0) +
    (state.eveningListened ? 1 : 0);

  const toggleQuickLang = () => {
    setLanguagePreference(activeLanguage === 'vi' ? 'en' : 'vi');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* M3 Expressive Family Hearth Header */}
      <View style={[styles.hearthCard, THEME.shadows.expressive]}>
        <View style={styles.hearthTopRow}>
          <View style={styles.avatarBadge}>
            <AccessibleText variant="h1">
              {isGrandparent ? '👵' : '🧒'}
            </AccessibleText>
          </View>

          <View style={styles.familyTitleCol}>
            <View style={styles.roleTagRow}>
              <View style={styles.roleChip}>
                <AccessibleText variant="caption" color="#92400E" weight="800">
                  {isGrandparent
                    ? isVi
                      ? 'CHẾ ĐỘ ÔNG BÀ CỠ CHỮ LỚN'
                      : 'ELDER ACCESSIBLE MODE'
                    : isVi
                    ? 'HỆ SINH THÁI "BƯỚC CHÂN NHỎ"'
                    : '"LITTLE FOOTSTEPS" ECOSYSTEM'}
                </AccessibleText>
              </View>
            </View>
            <AccessibleText variant="h2" weight="900" color="#3B1800" numberOfLines={1}>
              {family?.name || t('appName')}
            </AccessibleText>
            <AccessibleText variant="label" color="#78350F" weight="600">
              {member?.name || 'Bé An'} • {family?.addressProvince || 'Đồng Tháp'} ({family?.code || 'NHIP-8868'})
            </AccessibleText>
          </View>

          <TouchableOpacity
            onPress={toggleQuickLang}
            style={styles.langPill}
            accessibilityRole="button"
            accessibilityLabel="Switch language"
          >
            <AccessibleText variant="label" weight="800" color="#78350F">
              {isVi ? '🇻🇳 VI' : '🇬🇧 EN'}
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Connection Bridge Visual between Rural Home & Migrant Parents */}
        <View style={styles.bridgeBox}>
          <View style={styles.bridgeNode}>
            <AccessibleText variant="bodyLarge">🏡</AccessibleText>
            <AccessibleText variant="caption" color="#451A03" weight="800">
              {isVi ? 'Quê nhà' : 'Home'}
            </AccessibleText>
          </View>

          <View style={styles.bridgeTrack}>
            <View style={styles.bridgeDotsRow}>
              <View
                style={[
                  styles.rhythmDot,
                  state.morningCompleted ? styles.dotMorningDone : styles.dotPending,
                ]}
              >
                <AccessibleText variant="caption">☀️</AccessibleText>
              </View>
              <View style={styles.bridgeLine} />
              <View
                style={[
                  styles.rhythmDot,
                  state.afternoonCompleted ? styles.dotAfternoonDone : styles.dotPending,
                ]}
              >
                <AccessibleText variant="caption">🎒</AccessibleText>
              </View>
              <View style={styles.bridgeLine} />
              <View
                style={[
                  styles.rhythmDot,
                  state.eveningListened ? styles.dotEveningDone : styles.dotPending,
                ]}
              >
                <AccessibleText variant="caption">🌙</AccessibleText>
              </View>
            </View>
            <AccessibleText variant="caption" color="#78350F" center weight="700" style={{ marginTop: 4 }}>
              {isVi
                ? `Hộp thư thoại: Đã kết nối ${completedCount}/3 nhịp hôm nay`
                : `Voice Mailbox: ${completedCount}/3 rhythms connected today`}
            </AccessibleText>
          </View>

          <View style={styles.bridgeNode}>
            <AccessibleText variant="bodyLarge">👩‍🏭</AccessibleText>
            <AccessibleText variant="caption" color="#451A03" weight="800">
              {isVi ? 'Bố Mẹ' : 'Parents'}
            </AccessibleText>
          </View>
        </View>

        {state.pendingOfflineCount > 0 && (
          <View style={styles.offlineBanner}>
            <AccessibleText variant="label" color="#92400E" weight="800">
              ⚡ {t('offlinePendingBadge')}: {state.pendingOfflineCount}
            </AccessibleText>
          </View>
        )}
      </View>

      {/* Section Heading */}
      <View style={styles.sectionHeader}>
        <AccessibleText variant="h1" weight="900" color={THEME.colors.textDark}>
          {t('threeRhythmsTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color={THEME.colors.textSecondary} style={{ marginTop: 3 }}>
          {t('threeRhythmsDesc')}
        </AccessibleText>
      </View>

      {/* RHYTHM 1: NHỊP SÁNG (06:30 - 07:15 | Tiếng chuông buổi sáng & Hộp thư thoại 1 chạm) */}
      <View style={[styles.rhythmCard, styles.morningCard, THEME.shadows.card]}>
        <View style={styles.cardTopRow}>
          <View style={styles.stepPillMorning}>
            <AccessibleText variant="caption" color="#92400E" weight="900">
              {isVi ? 'NHỊP 1 • HỘP THƯ THOẠI 1 CHẠM' : 'RHYTHM 1 • 1-TOUCH VOICE MAILBOX'}
            </AccessibleText>
          </View>
          {state.morningCompleted ? (
            <View style={styles.doneBadge}>
              <AccessibleText variant="caption" color="#15803D" weight="800">
                {t('morningAlreadyDone')} ({state.morningTime || '06:45'})
              </AccessibleText>
            </View>
          ) : (
            <View style={styles.timeBadgeMorning}>
              <AccessibleText variant="caption" color="#92400E" weight="800">
                ⏰ {t('morningTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>

        <View style={styles.cardTitleRow}>
          <View style={styles.bigEmojiBubbleMorning}>
            <AccessibleText variant="hero">☀️</AccessibleText>
          </View>
          <View style={styles.cardTitleTextCol}>
            <AccessibleText variant="h1" color="#451A03" weight="900">
              {t('morningTitle')}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#78350F" weight="600">
              {t('morningSubtitle')}
            </AccessibleText>
          </View>
        </View>

        <BigButton
          title={state.morningCompleted ? t('morningAlreadyDone') : t('morningButtonPrompt')}
          subtitle={
            state.morningCompleted
              ? isVi
                ? 'Nghe lại "Tiếng chuông buổi sáng" & lời chúc hẹn giờ của bố mẹ'
                : 'Replay Parents’ Scheduled Morning Bell & greeting'
              : t('morningQuote')
          }
          icon={state.morningCompleted ? '🔔' : '🌅'}
          variant={state.morningCompleted ? 'success' : 'morning'}
          size="hero"
          onPress={onNavigateToMorning}
        />
      </View>

      {/* RHYTHM 2: NHỊP CHIỀU (17:00 - 18:30 | Nhật ký tương tác 15s: Cảm xúc + Voice + Ảnh/Vẽ) */}
      <View style={[styles.rhythmCard, styles.afternoonCard, THEME.shadows.card]}>
        <View style={styles.cardTopRow}>
          <View style={styles.stepPillAfternoon}>
            <AccessibleText variant="caption" color="#9A3412" weight="900">
              {isVi ? 'NHỊP 2 • NHẬT KÝ TƯƠNG TÁC 15 GIÂY' : 'RHYTHM 2 • 15S INTERACTIVE DIARY'}
            </AccessibleText>
          </View>
          {state.afternoonCompleted ? (
            <View style={styles.doneBadge}>
              <AccessibleText variant="caption" color="#15803D" weight="800">
                ✓ {isVi ? 'Đã gửi' : 'Sent'} ({state.afternoonTime})
              </AccessibleText>
            </View>
          ) : (
            <View style={styles.timeBadgeAfternoon}>
              <AccessibleText variant="caption" color="#9A3412" weight="800">
                ⏰ {t('afternoonTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>

        <View style={styles.cardTitleRow}>
          <View style={styles.bigEmojiBubbleAfternoon}>
            <AccessibleText variant="hero">🎒</AccessibleText>
          </View>
          <View style={styles.cardTitleTextCol}>
            <AccessibleText variant="h1" color="#431407" weight="900">
              {t('afternoonTitle')}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#9A3412" weight="600">
              {t('afternoonSubtitle')}
            </AccessibleText>
          </View>
        </View>

        {/* Emotion & Doodle Preview Strip */}
        <View style={styles.moodPreviewStrip}>
          <AccessibleText variant="label" color="#7C2D12" weight="700">
            {isVi
              ? '✨ Điểm danh cảm xúc (😄 ⛅ 🌧️ 🫂) + Ghi âm 15s + Chụp ảnh / Nét vẽ tay'
              : '✨ Emotion check-in (😄 ⛅ 🌧️ 🫂) + 15s Voice + Quick Photo / Doodle'}
          </AccessibleText>
        </View>

        <BigButton
          title={
            state.afternoonCompleted
              ? t('afternoonRecordAgain')
              : isVi
              ? 'MỞ NHẬT KÝ TƯƠNG TÁC 15 GIÂY'
              : 'OPEN 15S INTERACTIVE DIARY'
          }
          subtitle={
            isVi
              ? 'Kênh an toàn: Tự nguyện, nhẹ nhàng, không sợ bị phán xét'
              : 'Safe channel: Voluntary, gentle, judgment-free'
          }
          icon="🎨"
          variant="afternoon"
          size="hero"
          onPress={onNavigateToAfternoon}
        />
      </View>

      {/* RHYTHM 3: NHỊP TỐI & CUỐI TUẦN (20:30 - 21:00 | Hộp thư thoại tối & Tâm sự) */}
      <View style={[styles.rhythmCard, styles.eveningCard, THEME.shadows.card]}>
        <View style={styles.cardTopRow}>
          <View style={styles.stepPillEvening}>
            <AccessibleText variant="caption" color="#3730A3" weight="900">
              {isVi ? 'NHỊP 3 • HỘP THƯ THOẠI TỐI' : 'RHYTHM 3 • EVENING MAILBOX'}
            </AccessibleText>
          </View>
          {state.eveningListened ? (
            <View style={styles.doneBadge}>
              <AccessibleText variant="caption" color="#15803D" weight="800">
                {t('eveningListenedBadge')}
              </AccessibleText>
            </View>
          ) : (
            <View style={styles.timeBadgeEvening}>
              <AccessibleText variant="caption" color="#3730A3" weight="800">
                ⏰ {t('eveningTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>

        <View style={styles.cardTitleRow}>
          <View style={styles.bigEmojiBubbleEvening}>
            <AccessibleText variant="hero">🌙</AccessibleText>
          </View>
          <View style={styles.cardTitleTextCol}>
            <AccessibleText variant="h1" color="#1E1B4B" weight="900">
              {t('eveningTitle')}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#3730A3" weight="600">
              {t('eveningSubtitle')}
            </AccessibleText>
          </View>
        </View>

        <BigButton
          title={t('eveningPlayBtn')}
          subtitle={
            isVi
              ? 'Xem thông điệp yêu thương & gửi tâm sự thêm trước giờ ngủ'
              : 'Listen to loving notes & share extra bedtime thoughts'
          }
          icon="🎧"
          variant="evening"
          size="hero"
          onPress={onNavigateToEvening}
        />
      </View>

      {/* Multi-Age Role & Settings Switcher Bar */}
      <View style={styles.footer}>
        <BigButton
          title={t('switchRoleBtn')}
          subtitle={
            isVi
              ? 'Đổi sang vai Cha Mẹ đi làm xa, Ông Bà hoặc đổi Ngôn ngữ (VI/EN)'
              : 'Switch between Migrant Parent, Grandparent & Language (VI/EN)'
          }
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 44,
    backgroundColor: THEME.colors.background,
  },
  hearthCard: {
    backgroundColor: '#FFF8EB',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FCD34D',
    marginBottom: 18,
  },
  hearthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  familyTitleCol: {
    flex: 1,
  },
  roleTagRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  roleChip: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  langPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 6,
  },
  bridgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  bridgeNode: {
    alignItems: 'center',
    width: 58,
  },
  bridgeTrack: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  bridgeDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  rhythmDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  dotPending: {
    backgroundColor: '#F8F2EA',
    borderColor: '#D8C2B9',
  },
  dotMorningDone: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  dotAfternoonDone: {
    backgroundColor: '#FFEDD5',
    borderColor: '#EA580C',
  },
  dotEveningDone: {
    backgroundColor: '#E0E7FF',
    borderColor: '#4F46E5',
  },
  bridgeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#FCD34D',
    marginHorizontal: 4,
    borderRadius: 2,
  },
  offlineBanner: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  rhythmCard: {
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 18,
    marginVertical: 9,
    borderWidth: 2,
  },
  morningCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FCD34D',
  },
  afternoonCard: {
    backgroundColor: '#FFF9F5',
    borderColor: '#FDBA74',
  },
  eveningCard: {
    backgroundColor: '#F8FAFF',
    borderColor: '#A5B4FC',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  stepPillMorning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepPillAfternoon: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepPillEvening: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  timeBadgeMorning: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeBadgeAfternoon: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeBadgeEvening: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigEmojiBubbleMorning: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  bigEmojiBubbleAfternoon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  bigEmojiBubbleEvening: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  cardTitleTextCol: {
    flex: 1,
  },
  moodPreviewStrip: {
    backgroundColor: '#FFF1E6',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  footer: {
    marginTop: 14,
  },
});
