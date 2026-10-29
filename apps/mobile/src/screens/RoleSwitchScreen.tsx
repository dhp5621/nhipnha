import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService, type PermissionStatus } from '../services/permissions';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeSelector } from '../components/ThemeSelector';
import { TextSizeSelector } from '../components/TextSizeSelector';
import type { Role } from '@nhipnha/shared';

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
  const { colors } = useTheme();

  const [micPerm, setMicPerm] = useState<PermissionStatus>('undetermined');
  const [camPerm, setCamPerm] = useState<PermissionStatus>('undetermined');

  const isVi = activeLanguage === 'vi';

  const loadPermissions = async () => {
    const [m, c] = await Promise.all([
      permissionService.getStatus('microphone'),
      permissionService.getStatus('camera'),
    ]);
    setMicPerm(m);
    setCamPerm(c);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleRequestMic = async () => {
    await permissionService.requestPermission('microphone', isVi);
    await loadPermissions();
  };

  const handleRequestCam = async () => {
    await permissionService.requestPermission('camera', isVi);
    await loadPermissions();
  };

  const handleRoleSelect = (role: Role) => {
    switchRole(role);
    onBack();
  };

  const handleSignOut = () => {
    Alert.alert(
      isVi ? 'Rời khỏi gia đình hiện tại?' : 'Sign out of current family?',
      isVi
        ? 'Bạn có thể quét lại mã QR hoặc nhập mã gia đình bất cứ lúc nào.'
        : 'You can scan your QR code or enter your family code again anytime.',
      [
        { text: isVi ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: isVi ? 'Đăng xuất' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onGoToLogin();
          },
        },
      ]
    );
  };

  const roleOptions: { id: Role; label: string; sub: string; emoji: string }[] = [
    {
      id: 'CHILD',
      label: isVi ? 'Trẻ em' : 'Child',
      sub: isVi ? 'Cỡ chữ chuẩn' : 'Standard font',
      emoji: '🧒',
    },
    {
      id: 'PARENT',
      label: isVi ? 'Bố / Mẹ' : 'Parent',
      sub: isVi ? 'Cỡ chữ chuẩn' : 'Standard font',
      emoji: '👩‍🏭',
    },
    {
      id: 'GRANDPARENT',
      label: isVi ? 'Ông / Bà' : 'Elder',
      sub: isVi ? 'Tự động chữ lớn' : 'Auto large font',
      emoji: '👵',
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backPill, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <AccessibleText variant="label" weight="800">
            ← {t('back')}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      <AccessibleText variant="display" weight="900" style={{ marginBottom: 16 }}>
        {isVi ? 'Cài đặt & Tài khoản' : 'Settings & Account'}
      </AccessibleText>

      {/* Active Family Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.profileRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.avatarImg}
          />
          <View style={{ flex: 1 }}>
            <AccessibleText variant="h2" weight="900">
              {member?.name}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
              {family?.name}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.primary} weight="800" style={{ marginTop: 2 }}>
              {isVi ? 'Mã gia đình:' : 'Family Code:'} {family?.code}
            </AccessibleText>
          </View>
        </View>

        {/* Role Switcher inside Family */}
        <AccessibleText
          variant="label"
          color={colors.textSecondary}
          style={{ marginTop: 16, marginBottom: 8 }}
        >
          {isVi ? 'Chuyển vai trò trên thiết bị này' : 'Switch role on this device'}
        </AccessibleText>

        <View style={styles.roleRow}>
          {roleOptions.map((r) => {
            const active = member?.role === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => handleRoleSelect(r.id)}
                style={[
                  styles.roleBtn,
                  {
                    backgroundColor: active
                      ? colors.primaryContainer
                      : colors.surfaceContainerHigh,
                    borderRadius: active ? 999 : 20,
                  },
                ]}
              >
                <AccessibleText variant="h2">{r.emoji}</AccessibleText>
                <AccessibleText
                  variant="label"
                  weight="800"
                  color={active ? colors.onPrimaryContainer : colors.textDark}
                  style={{ marginTop: 2 }}
                >
                  {r.label}
                </AccessibleText>
                <AccessibleText
                  variant="caption"
                  color={active ? colors.onPrimaryContainer : colors.textMuted}
                >
                  {r.sub}
                </AccessibleText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Theme Selector (Light / Dark / System) */}
      <ThemeSelector />

      {/* Text Size Selector (Role Auto / Normal / Large / Extra Large) */}
      <TextSizeSelector />

      {/* Language Selector (VI / EN / Auto) */}
      <LanguageSelector />

      {/* System Permissions Card */}
      <View
        style={[
          styles.permCard,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <AccessibleText variant="bodyLarge" weight="800" style={{ marginBottom: 10 }}>
          {isVi ? 'Quyền truy cập thiết bị' : 'Device Permissions'}
        </AccessibleText>

        <TouchableOpacity
          onPress={handleRequestMic}
          style={[
            styles.permRow,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AccessibleText variant="bodyRegular" weight="700">
              🎙️ {isVi ? 'Micro thu âm' : 'Microphone'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Dùng cho Hộp thư thoại & Nhật ký 15s' : 'Used for Voice Mailbox & 15s Diary'}
            </AccessibleText>
          </View>
          <View
            style={[
              styles.permBadge,
              {
                backgroundColor:
                  micPerm === 'granted' ? colors.successBg : colors.surfaceContainerHighest,
              },
            ]}
          >
            <AccessibleText
              variant="caption"
              weight="800"
              color={micPerm === 'granted' ? colors.onSuccessContainer : colors.primary}
            >
              {micPerm === 'granted'
                ? isVi
                  ? 'Đã cấp'
                  : 'Granted'
                : isVi
                ? 'Cấp quyền'
                : 'Allow'}
            </AccessibleText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRequestCam}
          style={[
            styles.permRow,
            { backgroundColor: colors.surfaceContainerHigh, marginTop: 8 },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AccessibleText variant="bodyRegular" weight="700">
              📷 {isVi ? 'Máy ảnh' : 'Camera'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Dùng để quét mã QR & chụp ảnh nhật ký' : 'Used for QR pairing & diary photos'}
            </AccessibleText>
          </View>
          <View
            style={[
              styles.permBadge,
              {
                backgroundColor:
                  camPerm === 'granted' ? colors.successBg : colors.surfaceContainerHighest,
              },
            ]}
          >
            <AccessibleText
              variant="caption"
              weight="800"
              color={camPerm === 'granted' ? colors.onSuccessContainer : colors.primary}
            >
              {camPerm === 'granted'
                ? isVi
                  ? 'Đã cấp'
                  : 'Granted'
                : isVi
                ? 'Cấp quyền'
                : 'Allow'}
            </AccessibleText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <View style={{ marginTop: 12 }}>
        <BigButton
          title={isVi ? 'Đổi gia đình / Đăng xuất' : 'Switch Family / Sign Out'}
          variant="secondary"
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  profileCard: {
    borderRadius: 32,
    padding: 20,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginRight: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCard: {
    borderRadius: 32,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
  },
  permBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
