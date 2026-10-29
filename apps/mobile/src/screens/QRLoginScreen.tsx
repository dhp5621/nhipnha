import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { LanguageSelector } from '../components/LanguageSelector';
import { THEME } from '../constants/theme';
import type { Role } from '@nhipnha/shared';

interface QRLoginScreenProps {
  onSuccess: () => void;
}

export const QRLoginScreen: React.FC<QRLoginScreenProps> = ({ onSuccess }) => {
  const { pairWithQR, pairWithCode, isLoading } = useAuth();
  const { t, activeLanguage } = useLanguage();
  const [manualCode, setManualCode] = useState('NHIP-8868');
  const [selectedRole, setSelectedRole] = useState<Role>('CHILD');
  const [name, setName] = useState('Bé An (8 tuổi)');

  const isVi = activeLanguage === 'vi';

  // Simulate instant 1-touch QR scan (Zero-Type Login)
  const handleOneTouchQRScan = async () => {
    const mockQRData = JSON.stringify({
      version: '1.0',
      app: 'nhipnha',
      familyId: 'fam_dongthap_001',
      familyCode: 'NHIP-8868',
      familyName: 'Gia đình Bác Ba & Bé An',
      token: 'tok_demo_one_touch_8868',
      suggestedRole: selectedRole,
      suggestedName: name,
    });

    try {
      await pairWithQR(mockQRData);
      Alert.alert(t('oneTouchSuccess'), `${t('appName')} – ${t('appSubname')}`);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'QR Pairing error');
    }
  };

  const handlePairByCode = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Notice', 'Please enter 4-digit family code!');
      return;
    }
    try {
      await pairWithCode(manualCode.trim(), selectedRole, name);
      Alert.alert(t('oneTouchSuccess'), `${name} connected!`);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Invalid code');
    }
  };

  const roleCards: { role: Role; emoji: string; title: string; defaultName: string; bg: string; border: string }[] = [
    {
      role: 'CHILD',
      emoji: '🧒',
      title: isVi ? 'Trẻ Em' : 'Child',
      defaultName: 'Bé An (8 tuổi)',
      bg: '#FEF3C7',
      border: '#F59E0B',
    },
    {
      role: 'PARENT',
      emoji: '👩‍🏭',
      title: isVi ? 'Phụ Huynh' : 'Parent',
      defaultName: 'Mẹ Hoa (Công nhân)',
      bg: '#FFEDD5',
      border: '#EA580C',
    },
    {
      role: 'GRANDPARENT',
      emoji: '👵',
      title: isVi ? 'Ông Bà' : 'Elder',
      defaultName: 'Bà Nội Bảy (68 tuổi)',
      bg: '#E0E7FF',
      border: '#4F46E5',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
      {/* Expressive Brand Hero Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <AccessibleText variant="display">🏡</AccessibleText>
        </View>
        <View style={styles.competitionPill}>
          <AccessibleText variant="caption" color="#92400E" weight="800">
            {t('competitionBadge')}
          </AccessibleText>
        </View>
        <AccessibleText variant="display" color="#78350F" center weight="900" style={{ marginTop: 6 }}>
          {t('appName')}
        </AccessibleText>
        <AccessibleText variant="h2" color={THEME.colors.textDark} center weight="800" style={styles.subtitle}>
          {t('appSubname')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color={THEME.colors.textSecondary} center style={styles.desc}>
          {t('zeroTypeDesc')}
        </AccessibleText>
      </View>

      {/* Language Switcher */}
      <LanguageSelector />

      {/* Zero-Type QR Viewfinder Card */}
      <View style={[styles.qrCard, THEME.shadows.expressive]}>
        <View style={styles.qrViewfinder}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.qrCenterBadge}>
            <AccessibleText variant="display" center>
              📷
            </AccessibleText>
          </View>
          <AccessibleText variant="h2" center weight="900" color="#451A03" style={{ marginTop: 8 }}>
            {t('familyQRCode')}
          </AccessibleText>
          <View style={styles.qrCodePill}>
            <AccessibleText variant="label" center color="#92400E" weight="800">
              NHIP-8868 • Đồng Tháp
            </AccessibleText>
          </View>
        </View>

        <BigButton
          title={t('zeroTypeTitle')}
          subtitle={
            isVi
              ? 'Quét mã QR dán trên tường nhà ở quê (Không mật khẩu)'
              : '1-Tap scan of home wall QR sticker (Zero password)'
          }
          icon="⚡"
          variant="morning"
          size="hero"
          loading={isLoading}
          onPress={handleOneTouchQRScan}
        />
      </View>

      {/* Manual Code & Multi-Age Role Selection */}
      <View style={[styles.manualSection, THEME.shadows.card]}>
        <AccessibleText variant="h2" weight="900" color={THEME.colors.textDark}>
          🔑 {t('orEnterCode')}
        </AccessibleText>

        <TextInput
          style={styles.input}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="NHIP-8868"
          placeholderTextColor="#94A3B8"
          accessibilityLabel={t('orEnterCode')}
        />

        <AccessibleText variant="bodyLarge" weight="800" color={THEME.colors.textDark} style={{ marginTop: 6, marginBottom: 8 }}>
          {isVi ? 'Chọn thành viên gia đình:' : 'Select family member role:'}
        </AccessibleText>

        <View style={styles.roleGrid}>
          {roleCards.map((rc) => {
            const isSelected = selectedRole === rc.role;
            return (
              <TouchableOpacity
                key={rc.role}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedRole(rc.role);
                  setName(rc.defaultName);
                }}
                style={[
                  styles.roleOptionCard,
                  {
                    backgroundColor: isSelected ? rc.bg : '#F8F2EA',
                    borderColor: isSelected ? rc.border : '#D8C2B9',
                    borderWidth: isSelected ? 3 : 1.5,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <AccessibleText variant="h1">{rc.emoji}</AccessibleText>
                <AccessibleText variant="label" weight="800" color={THEME.colors.textDark} style={{ marginTop: 4 }}>
                  {rc.title}
                </AccessibleText>
                {isSelected && (
                  <View style={[styles.roleCheckDot, { backgroundColor: rc.border }]}>
                    <AccessibleText variant="caption" color="#FFFFFF" weight="900">
                      ✓
                    </AccessibleText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <BigButton
          title={t('connectByCode')}
          subtitle={name}
          icon="🔗"
          variant="primary"
          onPress={handlePairByCode}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 44,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  competitionPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  subtitle: {
    marginTop: 2,
  },
  desc: {
    marginTop: 6,
    paddingHorizontal: 8,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
    alignItems: 'center',
    marginVertical: 12,
  },
  qrViewfinder: {
    width: '100%',
    paddingVertical: 26,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#D97706',
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  qrCenterBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  qrCodePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  manualSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E6DFD7',
    marginTop: 6,
  },
  input: {
    minHeight: 62,
    borderWidth: 2,
    borderColor: '#D8C2B9',
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1510',
    backgroundColor: '#FAF6F0',
    marginVertical: 12,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  roleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  roleOptionCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 96,
  },
  roleCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
