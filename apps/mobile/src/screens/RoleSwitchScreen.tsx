import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService, type PermissionStatus } from '../services/permissions';
import { apiClient } from '../services/api';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeSelector } from '../components/ThemeSelector';
import { TextSizeSelector } from '../components/TextSizeSelector';
import { SecurityQRCard } from '../components/SecurityQRCard';
import type { Member, Role } from '@nhipnha/shared';

interface RoleSwitchScreenProps {
  onBack: () => void;
  onGoToLogin: () => void;
  onOpenOwnerConsole?: () => void;
}

export const RoleSwitchScreen: React.FC<RoleSwitchScreenProps> = ({
  onBack,
  onGoToLogin,
  onOpenOwnerConsole,
}) => {
  const {
    member,
    family,
    isDemoAccount,
    isOwner,
    personalLoginCode,
    switchRole,
    logout,
  } = useAuth();
  const { t, activeLanguage } = useLanguage();
  const { colors } = useTheme();

  const [micPerm, setMicPerm] = useState<PermissionStatus>('undetermined');
  const [camPerm, setCamPerm] = useState<PermissionStatus>('undetermined');

  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [accountEmail, setAccountEmail] = useState<string | undefined>(member?.email);
  const [hasPassword, setHasPassword] = useState<boolean>(!!member?.hasPassword);
  const [activeSessions, setActiveSessions] = useState<number>(1);
  const [showPersonalQR, setShowPersonalQR] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [ownerNewEmail, setOwnerNewEmail] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const isVi = activeLanguage === 'vi';

  const loadPermissionsAndFamily = async () => {
    const [m, c] = await Promise.all([
      permissionService.getStatus('microphone'),
      permissionService.getStatus('camera'),
    ]);
    setMicPerm(m);
    setCamPerm(c);

    if (family?.id) {
      try {
        const list = await apiClient.getMembers(family.id);
        setFamilyMembers(list);
      } catch {}

      if (!isDemoAccount) {
        try {
          const info = await apiClient.getAccountInfo(family.id);
          setAccountEmail(info.email);
          setHasPassword(info.hasPassword);
          setActiveSessions(info.activeSessions || 1);
          if (info.email) setOwnerNewEmail(info.email);
        } catch {}
      }
    }
  };

  useEffect(() => {
    loadPermissionsAndFamily();
  }, [family?.id, member?.id]);

  const handleRequestMic = async () => {
    await permissionService.requestPermission('microphone', isVi);
    await loadPermissionsAndFamily();
  };

  const handleRequestCam = async () => {
    await permissionService.requestPermission('camera', isVi);
    await loadPermissionsAndFamily();
  };

  const handleDemoRoleSelect = (role: Role) => {
    if (!isDemoAccount) return;
    switchRole(role);
    onBack();
  };

  const handleChangePassword = async () => {
    if (!family?.id) return;
    if (newPassword.length < 8) {
      Alert.alert(
        isVi ? 'Mật khẩu quá ngắn' : 'Password Too Short',
        isVi ? 'Mật khẩu mới cần ít nhất 8 ký tự.' : 'New password must be at least 8 characters.'
      );
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiClient.changeOwnPassword(family.id, {
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
        email: isOwner && ownerNewEmail.trim() ? ownerNewEmail.trim() : undefined,
      });
      setAccountEmail(res.email);
      setHasPassword(res.hasPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert(
        isVi ? 'Đã cập nhật mật khẩu' : 'Password Updated',
        isVi
          ? 'Mật khẩu mới đã được lưu. Các thiết bị khác (nếu có) đã được đăng xuất để bảo mật.'
          : 'Your password has been updated and other sessions were signed out.'
      );
    } catch (err: any) {
      Alert.alert(isVi ? 'Không thể đổi mật khẩu' : 'Update Error', err?.message || '');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = () => {
    const executeLogout = async () => {
      await logout();
      onGoToLogin();
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          isVi ? 'Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?' : 'Sign out of this device?'
        )
      ) {
        executeLogout();
      }
      return;
    }

    Alert.alert(
      isVi ? 'Đăng xuất khỏi thiết bị này?' : 'Sign out of this device?',
      isVi
        ? 'Bạn có thể đăng nhập lại bằng Mã QR cá nhân hoặc Email & Mật khẩu bất cứ lúc nào.'
        : 'You can sign back in anytime using your Personal QR or Email & Password.',
      [
        { text: isVi ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: isVi ? 'Đăng xuất' : 'Sign Out',
          style: 'destructive',
          onPress: executeLogout,
        },
      ]
    );
  };

  const roleLabels: Record<Role, string> = {
    CHILD: isVi ? 'Con nhỏ' : 'Child',
    PARENT: isVi ? 'Bố / Mẹ' : 'Parent',
    GRANDPARENT: isVi ? 'Ông / Bà' : 'Elder',
  };

  const roleIcons: Record<Role, keyof typeof MaterialIcons.glyphMap> = {
    CHILD: 'child-care',
    PARENT: 'supervisor-account',
    GRANDPARENT: 'elderly',
  };

  const roleOptions: {
    id: Role;
    label: string;
    sub: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    {
      id: 'CHILD',
      label: isVi ? 'Trẻ em' : 'Child',
      sub: isVi ? 'Cỡ chữ chuẩn' : 'Standard font',
      icon: 'child-care',
    },
    {
      id: 'PARENT',
      label: isVi ? 'Bố / Mẹ' : 'Parent',
      sub: isVi ? 'Cỡ chữ chuẩn' : 'Standard font',
      icon: 'supervisor-account',
    },
    {
      id: 'GRANDPARENT',
      label: isVi ? 'Ông / Bà' : 'Elder',
      sub: isVi ? 'Tự động chữ lớn' : 'Auto large font',
      icon: 'elderly',
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
          <MaterialIcons name="arrow-back" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
          <AccessibleText variant="label" weight="800">
            {t('back')}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      <AccessibleText variant="display" weight="900" style={{ marginBottom: 16 }}>
        {isVi ? 'Cài đặt & Gia đình' : 'Settings & Family'}
      </AccessibleText>

      {/* Active Member & Family Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={styles.profileRow}>
          <Image source={require('../../assets/icon.png')} style={styles.avatarImg} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <AccessibleText variant="h2" weight="900">
                {member?.name}
              </AccessibleText>
              <View style={[styles.roleBadge, { backgroundColor: colors.primaryContainer }]}>
                <AccessibleText variant="caption" weight="800" color={colors.onPrimaryContainer}>
                  {member?.role ? roleLabels[member.role] : ''}
                  {isOwner ? (isVi ? ' • Chủ nhà' : ' • Owner') : ''}
                </AccessibleText>
              </View>
            </View>
            <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
              {family?.name}
            </AccessibleText>
            {!isDemoAccount ? (
              <AccessibleText variant="caption" color={colors.primary} weight="700" style={{ marginTop: 2 }}>
                {isVi
                  ? 'Vai trò được khóa bảo mật bởi Chủ nhà'
                  : 'Role is securely locked by Family Owner'}
              </AccessibleText>
            ) : (
              <AccessibleText variant="caption" color={colors.primary} weight="800" style={{ marginTop: 2 }}>
                {isVi ? 'Chế độ Kiểm thử Demo:' : 'Demo Mode:'} {family?.code}
              </AccessibleText>
            )}
          </View>
        </View>

        {/* Owner Management Screen Entry (Only for Owner in Production or Demo) */}
        {isOwner && onOpenOwnerConsole && (
          <View style={{ marginTop: 14 }}>
            <BigButton
              title={
                isVi
                  ? 'Mở Bảng Quản Trị Chủ Nhà (Thành viên & QR)'
                  : 'Open Owner Console (Members & QR)'
              }
              subtitle={
                isVi
                  ? 'Thêm thành viên, gán vai trò, cấp Email/Mật khẩu và tạo mã QR'
                  : 'Add members, assign roles, set Email/Password, and issue QR codes'
              }
              icon="admin-panel-settings"
              variant="primary"
              onPress={onOpenOwnerConsole}
            />
          </View>
        )}

        {/* Role Switcher ONLY appears for Demo Account (`NHIP-8868`). Hidden in Production! */}
        {isDemoAccount && (
          <View style={{ marginTop: 16 }}>
            <AccessibleText
              variant="label"
              color={colors.textSecondary}
              style={{ marginBottom: 8 }}
            >
              {isVi
                ? 'Chuyển vai trò kiểm thử (Chỉ hiển thị ở bản Demo)'
                : 'Switch test role (Visible in Demo mode only)'}
            </AccessibleText>

            <View style={styles.roleRow}>
              {roleOptions.map((r) => {
                const active = member?.role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => handleDemoRoleSelect(r.id)}
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
        )}
      </View>

      {/* Expandable Family Roster Card (Available to EVERY member) */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
        ]}
      >
        <TouchableOpacity
          onPress={() => setRosterExpanded(!rosterExpanded)}
          style={styles.accordionHeader}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="groups" size={22} color={colors.onPrimaryContainer} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AccessibleText variant="h2" weight="800">
                {isVi ? 'Gia đình của tôi' : 'My Family'}
              </AccessibleText>
              <AccessibleText variant="caption" color={colors.textSecondary}>
                {isVi
                  ? `${familyMembers.length} thành viên • Nhấn để xem danh sách`
                  : `${familyMembers.length} members • Tap to view roster`}
              </AccessibleText>
            </View>
          </View>
          <MaterialIcons
            name={rosterExpanded ? 'expand-less' : 'expand-more'}
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {rosterExpanded && (
          <View style={styles.rosterList}>
            {familyMembers.map((m) => (
              <View
                key={m.id}
                style={[styles.rosterItem, { backgroundColor: colors.surfaceContainerHigh }]}
              >
                <MaterialIcons
                  name={roleIcons[m.role] || 'person'}
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <AccessibleText variant="bodyLarge" weight="800">
                    {m.name}{' '}
                    {m.id === member?.id ? (isVi ? '(Bạn)' : '(You)') : ''}
                  </AccessibleText>
                  <AccessibleText variant="caption" color={colors.textSecondary}>
                    {roleLabels[m.role]}
                    {m.isOwner ? (isVi ? ' • Chủ nhà' : ' • Family Owner') : ''}
                  </AccessibleText>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Account & Password / Personal QR Card (Production Accounts) */}
      {!isDemoAccount && (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {isVi ? 'Tài khoản & Bảo mật' : 'Account & Security'}
          </AccessibleText>
          <AccessibleText variant="caption" color={colors.textSecondary} style={{ marginVertical: 4 }}>
            {accountEmail
              ? isVi
                ? `Email đăng nhập: ${accountEmail} • Đang hoạt động trên ${activeSessions} thiết bị (tối đa 3)`
                : `Login email: ${accountEmail} • Active on ${activeSessions}/3 devices`
              : isVi
              ? 'Tài khoản đăng nhập bằng Mã QR (Chủ nhà chưa gắn Email & Mật khẩu)'
              : 'QR-only account (No Email & Password attached by Owner yet)'}
          </AccessibleText>

          {personalLoginCode && (
            <View style={{ marginVertical: 8 }}>
              <BigButton
                variant="secondary"
                title={
                  showPersonalQR
                    ? isVi
                      ? 'Ẩn Mã QR Đăng Nhập Cá Nhân'
                      : 'Hide Personal Login QR'
                    : isVi
                    ? 'Xem Mã QR Đăng Nhập Cá Nhân'
                    : 'Show Personal Login QR'
                }
                icon="qr-code-2"
                onPress={() => setShowPersonalQR(!showPersonalQR)}
              />
              {showPersonalQR && (
                <SecurityQRCard
                  title={isVi ? `Mã QR của ${member?.name}` : `${member?.name}'s Login QR`}
                  qrPayload={personalLoginCode}
                  isLoginSecret
                />
              )}
            </View>
          )}

          {hasPassword || isOwner ? (
            <View style={{ marginTop: 10 }}>
              <AccessibleText variant="label" weight="800" style={{ marginBottom: 6 }}>
                {hasPassword
                  ? isVi
                    ? 'Đổi mật khẩu của bạn:'
                    : 'Change your password:'
                  : isVi
                  ? 'Thiết lập Email & Mật khẩu cho Chủ nhà:'
                  : 'Set Email & Password for Owner:'}
              </AccessibleText>

              {isOwner && !hasPassword && (
                <TextInput
                  value={ownerNewEmail}
                  onChangeText={setOwnerNewEmail}
                  placeholder={isVi ? 'Email của Chủ nhà' : 'Owner email'}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceContainerHighest, color: colors.textDark },
                  ]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}

              {hasPassword && (
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={isVi ? 'Mật khẩu hiện tại' : 'Current password'}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceContainerHighest, color: colors.textDark },
                  ]}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}

              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={isVi ? 'Mật khẩu mới (tối thiểu 8 ký tự)' : 'New password (min 8 chars)'}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                    color: colors.textDark,
                    marginBottom: 10,
                  },
                ]}
                secureTextEntry
                autoCapitalize="none"
              />

              <BigButton
                title={isVi ? 'Cập nhật mật khẩu' : 'Update Password'}
                icon="lock-reset"
                onPress={handleChangePassword}
                loading={savingPassword}
              />
            </View>
          ) : (
            <View style={[styles.noticePill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
              <AccessibleText variant="caption" color={colors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                {isVi
                  ? 'Nếu bạn muốn đăng nhập bằng Email & Mật khẩu, hãy nhờ Chủ nhà gắn Email và mật khẩu khởi tạo trong Bảng Quản Trị Chủ Nhà.'
                  : 'To sign in with Email & Password, ask your Family Owner to set them in the Owner Console.'}
              </AccessibleText>
            </View>
          )}
        </View>
      )}

      {/* Theme Selector (Light / Dark / System) */}
      <ThemeSelector />

      {/* Text Size Selector (Role Auto / Normal / Large / Extra Large) */}
      <TextSizeSelector />

      {/* Language Selector (VI / EN / Auto) */}
      <LanguageSelector />

      {/* Hardware Permissions Card */}
      <View
        style={[
          styles.permCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <AccessibleText variant="h2" style={{ marginBottom: 4 }}>
          {isVi ? 'Quyền truy cập thiết bị' : 'Device Permissions'}
        </AccessibleText>
        <AccessibleText
          variant="caption"
          color={colors.textSecondary}
          style={{ marginBottom: 12 }}
        >
          {isVi
            ? 'Cấp quyền để ghi âm lời nhắn 15s và quét mã QR gia đình'
            : 'Allow microphone and camera for voice notes and QR pairing'}
        </AccessibleText>

        <TouchableOpacity
          onPress={handleRequestMic}
          style={[styles.permRow, { backgroundColor: colors.surfaceSubtle }]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <AccessibleText variant="bodyLarge" weight="700">
              {isVi ? 'Micro ghi âm giọng nói' : 'Microphone Access'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Dùng cho Nhật ký 15 giây & Lời chúc ngủ ngon' : 'For 15s voice diary & bedtime notes'}
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
              color={micPerm === 'granted' ? colors.success : colors.primary}
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
          style={[styles.permRow, { backgroundColor: colors.surfaceSubtle, marginTop: 8 }]}
          accessibilityRole="button"
        >
          <View style={{ flex: 1 }}>
            <AccessibleText variant="bodyLarge" weight="700">
              {isVi ? 'Máy ảnh quét QR & Chụp ảnh' : 'Camera Access'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Dùng để quét mã gia đình và đính kèm ảnh' : 'For family QR scan and photo attachments'}
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
              color={camPerm === 'granted' ? colors.success : colors.primary}
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
          title={isVi ? 'Đăng xuất khỏi thiết bị này' : 'Sign Out'}
          icon="logout"
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  profileCard: {
    borderRadius: 32,
    padding: 20,
    marginBottom: 10,
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
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
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
  sectionCard: {
    borderRadius: 28,
    padding: 18,
    marginVertical: 6,
    borderWidth: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterList: {
    marginTop: 14,
    gap: 8,
  },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginVertical: 4,
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
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
