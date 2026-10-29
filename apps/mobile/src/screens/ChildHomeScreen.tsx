import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  const { t, activeLanguage } = useLanguage();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Family Bar */}
      <View style={styles.topBar}>
        <View style={styles.familyInfo}>
          <AccessibleText variant="h2" weight="800" color="#78350F">
            🏠 {family?.name || t('appName')}
          </AccessibleText>
          <AccessibleText variant="bodyRegular" color="#92400E" weight="600">
            {member?.name || 'Bé An'} • Code: {family?.code || 'NHIP-8868'} • {activeLanguage === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}
          </AccessibleText>
        </View>

        {state.pendingOfflineCount > 0 && (
          <View style={styles.offlineBadge}>
            <AccessibleText variant="label" color="#B45309" weight="700">
              ⚡ {t('offlinePendingBadge')} ({state.pendingOfflineCount})
            </AccessibleText>
          </View>
        )}
      </View>

      {/* Hero Greeting */}
      <View style={styles.heroBanner}>
        <AccessibleText variant="h1" weight="800" color="#1E293B">
          {t('threeRhythmsTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" style={{ marginTop: 4 }}>
          {t('threeRhythmsDesc')}
        </AccessibleText>
      </View>

      {/* RHYTHM 1: CHẠM SÁNG */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#B45309">
            ☀️ {t('morningTitle')}
          </AccessibleText>
          {state.morningCompleted ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                {t('morningAlreadyDone')} ({state.morningTime || '06:45'})
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#FEF08A' }]}>
              <AccessibleText variant="label" color="#854D0E" weight="700">
                {t('morningTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          {t('morningSubtitle')}
        </AccessibleText>
        <BigButton
          title={state.morningCompleted ? t('morningAlreadyDone') : t('morningButtonPrompt')}
          subtitle={t('morningSubtitle')}
          icon="☀️"
          variant="morning"
          size="hero"
          onPress={onNavigateToMorning}
        />
      </View>

      {/* RHYTHM 2: CHẠM CHIỀU */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#C2410C">
            🎒 {t('afternoonTitle')}
          </AccessibleText>
          {state.afternoonCompleted ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                ✓ ({state.afternoonTime})
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#FFEDD5' }]}>
              <AccessibleText variant="label" color="#9A3412" weight="700">
                {t('afternoonTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          {t('afternoonSubtitle')}
        </AccessibleText>
        <BigButton
          title={state.afternoonCompleted ? t('afternoonRecordAgain') : `${t('afternoonTitle')} – 15s`}
          subtitle={t('afternoonSubtitle')}
          icon="🎙️"
          variant="afternoon"
          size="hero"
          onPress={onNavigateToAfternoon}
        />
      </View>

      {/* RHYTHM 3: CHẠM TỐI */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#3730A3">
            🌙 {t('eveningTitle')}
          </AccessibleText>
          {state.eveningListened ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                {t('eveningListenedBadge')}
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#EEF2FF' }]}>
              <AccessibleText variant="label" color="#4338CA" weight="700">
                {t('eveningTimeWindow')}
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          {t('eveningSubtitle')}
        </AccessibleText>
        <BigButton
          title={`${t('eveningTitle')} – ${t('eveningPlayBtn')}`}
          subtitle={t('eveningSubtitle')}
          icon="🎧"
          variant="evening"
          size="hero"
          onPress={onNavigateToEvening}
        />
      </View>

      {/* Footer Switcher for Demo & Settings */}
      <View style={styles.footer}>
        <BigButton
          title={t('switchRoleBtn')}
          icon="🌐"
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
  topBar: {
    backgroundColor: '#FEF3C7',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  familyInfo: {
    marginBottom: 4,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
    marginTop: 6,
  },
  heroBanner: {
    marginVertical: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDesc: {
    marginBottom: 14,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  footer: {
    marginTop: 18,
  },
});
