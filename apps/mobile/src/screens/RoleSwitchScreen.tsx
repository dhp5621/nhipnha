import React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
  const { t, activeLanguage } = useLanguage();

  const isVi = activeLanguage === 'vi';

  const handleSwitchToChild = () => {
    switchRole('CHILD', 'Bé An (8 tuổi)');
    Alert.alert(isVi ? 'Đã đổi vai' : 'Role Changed', t('switchToChild'));
    onBack();
  };

  const handleSwitchToParent = () => {
    switchRole('PARENT', 'Mẹ Hoa (Công nhân xa nhà)');
    Alert.alert(isVi ? 'Đã đổi vai' : 'Role Changed', t('switchToParent'));
    onBack();
  };

  const handleSwitchToGrandparent = () => {
    switchRole('GRANDPARENT', 'Bà Nội Bảy (68 tuổi)');
    Alert.alert(isVi ? 'Đã đổi vai' : 'Role Changed', t('switchToGrandparent'));
    onBack();
  };

  const handleReset = async () => {
    await logout();
    onGoToLogin();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backPill}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <AccessibleText variant="bodyLarge" weight="800" color={THEME.colors.textDark}>
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={styles.sdgPill}>
          <AccessibleText variant="caption" color="#15803D" weight="900">
            SDG 3 • 4 • 8
          </AccessibleText>
        </View>
      </View>

      <View style={styles.header}>
        <AccessibleText variant="h1" color={THEME.colors.textDark} weight="900" center>
          {t('switchRoleBtn')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color={THEME.colors.textSecondary} center style={{ marginTop: 4 }}>
          {t('competitionBadge')}
        </AccessibleText>
      </View>

      {/* Active Profile Card */}
      <View style={[styles.activeProfileCard, THEME.shadows.card]}>
        <View style={styles.profileRow}>
          <View style={styles.activeAvatar}>
            <AccessibleText variant="h1">
              {member?.role === 'CHILD' ? '🧒' : member?.role === 'PARENT' ? '👩‍🏭' : '👵'}
            </AccessibleText>
          </View>
          <View style={{ flex: 1 }}>
            <AccessibleText variant="caption" color="#0D9488" weight="900">
              {isVi ? 'ĐANG SỬ DỤNG VAI TRÒ:' : 'CURRENT ACTIVE PERSONA:'}
            </AccessibleText>
            <AccessibleText variant="h2" color={THEME.colors.textDark} weight="900">
              {member?.name}
            </AccessibleText>
            <AccessibleText variant="label" color={THEME.colors.textSecondary}>
              {family?.name} • {family?.code}
            </AccessibleText>
          </View>
        </View>
      </View>

      {/* Language Selector */}
      <LanguageSelector />

      {/* 3 Generation Persona Switcher */}
      <View style={styles.switchSection}>
        <AccessibleText variant="h2" weight="900" color={THEME.colors.textDark} style={{ marginBottom: 6 }}>
          {isVi ? 'Chọn thế hệ người dùng để trải nghiệm:' : 'Choose generation persona to preview:'}
        </AccessibleText>

        <BigButton
          title={t('switchToChild')}
          subtitle={
            isVi
              ? '6–12 tuổi • 3 Nhịp Gắn Kết, chọn 4 cảm xúc & thu âm 15s'
              : '6–12 y/o • 3 Daily Rhythms, 4 mood cards & 15s voice note'
          }
          icon="🧒"
          variant="morning"
          size="hero"
          onPress={handleSwitchToChild}
        />

        <BigButton
          title={t('switchToParent')}
          subtitle={
            isVi
              ? 'Công nhân xa nhà • Dòng thời gian, AI Thấu Cảm & phản hồi 30s'
              : 'Migrant worker • Daily timeline, AI Empathy & 30s bedtime voice'
          }
          icon="👩‍🏭"
          variant="afternoon"
          size="hero"
          onPress={handleSwitchToParent}
        />

        <BigButton
          title={t('switchToGrandparent')}
          subtitle={
            isVi
              ? '65–70 tuổi • Tự động phóng to chữ (+3pt), tương phản AAA tối đa'
              : '65–70 y/o • Auto-boosted extra-large typography (+3pt) & AAA contrast'
          }
          icon="👵"
          variant="evening"
          size="hero"
          onPress={handleSwitchToGrandparent}
        />

        <View style={styles.divider} />

        <BigButton
          title={t('resetQR')}
          subtitle={
            isVi
              ? 'Trải nghiệm lại màn hình quét QR 1 chạm (Zero-Type Login)'
              : 'Test the 1-Touch Zero-Type QR Pairing screen again'
          }
          icon="📷"
          variant="secondary"
          onPress={handleReset}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 44,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backPill: {
    backgroundColor: '#F2EAE0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D8C2B9',
  },
  sdgPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  header: {
    marginBottom: 14,
  },
  activeProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    borderWidth: 2,
    borderColor: '#99F6E4',
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    borderWidth: 2,
    borderColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  switchSection: {
    marginTop: 8,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E6DFD7',
    marginVertical: 12,
  },
});
