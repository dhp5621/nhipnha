import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';

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
  const { colors, isDark, toggleTheme } = useTheme();

  const isVi = activeLanguage === 'vi';

  const completedCount =
    (state.morningCompleted ? 1 : 0) +
    (state.afternoonCompleted ? 1 : 0) +
    (state.eveningListened ? 1 : 0);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar: App Icon + Family Name + Quick Theme & Language Toggles */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.miniIcon}
          />
          <View style={{ flex: 1 }}>
            <AccessibleText variant="h2" weight="900" numberOfLines={1}>
              {family?.name || t('appName')}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {member?.name} • {family?.code}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconChip, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <AccessibleText variant="label">{isDark ? '🌙' : '☀️'}</AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLanguagePreference(isVi ? 'en' : 'vi')}
            style={[styles.iconChip, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityRole="button"
            accessibilityLabel="Switch language"
          >
            <AccessibleText variant="caption" weight="900" color={colors.primary}>
              {isVi ? 'VI' : 'EN'}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Editorial Hero Greeting + 3-Rhythm Connection Progress */}
      <View
        style={[
          styles.heroSurface,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.heroHeaderRow}>
          <View style={{ flex: 1 }}>
            <AccessibleText variant="label" color={colors.primary} weight="800">
              {isVi ? 'NHỊP SINH HOẠT HÔM NAY' : "TODAY'S RHYTHM"}
            </AccessibleText>
            <AccessibleText variant="display" weight="900" style={{ marginTop: 2 }}>
              {completedCount}/3 {isVi ? 'Nhịp' : 'Steps'}
            </AccessibleText>
          </View>

          <View style={styles.progressPillsRow}>
            {[
              { done: state.morningCompleted, color: colors.morningYellow },
              { done: state.afternoonCompleted, color: colors.afternoonOrange },
              { done: state.eveningListened, color: colors.eveningPurple },
            ].map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: item.done
                      ? item.color
                      : colors.surfaceContainerHighest,
                    width: item.done ? 34 : 18,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <AccessibleText variant="bodyRegular" color={colors.textSecondary} style={{ marginTop: 8 }}>
          {t('threeRhythmsDesc')}
        </AccessibleText>

        {state.pendingOfflineCount > 0 && (
          <View
            style={[
              styles.offlineChip,
              { backgroundColor: colors.morningContainer },
            ]}
          >
            <AccessibleText variant="caption" color={colors.onMorningContainer} weight="800">
              ⚡ {t('offlinePendingBadge')}: {state.pendingOfflineCount}
            </AccessibleText>
          </View>
        )}
      </View>

      {/* M3 EXPRESSIVE GROUPED ASYMMETRIC CARD STACK FOR THE 3 RHYTHMS */}
      <View style={styles.groupedStack}>
        {/* RHYTHM 1: MORNING (Top card in stack: 36dp top corners, 12dp bottom corners) */}
        <View
          style={[
            styles.stackCardTop,
            { backgroundColor: colors.morningSurface },
          ]}
        >
          <View style={styles.cardMetaRow}>
            <View
              style={[
                styles.timePill,
                { backgroundColor: colors.morningContainer },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onMorningContainer} weight="800">
                06:30 – 07:15
              </AccessibleText>
            </View>
            {state.morningCompleted && (
              <AccessibleText variant="label" color={colors.success} weight="800">
                ✓ {state.morningTime || '06:45'}
              </AccessibleText>
            )}
          </View>

          <AccessibleText
            variant="h1"
            weight="900"
            color={colors.onMorningContainer}
            style={{ marginTop: 8 }}
          >
            {t('morningTitle')}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.onMorningContainer}
            style={{ opacity: 0.85, marginBottom: 10 }}
          >
            {t('morningSubtitle')}
          </AccessibleText>

          <BigButton
            title={state.morningCompleted ? t('morningAlreadyDone') : t('morningButtonPrompt')}
            subtitle={t('morningQuote')}
            icon={state.morningCompleted ? '🔔' : '☀️'}
            variant={state.morningCompleted ? 'success' : 'morning'}
            size="hero"
            onPress={onNavigateToMorning}
          />
        </View>

        {/* RHYTHM 2: AFTERNOON (Middle card in stack: 12dp corners) */}
        <View
          style={[
            styles.stackCardMiddle,
            { backgroundColor: colors.afternoonSurface },
          ]}
        >
          <View style={styles.cardMetaRow}>
            <View
              style={[
                styles.timePill,
                { backgroundColor: colors.afternoonContainer },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onAfternoonContainer} weight="800">
                17:00 – 18:30
              </AccessibleText>
            </View>
            {state.afternoonCompleted && (
              <AccessibleText variant="label" color={colors.success} weight="800">
                ✓ {state.afternoonTime}
              </AccessibleText>
            )}
          </View>

          <AccessibleText
            variant="h1"
            weight="900"
            color={colors.onAfternoonContainer}
            style={{ marginTop: 8 }}
          >
            {t('afternoonTitle')}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.onAfternoonContainer}
            style={{ opacity: 0.85, marginBottom: 10 }}
          >
            {t('afternoonSubtitle')}
          </AccessibleText>

          <BigButton
            title={
              state.afternoonCompleted
                ? t('afternoonRecordAgain')
                : isVi
                ? 'Mở Nhật ký 15 giây'
                : 'Open 15s Flash Diary'
            }
            subtitle={
              isVi
                ? 'Chọn cảm xúc, ghi âm 15s & đính kèm nét vẽ'
                : 'Pick emotion, 15s voice & attach doodle'
            }
            icon="🎨"
            variant="afternoon"
            size="hero"
            onPress={onNavigateToAfternoon}
          />
        </View>

        {/* RHYTHM 3: EVENING (Bottom card in stack: 12dp top corners, 36dp bottom corners) */}
        <View
          style={[
            styles.stackCardBottom,
            { backgroundColor: colors.eveningSurface },
          ]}
        >
          <View style={styles.cardMetaRow}>
            <View
              style={[
                styles.timePill,
                { backgroundColor: colors.eveningContainer },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onEveningContainer} weight="800">
                20:30 – 21:00
              </AccessibleText>
            </View>
            {state.eveningListened && (
              <AccessibleText variant="label" color={colors.success} weight="800">
                {t('eveningListenedBadge')}
              </AccessibleText>
            )}
          </View>

          <AccessibleText
            variant="h1"
            weight="900"
            color={colors.onEveningContainer}
            style={{ marginTop: 8 }}
          >
            {t('eveningTitle')}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.onEveningContainer}
            style={{ opacity: 0.85, marginBottom: 10 }}
          >
            {t('eveningSubtitle')}
          </AccessibleText>

          <BigButton
            title={t('eveningPlayBtn')}
            subtitle={
              state.eveningMessageText
                ? isVi
                  ? 'Có 1 tin nhắn thoại từ bố mẹ'
                  : '1 voice message from parents'
                : isVi
                ? 'Mở hộp thư thoại buổi tối'
                : 'Open evening voice mailbox'
            }
            icon="🌙"
            variant="evening"
            size="hero"
            onPress={onNavigateToEvening}
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    height: 40,
    minWidth: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSurface: {
    borderRadius: 34,
    padding: 22,
    marginBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    height: 12,
    borderRadius: 999,
  },
  offlineChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  groupedStack: {
    gap: 6, // M3 Expressive tight gap between stacked asymmetric containers
  },
  stackCardTop: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 20,
  },
  stackCardMiddle: {
    borderRadius: 14,
    padding: 20,
  },
  stackCardBottom: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    padding: 20,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
