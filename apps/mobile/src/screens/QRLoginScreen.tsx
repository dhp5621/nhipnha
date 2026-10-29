import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface QRLoginScreenProps {
  onSuccess: () => void;
}

export const QRLoginScreen: React.FC<QRLoginScreenProps> = ({ onSuccess }) => {
  const { pairWithQR, pairWithCode, isLoading } = useAuth();
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
      Alert.alert('Thành công', 'Đã ghép đôi thiết bị vào gia đình thành công!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể ghép đôi mã QR');
    }
  };

  const handlePairByCode = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Nhắc nhở', 'Vui lòng nhập mã ghép đôi gồm 4 số!');
      return;
    }
    try {
      await pairWithCode(manualCode.trim(), selectedRole, name);
      Alert.alert('Thành công', `Chào mừng ${name} đã kết nối vào gia đình!`);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Mã ghép đôi không chính xác');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      <View style={styles.header}>
        <AccessibleText variant="hero" color={THEME.colors.morningBorder} center weight="800">
          Nhịp Nhà
        </AccessibleText>
        <AccessibleText variant="h2" color={THEME.colors.textDark} center weight="700" style={styles.subtitle}>
          Gần nhau dù cách xa
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={THEME.colors.textSecondary} center style={styles.desc}>
          Kết nối không cần mật khẩu. Một chạm ghép đôi bằng mã QR dán trên góc học tập hoặc ti-vi ở quê.
        </AccessibleText>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.qrBox}>
          <AccessibleText variant="hero" center>
            📱 📷 🏠
          </AccessibleText>
          <AccessibleText variant="bodyLarge" center weight="700" color="#1E293B" style={{ marginTop: 8 }}>
            Mã QR Gia Đình
          </AccessibleText>
          <AccessibleText variant="label" center color="#64748B">
            Mã định danh: NHIP-8868 (Đồng Tháp)
          </AccessibleText>
        </View>

        <BigButton
          title="Ghép đôi 1 chạm (Zero-Type)"
          subtitle="Tự động nhận diện thiết bị & vào thẳng nhà"
          icon="⚡"
          variant="morning"
          size="hero"
          loading={isLoading}
          onPress={handleOneTouchQRScan}
        />
      </View>

      <View style={styles.manualSection}>
        <AccessibleText variant="h2" weight="700" color={THEME.colors.textDark}>
          Hoặc nhập mã số gia đình:
        </AccessibleText>

        <TextInput
          style={styles.input}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Ví dụ: NHIP-8868"
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Nhập mã số gia đình"
        />

        <View style={styles.roleRow}>
          <BigButton
            title={selectedRole === 'CHILD' ? '✓ Vai Trẻ Em' : 'Vai Trẻ Em'}
            onPress={() => {
              setSelectedRole('CHILD');
              setName('Bé An');
            }}
            variant={selectedRole === 'CHILD' ? 'morning' : 'secondary'}
          />
          <BigButton
            title={selectedRole === 'PARENT' ? '✓ Vai Phụ Huynh' : 'Vai Phụ Huynh'}
            onPress={() => {
              setSelectedRole('PARENT');
              setName('Mẹ Hoa');
            }}
            variant={selectedRole === 'PARENT' ? 'afternoon' : 'secondary'}
          />
        </View>

        <BigButton
          title="Kết Nối Bằng Mã Số"
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
