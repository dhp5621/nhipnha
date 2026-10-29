import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { LanguageSelector } from '../components/LanguageSelector';
import { THEME } from '../constants/theme';

interface RoleSwitchScreenProps {
  onBack: () => void;
  onGoToLogin: () => void;
}

export const RoleSwitchScreen: React.FC<RoleSwitchScreenProps> = ({
  onBack,
  onGoToLogin,
}) => {
  const { member, family, switchRole, logout } = useAuth();
  const { t } = useLanguage();

  const handleSwitchToChild = () => {
    switchRole('CHILD', 'Bé An (8 tuổi)');
    Alert.alert('Role Changed / Đã đổi vai', t('switchToChild'));
    onBack();
  };

  const handleSwitchToParent = () => {
    switchRole('PARENT', 'Mẹ Hoa (Công nhân xa nhà)');
    Alert.alert('Role Changed / Đã đổi vai', t('switchToParent'));
    onBack();
  };

  const handleSwitchToGrandparent = () => {
    switchRole('GRANDPARENT', 'Bà Nội Bảy (68 tuổi)');
    Alert.alert('Role Changed / Đã đổi vai', t('switchToGrandparent'));
    onBack();
  };

  const handleReset = async () => {
    await logout();
    onGoToLogin();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#0F172A" weight="800" center>
          🔄 {t('switchRoleBtn')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 6 }}>
          {t('competitionBadge')}
        </AccessibleText>
      </View>

      {/* Language Selector Component */}
      <LanguageSelector />

      <View style={styles.card}>
        <AccessibleText variant="h2" weight="700" color="#1E293B">
          Active Device / Thiết bị hiện tại:
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#0D9488" weight="800" style={{ marginTop: 4 }}>
          {member?.name} ({member?.role === 'CHILD' ? t('childRole') : member?.role === 'PARENT' ? t('parentRole') : t('grandparentRole')})
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#64748B">
          {family?.name} • Code: {family?.code}
        </AccessibleText>
      </View>

      <View style={styles.switchOptions}>
        <BigButton
          title={t('switchToChild')}
          subtitle={t('threeRhythmsTitle')}
          icon="🧒"
          variant="morning"
          size="hero"
          onPress={handleSwitchToChild}
        />

        <BigButton
          title={t('switchToParent')}
          subtitle={t('parentSubtitle')}
          icon="👩‍🏭"
          variant="afternoon"
          size="hero"
          onPress={handleSwitchToParent}
        />

        <BigButton
          title={t('switchToGrandparent')}
          subtitle="Large fonts, high contrast, budget device optimized"
          icon="👵"
          variant="evening"
          size="hero"
          onPress={handleSwitchToGrandparent}
        />

        <BigButton
          title={t('resetQR')}
          icon="📷"
          variant="secondary"
          onPress={handleReset}
        />
      </View>

      <BigButton
        title={t('back')}
        variant="secondary"
        onPress={onBack}
      />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  switchOptions: {
    marginBottom: 16,
  },
});
