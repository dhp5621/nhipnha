import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { SecurityQRCard } from '../components/SecurityQRCard';
import { getInviteStatus, type FamilyInvite, type Member, type Role } from '@nhipnha/shared';

interface OwnerManagementScreenProps {
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OwnerManagementScreen: React.FC<OwnerManagementScreenProps> = ({ onBack }) => {
  const { family, member, personalLoginCode, savePersonalLoginCode } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const isVi = activeLanguage === 'vi';

  const [tab, setTab] = useState<'members' | 'invites' | 'owner_qr'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add Member Form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('CHILD');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedMemberQR, setGeneratedMemberQR] = useState<{
    memberName: string;
    role: Role;
    loginCode: string;
  } | null>(null);

  // Edit Credentials for existing member
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('CHILD');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Create Invite Form
  const [inviteRole, setInviteRole] = useState<Role>('CHILD');
  const [inviteName, setInviteName] = useState('');
  const [latestInviteQR, setLatestInviteQR] = useState<{
    code: string;
    role: Role;
    qrPayload: string;
  } | null>(null);

  const loadData = async () => {
    if (!family?.id) return;
    setLoading(true);
    try {
      const [mList, invList] = await Promise.all([
        apiClient.getMembers(family.id),
        apiClient.listInvites(family.id).catch(() => []),
      ]);
      setMembers(mList);
      setInvites(invList);
    } catch (err: any) {
      Alert.alert(isVi ? 'Lỗi tải dữ liệu' : 'Load Error', err?.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [family?.id]);

  const roleLabels: Record<Role, string> = {
    CHILD: isVi ? 'Con nhỏ' : 'Child',
    PARENT: isVi ? 'Bố / Mẹ' : 'Parent',
    GRANDPARENT: isVi ? 'Ông / Bà' : 'Elder',
  };

  const roles: { id: Role; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'CHILD', label: roleLabels.CHILD, icon: 'child-care' },
    { id: 'PARENT', label: roleLabels.PARENT, icon: 'supervisor-account' },
    { id: 'GRANDPARENT', label: roleLabels.GRANDPARENT, icon: 'elderly' },
  ];

  const handleAddMemberDirectly = async () => {
    if (!family?.id) return;
    if (!newName.trim()) {
      Alert.alert(
        isVi ? 'Thiếu tên thành viên' : 'Missing Name',
        isVi ? 'Vui lòng đặt tên hiển thị cho thành viên.' : 'Please enter a display name.'
      );
      return;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const hasEmail = cleanEmail.length > 0;
    const hasPass = newPassword.length > 0;

    if (hasEmail && !hasPass) {
      Alert.alert(
        isVi ? 'Bắt buộc có mật khẩu' : 'Password Required',
        isVi
          ? 'Không cho phép đặt Email mà không có mật khẩu. Vui lòng nhập mật khẩu (tối thiểu 8 ký tự) hoặc để trống cả hai.'
          : 'Cannot set an email without a password. Please enter a password (min 8 chars) or leave both empty.'
      );
      return;
    }
    if (!hasEmail && hasPass) {
      Alert.alert(
        isVi ? 'Thiếu Email' : 'Email Required',
        isVi
          ? 'Vui lòng nhập địa chỉ Email đi kèm với mật khẩu.'
          : 'Please enter an email address to pair with the password.'
      );
      return;
    }
    if (hasEmail && (!EMAIL_RE.test(cleanEmail) || newPassword.length < 8)) {
      Alert.alert(
        isVi ? 'Thông tin chưa hợp lệ' : 'Invalid Credentials',
        isVi
          ? 'Email phải đúng định dạng và mật khẩu tối thiểu 8 ký tự.'
          : 'Please enter a valid email and a password of at least 8 characters.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.addMemberByOwner(family.id, {
        name: newName.trim(),
        role: newRole,
        email: hasEmail ? cleanEmail : undefined,
        password: hasPass ? newPassword : undefined,
      });

      setGeneratedMemberQR({
        memberName: res.member.name,
        role: res.member.role,
        loginCode: res.loginCode,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await loadData();
    } catch (err: any) {
      Alert.alert(isVi ? 'Không thể tạo thành viên' : 'Failed', err?.message || '');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingMember = (m: Member) => {
    setEditingMemberId(m.id);
    setEditName(m.name);
    setEditRole(m.role);
    setEditEmail(m.email || '');
    setEditPassword('');
  };

  const handleSaveMemberEdit = async (target: Member) => {
    if (!family?.id) return;
    setSubmitting(true);
    try {
      if (editName.trim() !== target.name || editRole !== target.role) {
        await apiClient.updateMember(family.id, target.id, {
          name: editName.trim() || target.name,
          role: editRole,
        });
      }

      const cleanEmail = editEmail.trim().toLowerCase();
      if (editPassword.length > 0 || (cleanEmail && cleanEmail !== (target.email || ''))) {
        if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
          throw new Error(isVi ? 'Email không hợp lệ.' : 'Invalid email address.');
        }
        if (editPassword.length < 8) {
          throw new Error(
            isVi
              ? 'Khi cấp hoặc cập nhật Email cho thành viên, cần nhập mật khẩu tối thiểu 8 ký tự.'
              : 'When setting or updating email, password must be at least 8 characters.'
          );
        }
        await apiClient.setMemberCredentials(family.id, target.id, cleanEmail, editPassword);
      }

      setEditingMemberId(null);
      await loadData();
      Alert.alert(
        isVi ? 'Đã lưu thay đổi' : 'Saved',
        isVi ? 'Thông tin và vai trò thành viên đã được cập nhật.' : 'Member updated.'
      );
    } catch (err: any) {
      Alert.alert(isVi ? 'Lỗi cập nhật' : 'Update Error', err?.message || '');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateMemberQR = async (m: Member) => {
    if (!family?.id) return;
    try {
      const code = await apiClient.regenerateMemberQR(family.id, m.id);
      if (m.id === member?.id) {
        await savePersonalLoginCode(code);
      }
      setGeneratedMemberQR({
        memberName: m.name,
        role: m.role,
        loginCode: code,
      });
      Alert.alert(
        isVi ? 'Đã cấp lại Mã QR mới' : 'New QR Issued',
        isVi
          ? 'Mã QR cũ đã bị vô hiệu hóa và các thiết bị cũ đã được đăng xuất an toàn.'
          : 'Old QR invalidated and previous devices signed out.'
      );
    } catch (err: any) {
      Alert.alert(isVi ? 'Không thể cấp lại QR' : 'Error', err?.message || '');
    }
  };

  const handleRemoveMember = (m: Member) => {
    if (!family?.id) return;
    Alert.alert(
      isVi ? `Xóa ${m.name} khỏi gia đình?` : `Remove ${m.name}?`,
      isVi
        ? 'Thành viên này sẽ bị đăng xuất khỏi mọi thiết bị ngay lập tức.'
        : 'This member will be signed out of all devices immediately.',
      [
        { text: isVi ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: isVi ? 'Xóa thành viên' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeMember(family.id, m.id);
              await loadData();
            } catch (err: any) {
              Alert.alert(isVi ? 'Không thể xóa' : 'Error', err?.message || '');
            }
          },
        },
      ]
    );
  };

  const handleCreateInvite = async () => {
    if (!family?.id) return;
    setSubmitting(true);
    try {
      const res = await apiClient.createInvite(family.id, {
        role: inviteRole,
        memberName: inviteName.trim() || undefined,
        ttlHours: 72,
      });
      setLatestInviteQR({
        code: res.invite.code,
        role: res.invite.role,
        qrPayload: JSON.stringify(res.qrPayload),
      });
      setInviteName('');
      await loadData();
    } catch (err: any) {
      Alert.alert(isVi ? 'Lỗi tạo mã mời' : 'Invite Error', err?.message || '');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inv: FamilyInvite) => {
    if (!family?.id) return;
    try {
      await apiClient.revokeInvite(family.id, inv.id);
      await loadData();
    } catch (err: any) {
      Alert.alert(isVi ? 'Lỗi thu hồi' : 'Error', err?.message || '');
    }
  };

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
        >
          <MaterialIcons name="arrow-back" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
          <AccessibleText variant="label" weight="800">
            {isVi ? 'Quay lại Cài đặt' : 'Back to Settings'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      <AccessibleText variant="display" weight="900">
        {isVi ? 'Quản trị Chủ Nhà' : 'Family Owner Console'}
      </AccessibleText>
      <AccessibleText variant="bodyRegular" color={colors.textSecondary} style={{ marginBottom: 14 }}>
        {isVi
          ? 'Tạo tài khoản theo vai trò, gắn Email/Mật khẩu và cấp mã QR đăng nhập cho từng thành viên.'
          : 'Create role-locked member accounts, assign Email/Password, and issue login QR codes.'}
      </AccessibleText>

      {/* Segmented Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surfaceContainer }]}>
        <TouchableOpacity
          onPress={() => setTab('members')}
          style={[
            styles.tabBtn,
            tab === 'members' && { backgroundColor: colors.primaryContainer },
          ]}
        >
          <AccessibleText
            variant="label"
            weight="800"
            color={tab === 'members' ? colors.onPrimaryContainer : colors.textSecondary}
          >
            {isVi ? 'Thành viên' : 'Members'}
          </AccessibleText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('invites')}
          style={[
            styles.tabBtn,
            tab === 'invites' && { backgroundColor: colors.primaryContainer },
          ]}
        >
          <AccessibleText
            variant="label"
            weight="800"
            color={tab === 'invites' ? colors.onPrimaryContainer : colors.textSecondary}
          >
            {isVi ? 'Mã mời 1 lần' : 'Role Invites'}
          </AccessibleText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('owner_qr')}
          style={[
            styles.tabBtn,
            tab === 'owner_qr' && { backgroundColor: colors.primaryContainer },
          ]}
        >
          <AccessibleText
            variant="label"
            weight="800"
            color={tab === 'owner_qr' ? colors.onPrimaryContainer : colors.textSecondary}
          >
            {isVi ? 'QR Chủ nhà' : 'Owner QR'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
      ) : null}

      {tab === 'members' && (
        <View>
          {/* Newly Generated Member Login QR */}
          {generatedMemberQR && (
            <View>
              <SecurityQRCard
                title={
                  isVi
                    ? `Mã QR Đăng nhập: ${generatedMemberQR.memberName} (${roleLabels[generatedMemberQR.role]})`
                    : `Login QR: ${generatedMemberQR.memberName} (${roleLabels[generatedMemberQR.role]})`
                }
                subtitle={
                  isVi
                    ? 'Hãy đưa máy của thành viên này quét trực tiếp hoặc sao chép gửi riêng.'
                    : 'Scan directly with this member’s phone or share privately.'
                }
                qrPayload={generatedMemberQR.loginCode}
                isLoginSecret
              />
              <BigButton
                variant="secondary"
                title={isVi ? 'Ẩn mã QR này' : 'Dismiss QR Card'}
                icon="visibility-off"
                onPress={() => setGeneratedMemberQR(null)}
              />
            </View>
          )}

          {/* Create Member Account Card */}
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
            <AccessibleText variant="h2" weight="900">
              {isVi ? 'Thêm thành viên mới & Cấp tài khoản' : 'Add Member & Set Credentials'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary} style={{ marginVertical: 6 }}>
              {isVi
                ? 'Chủ nhà chọn vai trò cố định, đặt tên tùy chỉnh và có thể gắn Email + Mật khẩu. Nếu không gắn Email/Mật khẩu, thành viên sẽ đăng nhập bằng Mã QR.'
                : 'Assign a fixed role, custom name, and optional Email + Password.'}
            </AccessibleText>

            <View style={styles.roleRow}>
              {roles.map((r) => {
                const active = newRole === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setNewRole(r.id)}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: active
                          ? colors.primaryContainer
                          : colors.surfaceContainerHigh,
                        borderRadius: active ? 999 : 18,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={r.icon}
                      size={22}
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
              value={newName}
              onChangeText={setNewName}
              placeholder={isVi ? 'Tên thành viên (VD: Bà Nội, Bé Bi)' : 'Member custom name'}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceContainerHighest, color: colors.textDark },
              ]}
            />

            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder={isVi ? 'Email đăng nhập (tùy chọn kèm mật khẩu)' : 'Login email (optional)'}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceContainerHighest, color: colors.textDark },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={
                isVi
                  ? 'Mật khẩu khởi tạo (tối thiểu 8 ký tự nếu có Email)'
                  : 'Initial password (min 8 chars if email set)'
              }
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  color: colors.textDark,
                  marginBottom: 12,
                },
              ]}
              secureTextEntry
              autoCapitalize="none"
            />

            <BigButton
              title={isVi ? 'Tạo Thành Viên & Xuất Mã QR' : 'Create Member & Generate QR'}
              icon="person-add"
              onPress={handleAddMemberDirectly}
              loading={submitting}
            />
          </View>

          {/* Existing Roster Management */}
          <AccessibleText variant="h2" weight="900" style={{ marginTop: 12, marginBottom: 8 }}>
            {isVi ? `Danh sách thành viên (${members.length})` : `Family Roster (${members.length})`}
          </AccessibleText>

          {members.map((m) => {
            const isEditing = editingMemberId === m.id;
            return (
              <View
                key={m.id}
                style={[styles.memberCard, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <View style={styles.memberHeader}>
                  <View style={{ flex: 1 }}>
                    <AccessibleText variant="h2" weight="800">
                      {m.name} {m.isOwner ? (isVi ? '• Chủ nhà' : '• Owner') : ''}
                    </AccessibleText>
                    <AccessibleText variant="caption" color={colors.primary} weight="800">
                      {isVi ? 'Vai trò:' : 'Role:'} {roleLabels[m.role]}
                    </AccessibleText>
                    <AccessibleText variant="caption" color={colors.textSecondary}>
                      {m.email
                        ? `Email: ${m.email} (${isVi ? 'Đã có mật khẩu' : 'Password enabled'})`
                        : isVi
                        ? 'Chưa gắn Email/Mật khẩu (Chỉ đăng nhập bằng QR)'
                        : 'QR login only (No email/password set)'}
                    </AccessibleText>
                  </View>

                  <TouchableOpacity
                    onPress={() => (isEditing ? setEditingMemberId(null) : startEditingMember(m))}
                    style={[styles.iconAction, { backgroundColor: colors.surfaceContainerHigh }]}
                  >
                    <MaterialIcons
                      name={isEditing ? 'close' : 'edit'}
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {isEditing && (
                  <View style={styles.editSection}>
                    <AccessibleText variant="label" weight="700" style={{ marginBottom: 6 }}>
                      {isVi ? 'Đổi tên & Vai trò:' : 'Edit Name & Role:'}
                    </AccessibleText>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceContainerHighest, color: colors.textDark },
                      ]}
                    />

                    <View style={styles.roleRow}>
                      {roles.map((r) => {
                        const active = editRole === r.id;
                        return (
                          <TouchableOpacity
                            key={r.id}
                            onPress={() => setEditRole(r.id)}
                            style={[
                              styles.rolePill,
                              {
                                backgroundColor: active
                                  ? colors.primaryContainer
                                  : colors.surfaceContainerHigh,
                                borderRadius: active ? 999 : 14,
                              },
                            ]}
                          >
                            <AccessibleText
                              variant="caption"
                              weight="800"
                              color={active ? colors.onPrimaryContainer : colors.textDark}
                            >
                              {r.label}
                            </AccessibleText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {!m.isOwner && (
                      <>
                        <AccessibleText variant="label" weight="700" style={{ marginTop: 6 }}>
                          {isVi
                            ? 'Cấp / Đổi Email & Mật khẩu cho thành viên này:'
                            : 'Set / Reset Email & Password:'}
                        </AccessibleText>
                        <TextInput
                          value={editEmail}
                          onChangeText={setEditEmail}
                          placeholder="Email"
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surfaceContainerHighest,
                              color: colors.textDark,
                            },
                          ]}
                          autoCapitalize="none"
                        />
                        <TextInput
                          value={editPassword}
                          onChangeText={setEditPassword}
                          placeholder={
                            isVi ? 'Mật khẩu mới (tối thiểu 8 ký tự)' : 'New password (min 8 chars)'
                          }
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
                      </>
                    )}

                    <BigButton
                      title={isVi ? 'Lưu cập nhật' : 'Save Changes'}
                      icon="check"
                      onPress={() => handleSaveMemberEdit(m)}
                      loading={submitting}
                    />
                  </View>
                )}

                <View style={styles.memberActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleRegenerateMemberQR(m)}
                    style={[styles.smallBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                  >
                    <MaterialIcons name="qr-code" size={16} color={colors.primary} />
                    <AccessibleText variant="caption" weight="800" color={colors.primary}>
                      {isVi ? ' Cấp mã QR đăng nhập' : ' Issue Login QR'}
                    </AccessibleText>
                  </TouchableOpacity>

                  {!m.isOwner && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(m)}
                      style={[
                        styles.smallBtn,
                        { backgroundColor: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEE2E2' },
                      ]}
                    >
                      <MaterialIcons
                        name="person-remove"
                        size={16}
                        color={isDark ? '#FCA5A5' : '#B91C1C'}
                      />
                      <AccessibleText
                        variant="caption"
                        weight="800"
                        color={isDark ? '#FCA5A5' : '#B91C1C'}
                      >
                        {isVi ? ' Xóa' : ' Remove'}
                      </AccessibleText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {tab === 'invites' && (
        <View>
          {latestInviteQR && (
            <SecurityQRCard
              title={
                isVi
                  ? `Mã mời 1 lần (${roleLabels[latestInviteQR.role]})`
                  : `Single-use Invite (${roleLabels[latestInviteQR.role]})`
              }
              subtitle={
                isVi
                  ? 'Người quét mã này sẽ tự động vào gia đình với đúng vai trò đã chọn.'
                  : 'Scanning this code automatically registers the member with the fixed role.'
              }
              qrPayload={latestInviteQR.qrPayload}
              codeBadge={latestInviteQR.code}
              isLoginSecret={false}
            />
          )}

          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
            <AccessibleText variant="h2" weight="900">
              {isVi ? 'Tạo Mã Mời Quét Nhanh Theo Vai Trò' : 'Create Role-Locked Invite QR'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary} style={{ marginVertical: 6 }}>
              {isVi
                ? 'Mã mời chỉ dùng được 1 lần duy nhất và tự hết hạn sau 72 giờ. Người quét không thể tự ý đổi vai trò.'
                : 'Single-use code valid for 72 hours. The person joining cannot alter the assigned role.'}
            </AccessibleText>

            <View style={styles.roleRow}>
              {roles.map((r) => {
                const active = inviteRole === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setInviteRole(r.id)}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: active
                          ? colors.primaryContainer
                          : colors.surfaceContainerHigh,
                        borderRadius: active ? 999 : 18,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={r.icon}
                      size={22}
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
              value={inviteName}
              onChangeText={setInviteName}
              placeholder={
                isVi ? 'Tên gợi ý sẵn cho người quét (tùy chọn)' : 'Pre-filled name (optional)'
              }
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  color: colors.textDark,
                  marginBottom: 12,
                },
              ]}
            />

            <BigButton
              title={isVi ? 'Tạo Mã Mời & Mã QR' : 'Generate Invite & QR'}
              icon="qr-code-2"
              onPress={handleCreateInvite}
              loading={submitting}
            />
          </View>

          {invites.map((inv) => {
            const st = getInviteStatus(inv);
            return (
              <View
                key={inv.id}
                style={[styles.memberCard, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <View style={styles.memberHeader}>
                  <View style={{ flex: 1 }}>
                    <AccessibleText variant="h2" weight="900">
                      {inv.code}
                    </AccessibleText>
                    <AccessibleText variant="caption" color={colors.primary} weight="800">
                      {isVi ? 'Vai trò ấn định:' : 'Assigned Role:'} {roleLabels[inv.role]}
                      {inv.memberName ? ` • ${inv.memberName}` : ''}
                    </AccessibleText>
                    <AccessibleText variant="caption" color={colors.textSecondary}>
                      {st === 'ACTIVE'
                        ? isVi
                          ? 'Đang có hiệu lực (Chưa dùng)'
                          : 'Active (Unused)'
                        : st === 'USED'
                        ? isVi
                          ? `Đã sử dụng bởi ${inv.usedByName || 'thành viên'}`
                          : `Used by ${inv.usedByName || 'member'}`
                        : isVi
                        ? 'Đã thu hồi / Hết hạn'
                        : 'Revoked / Expired'}
                    </AccessibleText>
                  </View>

                  {st === 'ACTIVE' && (
                    <TouchableOpacity
                      onPress={() => handleRevokeInvite(inv)}
                      style={[
                        styles.smallBtn,
                        { backgroundColor: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEE2E2' },
                      ]}
                    >
                      <AccessibleText
                        variant="caption"
                        weight="800"
                        color={isDark ? '#FCA5A5' : '#B91C1C'}
                      >
                        {isVi ? 'Thu hồi' : 'Revoke'}
                      </AccessibleText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {tab === 'owner_qr' && (
        <View>
          {personalLoginCode ? (
            <SecurityQRCard
              title={isVi ? 'Mã QR Đăng nhập Chủ Nhà' : 'Owner Personal Login QR'}
              subtitle={
                isVi
                  ? 'Dùng mã QR này để đăng nhập lại quyền Chủ nhà trên máy mới mà không cần mật khẩu.'
                  : 'Use this QR to sign back into your Owner account on another device.'
              }
              qrPayload={personalLoginCode}
              isLoginSecret
            />
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
              <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
                {isVi
                  ? 'Chưa có mã QR Chủ nhà lưu trên thiết bị này. Bấm nút bên dưới để cấp mã QR Chủ nhà mới.'
                  : 'No Owner QR stored on this device yet. Tap below to issue a new Owner QR.'}
              </AccessibleText>
            </View>
          )}

          {member && (
            <BigButton
              variant="secondary"
              title={
                isVi
                  ? 'Cấp lại Mã QR Chủ Nhà mới (Vô hiệu hóa QR cũ)'
                  : 'Regenerate Owner QR (Invalidate Old QR)'
              }
              icon="autorenew"
              onPress={() => handleRegenerateMemberQR(member)}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 90,
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
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  card: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginVertical: 4,
  },
  memberCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  memberActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
