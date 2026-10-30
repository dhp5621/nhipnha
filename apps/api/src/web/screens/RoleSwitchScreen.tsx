import React, { useState } from 'react';
import type { Role } from '@nhipnha/shared';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, type TextScalePreference } from '../context/ThemeContext';
import { apiClient } from '../services/api';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { SecurityQRCard } from '../components/SecurityQRCard';
import { MIcon } from '../components/MIcon';
import { GoogleLoadingIndicator } from '../components/GoogleLoadingIndicator';

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
  const { activeLanguage, setLanguagePreference } = useLanguage();
  const {
    colors,
    isDark,
    themeMode,
    setThemeMode,
    textScale,
    setTextScale,
  } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [changingPass, setChangingPass] = useState(false);
  const [switchingRoleId, setSwitchingRoleId] = useState<Role | null>(null);
  const [showPersonalQR, setShowPersonalQR] = useState(false);

  const isVi = activeLanguage === 'vi';

  const roleOptions: { id: Role; labelVi: string; labelEn: string; icon: string; descVi: string; descEn: string }[] = [
    {
      id: 'CHILD',
      labelVi: 'Bé An (6–12 tuổi)',
      labelEn: 'Child (6–12 yo)',
      icon: 'child_care',
      descVi: 'Trẻ em ở quê: Chạm Sáng, Chạm Chiều 15s & Chạm Tối',
      descEn: 'At home: Morning, 15s Afternoon & Bedtime rhythms',
    },
    {
      id: 'PARENT',
      labelVi: 'Mẹ Hoa (28–42 tuổi)',
      labelEn: 'Parent (28–42 yo)',
      icon: 'supervisor_account',
      descVi: 'Công nhân làm xa: Dòng thời gian, AI Thấu Cảm & Voice 30s',
      descEn: 'Working away: Timeline, AI Empathy & Bedtime voice note',
    },
    {
      id: 'GRANDPARENT',
      labelVi: 'Bà Nội (65–70 tuổi)',
      labelEn: 'Grandparent (65–70 yo)',
      icon: 'elderly',
      descVi: 'Chăm cháu ở quê: Chữ cực lớn, tương phản cao WCAG AAA',
      descEn: 'Elderly caregiver: Ultra large text, high contrast AAA',
    },
  ];

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: isVi ? 'Vui lòng nhập đầy đủ thông tin' : 'Please fill all fields', isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: isVi ? 'Mật khẩu mới tối thiểu 8 ký tự' : 'Min 8 chars required', isError: true });
      return;
    }

    setChangingPass(true);
    setPasswordMsg(null);
    try {
      await apiClient.changePassword(currentPassword, newPassword, family?.id);
      setPasswordMsg({ text: isVi ? 'Đổi mật khẩu thành công!' : 'Password changed successfully!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err?.message || (isVi ? 'Đổi mật khẩu thất bại' : 'Failed to change password'), isError: true });
    } finally {
      setChangingPass(false);
    }
  };

  const handleSelectRole = async (targetRole: Role) => {
    if (member?.role === targetRole || switchingRoleId !== null) return;
    setSwitchingRoleId(targetRole);
    try {
      await new Promise((r) => setTimeout(r, 450));
      await switchRole(targetRole);
    } finally {
      setSwitchingRoleId(null);
    }
  };

  const handleLogout = async () => {
    if (confirm(isVi ? 'Bạn có chắc chắn muốn ngắt kết nối thiết bị này?' : 'Disconnect this device?')) {
      await logout();
      onGoToLogin();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 780,
        margin: '0 auto',
        padding: '20px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <AccessibleText variant="h1" weight="900" color={colors.textDark}>
              {isVi ? 'Cài Đặt & Vai Trò' : 'Settings & Role'}
            </AccessibleText>
            <div>
              <AccessibleText variant="caption" color={colors.textSecondary}>
                {family?.name} • <code>{family?.code}</code>
              </AccessibleText>
            </div>
          </div>
        </div>

        {isOwner && onOpenOwnerConsole && (
          <button
            onClick={onOpenOwnerConsole}
            type="button"
            style={{
              border: 'none',
              backgroundColor: isDark ? 'rgba(255, 181, 156, 0.2)' : '#FFDCC6',
              color: isDark ? '#FFB59C' : '#331200',
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MIcon name="admin_panel_settings" size={18} color="#9C4400" />
            <span>{isVi ? 'Quản Trị Chủ Nhà' : 'Owner Console'}</span>
          </button>
        )}
      </div>

      {/* Persona Role Switcher */}
      <div
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 30,
          padding: 22,
          border: `1px solid ${colors.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MIcon name="switch_account" size={22} color={colors.primary} />
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Chuyển Đổi Vai Trò Trực Tiếp' : 'Switch Active Role'}
          </AccessibleText>
        </div>

        <AccessibleText variant="caption" color={colors.textSecondary}>
          {isVi
            ? 'Cho phép trải nghiệm mượt mà góc nhìn của Trẻ em ở quê, Phụ huynh làm việc xa hoặc Ông bà già yếu.'
            : 'Instantly experience the perspective of the Child, Parent, or Grandparent.'}
        </AccessibleText>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roleOptions.map((opt) => {
            const isCurrent = member?.role === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectRole(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 22,
                  backgroundColor: isCurrent ? colors.primaryContainer : colors.surfaceContainer,
                  border: isCurrent ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? colors.primary : colors.surfaceContainerHighest,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MIcon
                    name={opt.icon}
                    size={24}
                    color={isCurrent ? colors.onPrimary : colors.textSecondary}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isCurrent ? colors.onPrimaryContainer : colors.textDark }}>
                      {isVi ? opt.labelVi : opt.labelEn}
                    </span>
                    {isCurrent ? (
                      <span
                        style={{
                          backgroundColor: colors.primary,
                          color: colors.onPrimary,
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {isVi ? 'Hiện Tại' : 'Active'}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 12, color: isCurrent ? colors.onPrimaryContainer : colors.textSecondary, fontWeight: 600 }}>
                    {isVi ? opt.descVi : opt.descEn}
                  </span>
                </div>

                <MIcon
                  name={isCurrent ? 'radio_button_checked' : 'radio_button_unchecked'}
                  size={20}
                  color={isCurrent ? colors.primary : colors.textMuted}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Login QR Credential Card */}
      <div
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 30,
          padding: 22,
          border: `1px solid ${colors.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MIcon name="qr_code_2" size={22} color={colors.primary} />
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? 'Mã QR Đăng Nhập Cá Nhân' : 'Personal Login QR'}
            </AccessibleText>
          </div>

          <button
            onClick={() => setShowPersonalQR(!showPersonalQR)}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              color: colors.primary,
              fontWeight: 800,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {showPersonalQR ? (isVi ? 'Thu gọn' : 'Hide') : isVi ? 'Xem Mã QR' : 'Show QR'}
          </button>
        </div>

        {showPersonalQR && (
          <SecurityQRCard
            title={member?.name || 'Thành viên'}
            subtitle={isVi ? 'Quét mã này trên bất kỳ máy tính/điện thoại nào để vào ngay' : 'Scan to sign in instantly'}
            codeText={personalLoginCode || `USER-${member?.id?.slice(-8) || '8868'}`}
            qrPayload={personalLoginCode || undefined}
            badgeLabel={member?.role}
          />
        )}
      </div>

      {/* Display & Accessibility Settings */}
      <div
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 30,
          padding: 22,
          border: `1px solid ${colors.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MIcon name="palette" size={22} color={colors.primary} />
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Giao Diện & Trợ Năng (Accessibility)' : 'Appearance & Accessibility'}
          </AccessibleText>
        </div>

        {/* Theme mode */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 8 }}>
            {isVi ? 'Chế độ màu sắc:' : 'Color Theme:'}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'light', label: isVi ? 'Sáng' : 'Light', icon: 'wb_sunny' },
              { id: 'dark', label: isVi ? 'Tối' : 'Dark', icon: 'dark_mode' },
              { id: 'system', label: isVi ? 'Tự động' : 'System', icon: 'settings_brightness' },
            ].map((t) => {
              const active = themeMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeMode(t.id as any)}
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
                    gap: 6,
                  }}
                >
                  <MIcon name={t.icon} size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text scaling boost */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 8 }}>
            {isVi ? 'Kích thước chữ (Ưu tiên Người cao tuổi):' : 'Text Size (Elder Accessibility):'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {[
              { id: 'role_default', label: isVi ? 'Tự động theo vai' : 'Role default' },
              { id: 'normal', label: isVi ? 'Tiêu chuẩn (0pt)' : 'Normal' },
              { id: 'large', label: isVi ? 'Chữ lớn (+3pt)' : 'Large (+3pt)' },
              { id: 'extra_large', label: isVi ? 'Rất lớn (+6pt WCAG)' : 'XL (+6pt AAA)' },
            ].map((s) => {
              const active = textScale === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTextScale(s.id as any)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 16,
                    border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                    backgroundColor: active ? colors.primaryContainer : colors.surfaceContainer,
                    color: active ? colors.onPrimaryContainer : colors.textDark,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language switch */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 8 }}>
            {isVi ? 'Ngôn ngữ hiển thị:' : 'Language:'}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setLanguagePreference('vi')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 16,
                border: isVi ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                backgroundColor: isVi ? colors.primaryContainer : colors.surfaceContainer,
                color: isVi ? colors.onPrimaryContainer : colors.textDark,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setLanguagePreference('en')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 16,
                border: !isVi ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                backgroundColor: !isVi ? colors.primaryContainer : colors.surfaceContainer,
                color: !isVi ? colors.onPrimaryContainer : colors.textDark,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>

      {/* Account Security / Change Password */}
      <div
        style={{
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 30,
          padding: 22,
          border: `1px solid ${colors.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MIcon name="lock" size={22} color={colors.primary} />
          <AccessibleText variant="h2" weight="900" color={colors.textDark}>
            {isVi ? 'Bảo Mật Tài Khoản' : 'Account Security'}
          </AccessibleText>
        </div>

        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={isVi ? 'Mật khẩu hiện tại' : 'Current password'}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 16,
            fontSize: 14,
            backgroundColor: colors.surfaceContainer,
            border: `1.5px solid ${colors.outlineVariant}`,
            color: colors.textDark,
            boxSizing: 'border-box',
          }}
        />

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={isVi ? 'Mật khẩu mới (tối thiểu 8 ký tự)' : 'New password (min 8 chars)'}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 16,
            fontSize: 14,
            backgroundColor: colors.surfaceContainer,
            border: `1.5px solid ${colors.outlineVariant}`,
            color: colors.textDark,
            boxSizing: 'border-box',
          }}
        />

        {passwordMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: passwordMsg.isError
                ? colors.errorBg
                : isDark
                ? 'rgba(34, 197, 94, 0.22)'
                : '#DCFCE7',
              color: passwordMsg.isError
                ? colors.error
                : isDark
                ? '#86EFAC'
                : '#15803D',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {passwordMsg.text}
          </div>
        )}

        <BigButton
          variant="tonal"
          iconName="key"
          onClick={handleChangePassword}
          loading={changingPass}
        >
          {isVi ? 'Đổi Mật Khẩu' : 'Update Password'}
        </BigButton>
      </div>

      {/* Disconnect / Logout Action */}
      <BigButton
        variant="danger"
        iconName="logout"
        onClick={handleLogout}
      >
        {isVi ? 'Ngắt Kết Nối Thiết Bị & Đăng Xuất' : 'Disconnect Device & Log Out'}
      </BigButton>

      {/* Animated Role Switching Loading Overlay */}
      {switchingRoleId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: isDark ? 'rgba(21, 16, 12, 0.82)' : 'rgba(252, 246, 238, 0.86)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            animation: 'm3ScreenFadeIn 0.22s ease-out forwards',
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 32,
              backgroundColor: colors.surfaceContainer,
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: isDark
                ? '0 16px 48px rgba(0, 0, 0, 0.55)'
                : '0 16px 40px rgba(0, 0, 0, 0.12)',
              maxWidth: 320,
              width: '90%',
              textAlign: 'center',
            }}
          >
            <GoogleLoadingIndicator size={52} strokeWidth={4} multiColor={true} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: colors.textDark, marginBottom: 4 }}>
                {isVi
                  ? `Đang chuyển sang góc nhìn ${
                      switchingRoleId === 'CHILD'
                        ? 'Trẻ em (Bé An)'
                        : switchingRoleId === 'PARENT'
                        ? 'Phụ huynh (Mẹ Hoa)'
                        : 'Ông bà (Bà Nội)'
                    }...`
                  : `Switching to ${switchingRoleId} perspective...`}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
                {isVi
                  ? 'Tùy biến giao diện và nhịp kết nối phù hợp'
                  : 'Adapting UI & daily connection rhythms'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
