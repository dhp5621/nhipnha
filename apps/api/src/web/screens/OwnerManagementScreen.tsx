import React, { useEffect, useState } from 'react';
import type { FamilyInvite, Member, Role } from '@nhipnha/shared';
import { getInviteStatus } from '@nhipnha/shared';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { SecurityQRCard } from '../components/SecurityQRCard';
import { MIcon } from '../components/MIcon';

interface OwnerManagementScreenProps {
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OwnerManagementScreen: React.FC<OwnerManagementScreenProps> = ({ onBack }) => {
  const { family, member, personalLoginCode } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const isVi = activeLanguage === 'vi';

  const [tab, setTab] = useState<'members' | 'invites' | 'owner_qr'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add Member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('CHILD');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedMemberQR, setGeneratedMemberQR] = useState<{
    memberName: string;
    role: Role;
    loginCode: string;
  } | null>(null);

  // Edit Member
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('CHILD');

  // Create Invite
  const [inviteRole, setInviteRole] = useState<Role>('CHILD');
  const [inviteName, setInviteName] = useState('');
  const [inviteTtlHours, setInviteTtlHours] = useState<number>(72);
  const [latestInviteQR, setLatestInviteQR] = useState<{
    code: string;
    qrPayload: string;
    role: Role;
  } | null>(null);

  const [alertMsg, setAlertMsg] = useState<{ title: string; message: string; isError?: boolean } | null>(null);

  const roleOptions: { id: Role; labelVi: string; labelEn: string; icon: string }[] = [
    { id: 'CHILD', labelVi: 'Trẻ em', labelEn: 'Child', icon: 'child_care' },
    { id: 'PARENT', labelVi: 'Phụ huynh', labelEn: 'Parent', icon: 'supervisor_account' },
    { id: 'GRANDPARENT', labelVi: 'Ông / Bà', labelEn: 'Elder', icon: 'elderly' },
  ];

