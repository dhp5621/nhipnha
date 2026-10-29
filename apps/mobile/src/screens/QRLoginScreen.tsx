import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { LanguageSelector } from '../components/LanguageSelector';
import { THEME } from '../constants/theme';

interface QRLoginScreenProps {
  onSuccess: () => void;
}

export const QRLoginScreen: React.FC<QRLoginScreenProps> = ({ onSuccess }) => {
  const { pairWithQR, pairWithCode, isLoading } = useAuth();
  const { t } = useLanguage();
  const [manualCode, setManualCode] = useState('NHIP-8868');
  const [selectedRole, setSelectedRole] = useState<'CHILD' | 'PARENT'>('CHILD');
  const [name, setName] = useState('Bé An');

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

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <View style={styles.header}>
        <AccessibleText variant="hero" color={THEME.colors.morningBorder} center weight="800">
          {t('appName')}
        </AccessibleText>
        <AccessibleText variant="h2" color={THEME.colors.textDark} center weight="700" style={styles.subtitle}>
          {t('appSubname')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={THEME.colors.textSecondary} center style={styles.desc}>
          {t('zeroTypeDesc')}
        </AccessibleText>
      </View>

      {/* Language Switcher in Login Screen */}
      <LanguageSelector />

      <View style={styles.qrCard}>
        <View style={styles.qrBox}>
          <AccessibleText variant="hero" center>
            📱 📷 🏠
          </AccessibleText>
          <AccessibleText variant="bodyLarge" center weight="700" color="#1E293B" style={{ marginTop: 8 }}>
            {t('familyQRCode')}
          </AccessibleText>
          <AccessibleText variant="label" center color="#64748B">
            ID: NHIP-8868 (Đồng Tháp)
          </AccessibleText>
        </View>

        <BigButton
          title={t('zeroTypeTitle')}
          subtitle={t('zeroTypeDesc')}
          icon="⚡"
          variant="morning"
          size="hero"
          loading={isLoading}
          onPress={handleOneTouchQRScan}
        />
      </View>

      <View style={styles.manualSection}>
        <AccessibleText variant="h2" weight="700" color={THEME.colors.textDark}>
          {t('orEnterCode')}
        </AccessibleText>

        <TextInput
          style={styles.input}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="e.g. NHIP-8868"
          placeholderTextColor="#94A3B8"
          accessibilityLabel={t('orEnterCode')}
        />

        <View style={styles.roleRow}>
          <BigButton
            title={selectedRole === 'CHILD' ? `✓ ${t('childRole')}` : t('childRole')}
            onPress={() => {
              setSelectedRole('CHILD');
              setName('Bé An');
            }}
            variant={selectedRole === 'CHILD' ? 'morning' : 'secondary'}
          />
          <BigButton
            title={selectedRole === 'PARENT' ? `✓ ${t('parentRole')}` : t('parentRole')}
            onPress={() => {
              setSelectedRole('PARENT');
              setName('Mẹ Hoa');
            }}
            variant={selectedRole === 'PARENT' ? 'afternoon' : 'secondary'}
          />
        </View>

        <BigButton
          title={t('connectByCode')}
          icon="🔑"
          variant="secondary"
          onPress={handlePairByCode}
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
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 4,
  },
  desc: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBox: {
    width: '100%',
    paddingVertical: 24,
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FDE047',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginVertical: 12,
  },
  roleRow: {
    marginVertical: 8,
  },
});
