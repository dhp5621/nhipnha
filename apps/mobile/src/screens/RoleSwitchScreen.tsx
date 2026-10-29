import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
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

  const handleSwitchToChild = () => {
    switchRole('CHILD', 'Bé An (8 tuổi)');
    Alert.alert('Đã đổi vai', 'Bạn đang ở giao diện Bé An (Trẻ em nông thôn)');
    onBack();
  };

  const handleSwitchToParent = () => {
    switchRole('PARENT', 'Mẹ Hoa (Công nhân xa nhà)');
    Alert.alert('Đã đổi vai', 'Bạn đang ở giao diện Mẹ Hoa (Phụ huynh làm việc xa)');
    onBack();
  };

  const handleSwitchToGrandparent = () => {
    switchRole('GRANDPARENT', 'Bà Nội Bảy (68 tuổi)');
    Alert.alert('Đã đổi vai', 'Bạn đang ở chế độ hỗ trợ Ông bà nông thôn');
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
          🔄 Chuyển Đổi Chế Độ Trải Nghiệm
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 6 }}>
          Phục vụ đánh giá đề án RBPC 2026 (SDG 3, 4, 8)
        </AccessibleText>
      </View>

      <View style={styles.card}>
        <AccessibleText variant="h2" weight="700" color="#1E293B">
          Thiết bị hiện tại:
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#0D9488" weight="800" style={{ marginTop: 4 }}>
          {member?.name} ({member?.role === 'CHILD' ? 'Trẻ Em' : member?.role === 'PARENT' ? 'Phụ Huynh' : 'Ông Bà'})
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#64748B">
          Gia đình: {family?.name} • Mã: {family?.code}
        </AccessibleText>
      </View>

      <View style={styles.switchOptions}>
        <BigButton
          title="1. Chuyển sang: Trẻ Em (Bé An)"
          subtitle="Giao diện 3 Nhịp Gắn Kết (Sáng, Chiều, Tối)"
          icon="🧒"
          variant="morning"
          size="hero"
          onPress={handleSwitchToChild}
        />

        <BigButton
          title="2. Chuyển sang: Phụ Huynh (Mẹ Hoa)"
          subtitle="Timeline nhật ký + AI Thấu Cảm + Phản hồi 30s"
          icon="👩‍🏭"
          variant="afternoon"
          size="hero"
          onPress={handleSwitchToParent}
        />

        <BigButton
          title="3. Chế độ: Ông Bà (Bà Bảy 68 tuổi)"
          subtitle="Font siêu lớn, nút bấm 68px, tối ưu Android cũ"
          icon="👵"
          variant="evening"
          size="hero"
          onPress={handleSwitchToGrandparent}
        />

        <BigButton
          title="Thử Nghiệm Quét Lại Mã QR (Zero-Type Login)"
          icon="📷"
          variant="secondary"
          onPress={handleReset}
        />
      </View>

      <BigButton
        title="Quay Lại Màn Hình Trước"
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
