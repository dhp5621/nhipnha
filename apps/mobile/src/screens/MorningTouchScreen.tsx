import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface MorningTouchScreenProps {
  onBack: () => void;
}

export const MorningTouchScreen: React.FC<MorningTouchScreenProps> = ({ onBack }) => {
  const { state, submitMorningTouch } = useRhythm();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [justTouched, setJustTouched] = useState(false);

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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#B45309" weight="800" center>
          ☀️ {t('morningTitle')}: {t('morningSubtitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 6 }}>
          {t('morningTimeWindow')}
        </AccessibleText>
      </View>

      <View style={styles.sunBox}>
        <AccessibleText variant="hero" center style={styles.sunEmoji}>
          🌅 🌻 🎒
        </AccessibleText>
        <AccessibleText variant="h2" weight="800" color="#78350F" center style={{ marginTop: 8 }}>
          "{t('morningQuote')}"
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#92400E" center style={{ marginTop: 6, paddingHorizontal: 12 }}>
          {t('morningSubtitle')}
        </AccessibleText>
      </View>

      <View style={styles.actionSection}>
        <BigButton
          title={state.morningCompleted || justTouched ? t('morningAlreadyDone') : t('morningButtonPrompt')}
          subtitle={t('morningSubtitle')}
          icon="☀️"
          variant={state.morningCompleted || justTouched ? "success" : "morning"}
          size="hero"
          loading={submitting}
          onPress={handleTouch}
        />

        <View style={styles.affirmationBox}>
          <AccessibleText variant="h2" color="#166534" weight="700">
            🌱 {t('morningAffirmation')}
          </AccessibleText>
        </View>

        <BigButton
          title={t('backHome')}
          variant="secondary"
          onPress={onBack}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
  },
  sunBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: THEME.borderRadius.card,
    padding: 24,
    borderWidth: 3,
    borderColor: '#FACC15',
    alignItems: 'center',
    marginBottom: 20,
  },
  sunEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  actionSection: {
    width: '100%',
  },
  affirmationBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
    marginVertical: 14,
  },
});
