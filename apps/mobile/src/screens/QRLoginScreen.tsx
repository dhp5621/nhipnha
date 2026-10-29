import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissions';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';
import type { Role } from '@nhipnha/shared';

interface QRLoginScreenProps {
  onSuccess: () => void;
  onBackToLogin?: () => void;
}

export const QRLoginScreen: React.FC<QRLoginScreenProps> = ({ onSuccess, onBackToLogin }) => {
  const { pairWithQR, pairWithCode, createNewFamily, loginDemoAccount, isLoading } = useAuth();
  const { t, activeLanguage, setLanguagePreference } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [manualCode, setManualCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('CHILD');
  const [memberName, setMemberName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newProvince, setNewProvince] = useState('');

  const isVi = activeLanguage === 'vi';

  const handleScanQR = async () => {
    const granted = await permissionService.requestPermission('camera', isVi);
    if (!granted) return;

    const qrPayload = JSON.stringify({
      version: '1.0',
      app: 'nhipnha',
      familyId: 'fam_dongthap_001',
      familyCode: 'NHIP-8868',
      familyName: 'Gia đình Bác Ba & Bé An',
      token: 'tok_qr_8868',
      suggestedRole: selectedRole,
      suggestedName: memberName.trim() || undefined,
    });

    try {
      await pairWithQR(qrPayload, selectedRole, memberName.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      Alert.alert(isVi ? 'Lỗi kết nối' : 'Connection Error', err?.message || 'Không thể đọc mã QR');
    }
  };

  const handleJoinByCode = async () => {
    if (!manualCode.trim()) {
      Alert.alert(
        isVi ? 'Thiếu mã gia đình' : 'Missing Family Code',
        isVi ? 'Vui lòng nhập mã gia đình (ví dụ: NHIP-8868)' : 'Please enter your family code'
      );
      return;
    }
    try {
      const defaultName =
        selectedRole === 'CHILD' ? 'Con' : selectedRole === 'PARENT' ? 'Bố / Mẹ' : 'Ông / Bà';
      await pairWithCode(manualCode.trim(), selectedRole, memberName.trim() || defaultName);
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Không tìm thấy mã gia đình' : 'Family Not Found',
        err?.message || (isVi ? 'Vui lòng kiểm tra lại mã gia đình' : 'Please check your family code')
      );
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      Alert.alert(
        isVi ? 'Nhập tên gia đình' : 'Enter Family Name',
        isVi ? 'Vui lòng đặt tên cho gia đình của bạn' : 'Please enter a name for your family'
      );
      return;
    }
    try {
      const defaultName =
        selectedRole === 'CHILD' ? 'Con' : selectedRole === 'PARENT' ? 'Bố / Mẹ' : 'Ông / Bà';
      await createNewFamily(
        newFamilyName.trim(),
        newProvince.trim() || 'Việt Nam',
        selectedRole,
        memberName.trim() || defaultName
      );
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Lỗi tạo gia đình' : 'Creation Error',
        err?.message || 'Không thể tạo không gian gia đình'
      );
    }
  };

  const handleQuickDemo = async () => {
    try {
      await loginDemoAccount(selectedRole);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load demo family from server');
    }
  };

  const roles: { id: Role; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'CHILD', label: isVi ? 'Con nhỏ' : 'Child', icon: 'child-care' },
    { id: 'PARENT', label: isVi ? 'Bố / Mẹ' : 'Parent', icon: 'supervisor-account' },
    { id: 'GRANDPARENT', label: isVi ? 'Ông / Bà' : 'Grandparent', icon: 'elderly' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Quick Controls (Theme + Language) */}
      <View style={styles.topUtilityBar}>
        {onBackToLogin && (
          <TouchableOpacity
            onPress={onBackToLogin}
            style={[styles.utilityChip, { backgroundColor: colors.surfaceContainerHigh, marginRight: 'auto' }]}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <AccessibleText variant="label" color={colors.textDark} weight="700">
              {isVi ? 'Đăng nhập' : 'Log in'}
            </AccessibleText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.utilityChip, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
        >
          <MaterialIcons
            name={isDark ? 'dark-mode' : 'wb-sunny'}
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <AccessibleText variant="label" color={colors.textDark}>
            {isDark ? (isVi ? 'Tối' : 'Dark') : isVi ? 'Sáng' : 'Light'}
          </AccessibleText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setLanguagePreference(isVi ? 'en' : 'vi')}
          style={[styles.utilityChip, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
        >
          <MaterialIcons
            name="language"
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <AccessibleText variant="label" color={colors.textDark}>
            {isVi ? 'Tiếng Việt' : 'English'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      {/* Editorial Brand Header */}
      <View style={styles.brandSection}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.appIcon}
        />
        <AccessibleText variant="display" weight="900" style={{ marginTop: 14 }}>
          {t('appName')}
        </AccessibleText>
        <AccessibleText
          variant="bodyLarge"
          color={colors.textSecondary}
          style={{ marginTop: 4 }}
        >
          {t('appSubname')}
        </AccessibleText>
      </View>

      {/* Segmented Mode Picker: Join vs Create */}
      <View
        style={[
          styles.modeSegment,
          { backgroundColor: colors.surfaceContainerHigh },
        ]}
      >
        <TouchableOpacity
          onPress={() => setTab('join')}
          style={[
            styles.modeBtn,
            tab === 'join' && {
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: 999,
            },
          ]}
        >
          <AccessibleText
            variant="label"
            weight="800"
            color={tab === 'join' ? colors.primary : colors.textSecondary}
          >
            {isVi ? 'Vào nhà đã có mã' : 'Join Family'}
          </AccessibleText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('create')}
          style={[
            styles.modeBtn,
            tab === 'create' && {
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: 999,
            },
          ]}
        >
          <AccessibleText
            variant="label"
            weight="800"
            color={tab === 'create' ? colors.primary : colors.textSecondary}
          >
            {isVi ? 'Tạo nhà mới' : 'Create Family'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      {/* Role Selector */}
      <View
        style={[
          styles.surfaceCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <AccessibleText variant="label" color={colors.textSecondary} style={{ marginBottom: 10 }}>
          {isVi ? 'Bạn là ai trong gia đình?' : 'Your role in the family'}
        </AccessibleText>

        <View style={styles.roleRow}>
          {roles.map((r) => {
            const active = selectedRole === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setSelectedRole(r.id)}
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: active
                      ? colors.primaryContainer
                      : colors.surfaceContainerHigh,
                    borderRadius: active ? 999 : 20,
                  },
                ]}
              >
                <MaterialIcons
                  name={r.icon}
                  size={28}
                  color={active ? colors.onPrimaryContainer : colors.primary}
                />
                <AccessibleText
                  variant="label"
                  weight="800"
                  color={active ? colors.onPrimaryContainer : colors.textDark}
                  style={{ marginTop: 4 }}
                >
                  {r.label}
                </AccessibleText>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceContainerHighest,
              color: colors.textDark,
            },
          ]}
          value={memberName}
          onChangeText={setMemberName}
          placeholder={
            isVi ? 'Tên gọi ở nhà (ví dụ: Bé An, Mẹ Hoa)' : 'Your nickname (e.g. Be An, Mom)'
          }
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {tab === 'join' ? (
        <View
          style={[
            styles.surfaceCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {isVi ? 'Ghép đôi với gia đình' : 'Connect to your family'}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ marginTop: 4, marginBottom: 12 }}
          >
            {isVi
              ? 'Quét mã QR dán ở nhà hoặc nhập mã số gia đình'
              : 'Scan your home QR sticker or enter your family code'}
          </AccessibleText>

          <BigButton
            title={isVi ? 'Quét mã QR gia đình' : 'Scan Family QR Code'}
            subtitle={isVi ? 'Yêu cầu quyền Máy ảnh' : 'Requires Camera permission'}
            icon="qr-code-scanner"
            variant="morning"
            size="hero"
            loading={isLoading}
            onPress={handleScanQR}
          />

          <View style={styles.orDivider}>
            <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
            <AccessibleText variant="caption" color={colors.textMuted} style={{ marginHorizontal: 10 }}>
              {isVi ? 'HOẶC NHẬP MÃ' : 'OR ENTER CODE'}
            </AccessibleText>
            <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
          </View>

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.textDark,
              },
            ]}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="NHIP-XXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />

          <BigButton
            title={t('connectByCode')}
            icon="login"
            variant="primary"
            loading={isLoading}
            onPress={handleJoinByCode}
          />
        </View>
      ) : (
        <View
          style={[
            styles.surfaceCard,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {isVi ? 'Tạo không gian gia đình mới' : 'Create a new family space'}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ marginTop: 4, marginBottom: 10 }}
          >
            {isVi
              ? 'Hệ thống sẽ lưu gia đình vào cơ sở dữ liệu và tạo mã riêng cho nhà bạn'
              : 'Saves your family to the database and generates a unique pairing code'}
          </AccessibleText>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.textDark,
              },
            ]}
            value={newFamilyName}
            onChangeText={setNewFamilyName}
            placeholder={isVi ? 'Tên gia đình (ví dụ: Nhà Nội Đồng Tháp)' : 'Family name'}
            placeholderTextColor={colors.textMuted}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.textDark,
              },
            ]}
            value={newProvince}
            onChangeText={setNewProvince}
            placeholder={isVi ? 'Tỉnh / Quê nhà (ví dụ: Đồng Tháp, Nghệ An)' : 'Hometown province'}
            placeholderTextColor={colors.textMuted}
          />

          <BigButton
            title={isVi ? 'Tạo nhà & Nhận mã QR' : 'Create Family & Get QR'}
            icon="add-home"
            variant="primary"
            size="hero"
            loading={isLoading}
            onPress={handleCreateFamily}
          />
        </View>
      )}

      {/* Subtle Demo Account Entry at the bottom (fetches NHIP-8868 from server database) */}
      <TouchableOpacity
        onPress={handleQuickDemo}
        style={[
          styles.demoBanner,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <View style={{ flex: 1 }}>
          <AccessibleText variant="label" weight="800" color={colors.primary}>
            {isVi ? 'Kết nối gia đình mẫu trên máy chủ (NHIP-8868)' : 'Connect Server Demo Family (NHIP-8868)'}
          </AccessibleText>
          <AccessibleText variant="caption" color={colors.textSecondary}>
            {isVi
              ? 'Tải dữ liệu mẫu của Gia đình Bác Ba & Bé An trực tiếp từ cơ sở dữ liệu'
              : 'Loads sample data for Be An’s Family directly from the server database'}
          </AccessibleText>
        </View>
        <MaterialIcons name="arrow-forward" size={22} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
    flexGrow: 1,
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  brandSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  appIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
  },
  modeSegment: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  surfaceCard: {
    borderRadius: THEME.borderRadius.card,
    padding: 20,
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 5,
  },
  codeInput: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 18,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  line: {
    flex: 1,
    height: 1,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginTop: 4,
  },
});