  const loadData = async () => {
    if (!family?.id) return;
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        apiClient.getFamilyMembers(family.id),
        apiClient.getFamilyInvites(family.id),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } catch (err: any) {
      console.warn('Load owner data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [family?.id]);

  const handleAddMember = async () => {
    if (!family?.id) return;
    if (!newName.trim()) {
      setAlertMsg({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tên thành viên', isError: true });
      return;
    }
    if (newEmail.trim() && !EMAIL_RE.test(newEmail.trim())) {
      setAlertMsg({ title: 'Email lỗi', message: 'Định dạng email không hợp lệ', isError: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.addFamilyMember(family.id, {
        name: newName.trim(),
        role: newRole,
        email: newEmail.trim() || undefined,
        password: newPassword.trim() || undefined,
      });

      setGeneratedMemberQR({
        memberName: res.member.name,
        role: res.member.role,
        loginCode: res.loginCode || `USER-${res.member.id.slice(-8)}`,
      });

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await loadData();
    } catch (err: any) {
      setAlertMsg({ title: 'Lỗi', message: err?.message || 'Không thể thêm thành viên', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (targetMemberId: string) => {
    if (!family?.id) return;
    setSubmitting(true);
    try {
      await apiClient.updateFamilyMember(family.id, targetMemberId, {
        name: editName.trim() || undefined,
        role: editRole,
      });
      setEditingMemberId(null);
      await loadData();
    } catch (err: any) {
      setAlertMsg({ title: 'Lỗi', message: err?.message || 'Không thể cập nhật thành viên', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (targetMember: Member) => {
    if (!family?.id) return;
    if (!confirm(isVi ? `Xác nhận xóa thành viên "${targetMember.name}" khỏi gia đình?` : `Remove ${targetMember.name}?`)) {
      return;
    }

    try {
      await apiClient.deleteFamilyMember(family.id, targetMember.id);
      await loadData();
    } catch (err: any) {
      setAlertMsg({ title: 'Lỗi', message: err?.message || 'Không thể xóa thành viên', isError: true });
    }
  };

  const handleCreateInvite = async () => {
    if (!family?.id) return;
    setSubmitting(true);
    try {
      const res = await apiClient.createFamilyInvite(family.id, {
        role: inviteRole,
        memberName: inviteName.trim() || undefined,
        ttlHours: inviteTtlHours,
      });

      setLatestInviteQR({
        code: res.invite.code,
        qrPayload: res.qrPayload,
        role: res.invite.role,
      });

      setInviteName('');
      await loadData();
    } catch (err: any) {
      setAlertMsg({ title: 'Lỗi', message: err?.message || 'Không thể tạo mã mời', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!family?.id) return;
    try {
      await apiClient.revokeInvite(family.id, inviteId);
      await loadData();
    } catch (err: any) {
      setAlertMsg({ title: 'Lỗi', message: err?.message || 'Không thể thu hồi mã mời', isError: true });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 16,
    fontSize: 14,
    backgroundColor: colors.surfaceContainer,
    border: `1.5px solid ${colors.outlineVariant}`,
    color: colors.textDark,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 820,
        margin: '0 auto',
        padding: '20px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          type="button"
          style={{
            border: 'none',
            backgroundColor: colors.surfaceContainerHigh,
            width: 44,
            height: 44,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MIcon name="arrow_back" size={22} color={colors.textDark} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AccessibleText variant="h1" weight="900" color={colors.textDark}>
              {isVi ? 'Bảng Quản Trị Chủ Nhà' : 'Owner Console'}
            </AccessibleText>
            <span
              style={{
                backgroundColor: '#FFDCC6',
                color: '#331200',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              Host Owner
            </span>
          </div>
          <AccessibleText variant="caption" color={colors.textSecondary}>
            {family?.name} • <code>{family?.code}</code>
          </AccessibleText>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: colors.surfaceContainerLow,
          padding: 4,
          borderRadius: 999,
        }}
      >
        {[
          { id: 'members', label: isVi ? 'Thành Viên' : 'Members', icon: 'groups' },
          { id: 'invites', label: isVi ? 'Mã Mời & QR' : 'Invites & QR', icon: 'qr_code' },
          { id: 'owner_qr', label: isVi ? 'QR Chủ Nhà' : 'Owner QR', icon: 'admin_panel_settings' },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              type="button"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: active ? colors.primary : 'transparent',
                color: active ? colors.onPrimary : colors.textSecondary,
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MIcon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Members Roster & Add Member */}
      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add member form */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 28,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MIcon name="person_add" size={22} color={colors.primary} />
              <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                {isVi ? 'Thêm Thành Viên Vào Gia Đình' : 'Add Family Member'}
              </AccessibleText>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={isVi ? 'Tên thành viên (Bé An, Bà Nội...)' : 'Member name'}
                style={inputStyle}
              />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={isVi ? 'Email (tùy chọn)' : 'Email (optional)'}
                style={inputStyle}
              />
            </div>

            {/* Role picker */}
            <div style={{ display: 'flex', gap: 8 }}>
              {roleOptions.map((r) => {
                const active = newRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNewRole(r.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 16,
                      border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                      backgroundColor: active ? colors.primaryContainer : colors.surfaceContainer,
                      color: active ? colors.onPrimaryContainer : colors.textDark,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <MIcon name={r.icon} size={18} />
                    <span>{isVi ? r.labelVi : r.labelEn}</span>
                  </button>
                );
              })}
            </div>

            <BigButton
              variant="primary"
              iconName="add"
              onClick={handleAddMember}
              loading={submitting}
            >
              {isVi ? 'Thêm & Tạo Mã QR Đăng Nhập Riêng' : 'Add & Generate Personal QR'}
            </BigButton>
          </div>

          {/* Generated Member QR Display */}
          {generatedMemberQR && (
            <SecurityQRCard
              title={generatedMemberQR.memberName}
              subtitle={isVi ? 'Đưa mã này cho thành viên quét để đăng nhập 1 chạm' : 'Scan for instant login'}
              codeText={generatedMemberQR.loginCode}
              badgeLabel={generatedMemberQR.role}
            />
          )}

          {/* Member Roster List */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 28,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? `Danh Sách Thành Viên (${members.length})` : `Members Roster (${members.length})`}
            </AccessibleText>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map((m) => {
                const isEditing = editingMemberId === m.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 20,
                      backgroundColor: colors.surfaceContainer,
                      border: `1px solid ${colors.outlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    {!isEditing ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: '50%',
                              backgroundColor: colors.primaryContainer,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MIcon
                              name={m.role === 'CHILD' ? 'child_care' : m.role === 'PARENT' ? 'supervisor_account' : 'elderly'}
                              size={22}
                              color={colors.onPrimaryContainer}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 15, fontWeight: 900, color: colors.textDark }}>
                                {m.name}
                              </span>
                              {m.isOwner ? (
                                <span
                                  style={{
                                    backgroundColor: '#FFDCC6',
                                    color: '#331200',
                                    fontSize: 10,
                                    fontWeight: 900,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                  }}
                                >
                                  Owner
                                </span>
                              ) : null}
                            </div>
                            <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                              {m.role} {m.email ? `• ${m.email}` : ''}
                            </span>
                          </div>
                        </div>

                        {!m.isOwner && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                setEditingMemberId(m.id);
                                setEditName(m.name);
                                setEditRole(m.role);
                              }}
                              type="button"
                              style={{
                                border: 'none',
                                backgroundColor: colors.surfaceContainerHighest,
                                padding: '6px 12px',
                                borderRadius: 999,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 800,
                                color: colors.textDark,
                              }}
                            >
                              {isVi ? 'Sửa' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m)}
                              type="button"
                              style={{
                                border: 'none',
                                backgroundColor: colors.errorBg,
                                color: colors.error,
                                padding: '6px 12px',
                                borderRadius: 999,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {isVi ? 'Xóa' : 'Remove'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={inputStyle}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          {roleOptions.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setEditRole(r.id)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 12,
                                border: editRole === r.id ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                                backgroundColor: editRole === r.id ? colors.primaryContainer : colors.surfaceContainer,
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {isVi ? r.labelVi : r.labelEn}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleUpdateMember(m.id)}
                            type="button"
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: 14,
                              border: 'none',
                              backgroundColor: colors.primary,
                              color: colors.onPrimary,
                              fontWeight: 800,
                            }}
                          >
                            {isVi ? 'Lưu Thay Đổi' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingMemberId(null)}
                            type="button"
                            style={{
                              padding: '10px 16px',
                              borderRadius: 14,
                              border: 'none',
                              backgroundColor: colors.surfaceContainerHighest,
                              fontWeight: 800,
                            }}
                          >
                            {isVi ? 'Hủy' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Invites & Dynamic QR */}
      {tab === 'invites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Create Invite */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 28,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MIcon name="add_link" size={22} color={colors.primary} />
              <AccessibleText variant="h2" weight="900" color={colors.textDark}>
                {isVi ? 'Tạo Mã Mời Gia Đình Mới' : 'Create Family Invite'}
              </AccessibleText>
            </div>

            <input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder={isVi ? 'Tên người được mời (tùy chọn)' : 'Invitee name (optional)'}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              {roleOptions.map((r) => {
                const active = inviteRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setInviteRole(r.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 16,
                      border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                      backgroundColor: active ? colors.primaryContainer : colors.surfaceContainer,
                      color: active ? colors.onPrimaryContainer : colors.textDark,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <MIcon name={r.icon} size={18} />
                    <span>{isVi ? r.labelVi : r.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* TTL */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { h: 24, l: isVi ? 'Hạn 24 giờ' : '24 Hours' },
                { h: 72, l: isVi ? 'Hạn 3 ngày' : '3 Days' },
                { h: 168, l: isVi ? 'Hạn 7 ngày' : '7 Days' },
              ].map((opt) => {
                const active = inviteTtlHours === opt.h;
                return (
                  <button
                    key={opt.h}
                    type="button"
                    onClick={() => setInviteTtlHours(opt.h)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 14,
                      border: active ? `2px solid ${colors.secondary}` : `1px solid ${colors.outlineVariant}`,
                      backgroundColor: active ? colors.secondaryContainer : colors.surfaceContainer,
                      color: active ? colors.onSecondaryContainer : colors.textDark,
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>

            <BigButton
              variant="secondary"
              iconName="qr_code"
              onClick={handleCreateInvite}
              loading={submitting}
            >
              {isVi ? 'Tạo Mã & Tải Ảnh QR Mời' : 'Generate Invite & QR'}
            </BigButton>
          </div>

          {/* Latest Invite QR Card */}
          {latestInviteQR && (
            <SecurityQRCard
              title={isVi ? `Mã Mời: ${latestInviteQR.code}` : `Invite Code: ${latestInviteQR.code}`}
              subtitle={isVi ? 'Người thân chỉ cần quét mã này là vào ngay gia đình' : 'Scan to join family instantly'}
              codeText={latestInviteQR.code}
              qrPayload={latestInviteQR.qrPayload}
              badgeLabel={latestInviteQR.role}
            />
          )}

          {/* Active Invites List */}
          <div
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: 28,
              padding: 22,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? `Danh Sách Mã Mời (${invites.length})` : `Invite Codes (${invites.length})`}
            </AccessibleText>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invites.map((inv) => {
                const status = getInviteStatus(inv);
                return (
                  <div
                    key={inv.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 18,
                      backgroundColor: colors.surfaceContainer,
                      border: `1px solid ${colors.outlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <code style={{ fontSize: 16, fontWeight: 900, color: colors.primary }}>
                        {inv.code}
                      </code>
                      <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                        {inv.role} {inv.memberName ? `• ${inv.memberName}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 999,
                          backgroundColor:
                            status === 'ACTIVE'
                              ? '#DCFCE7'
                              : status === 'USED'
                              ? colors.surfaceContainerHighest
                              : colors.errorBg,
                          color:
                            status === 'ACTIVE'
                              ? '#15803D'
                              : status === 'USED'
                              ? colors.textSecondary
                              : colors.error,
                        }}
                      >
                        {status}
                      </span>

                      {status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          type="button"
                          style={{
                            border: 'none',
                            backgroundColor: colors.errorBg,
                            color: colors.error,
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {isVi ? 'Hủy' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Owner QR Credentials */}
      {tab === 'owner_qr' && (
        <SecurityQRCard
          title={isVi ? `Mã Chủ Nhà: ${member?.name}` : `Owner: ${member?.name}`}
          subtitle={isVi ? 'Mã QR quyền cao nhất của chủ hộ. Vui lòng giữ bí mật.' : 'Master credentials for the family host.'}
          codeText={personalLoginCode || `OWNER-${family?.code}`}
          badgeLabel="MASTER OWNER"
        />
      )}

      {/* Alert modal */}
      {alertMsg && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 24,
              borderRadius: 28,
              maxWidth: 400,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {alertMsg.title}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
              {alertMsg.message}
            </AccessibleText>
            <BigButton variant="primary" onClick={() => setAlertMsg(null)}>
              OK
            </BigButton>
          </div>
        </div>
      )}
    </div>
  );
};
