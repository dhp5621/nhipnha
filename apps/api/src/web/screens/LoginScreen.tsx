import React, { useState, useRef } from 'react';
import type { Role } from '@nhipnha/shared';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';
import { QRScannerModal } from '../components/QRScannerModal';
import { GoogleLoadingIndicator } from '../components/GoogleLoadingIndicator';
import { decodeQRFromFile, extractCodeFromQR } from '../services/qrDecoder';

interface LoginScreenProps {
  onJoinWithCode: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC<LoginScreenProps> = ({ onJoinWithCode }) => {
  const {
    loginWithEmail,
    loginWithQR,
    pairWithQR,
    pairWithCode,
    createNewFamily,
    loginDemoAccount,
    isLoading,
  } = useAuth();
  const { activeLanguage, setLanguagePreference } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const isVi = activeLanguage === 'vi';

  const [mode, setMode] = useState<'login' | 'qr' | 'register'>('login');
  const [familyName, setFamilyName] = useState('');
  const [province, setProvince] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('PARENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);
  const [demoLoadingRole, setDemoLoadingRole] = useState<Role | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleAutoLoginOrPair = async (qrPayloadString: string) => {
    setIsProcessingQR(true);
    const trimmed = qrPayloadString.trim();
    try {
      // 1. Check if it's personal QR login JSON
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.type === 'login' || (parsed?.memberId && parsed?.secret)) {
          await loginWithQR(trimmed);
          return;
        }
      } catch {}

      // 2. Try personal QR login first directly
      try {
        await loginWithQR(trimmed);
        return;
      } catch (errLogin: any) {
        // If not personal login, fall through to pairing
      }

      // 3. Try pairing with QR payload or code
      const extracted = extractCodeFromQR(trimmed);
      try {
        await pairWithQR(trimmed);
        return;
      } catch {
        if (extracted) {
          await pairWithCode(extracted);
          return;
        }
      }

      throw new Error(
        isVi
          ? 'Mã QR không hợp lệ hoặc không tìm thấy gia đình tương ứng.'
          : 'Invalid QR code or matching family not found.'
      );
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Đăng nhập bằng mã QR thất bại' : 'QR Sign-in Failed',
        message:
          err?.message ||
          (isVi
            ? 'Không thể đăng nhập bằng mã QR trong ảnh này. Vui lòng kiểm tra lại mã QR hoặc mở camera để quét.'
            : 'Could not sign in with this QR code. Please check the image or scan with camera.'),
      });
    } finally {
      setIsProcessingQR(false);
    }
  };

  const handleUploadQRImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsProcessingQR(true);
    try {
      const qrData = await decodeQRFromFile(file);
      if (qrData) {
        await handleAutoLoginOrPair(qrData);
      } else {
        setIsProcessingQR(false);
        setAlertInfo({
          title: isVi ? 'Không tìm thấy mã QR trong ảnh' : 'No QR Code Detected',
          message: isVi
            ? 'Không nhận diện được mã QR từ ảnh chụp màn hình này. Vui lòng chọn ảnh chụp rõ nét hơn hoặc mở máy ảnh quét trực tiếp.'
            : 'Could not detect a QR code from this screenshot. Please try a clearer screenshot or scan with camera.',
        });
      }
    } catch (err: any) {
      setIsProcessingQR(false);
      setAlertInfo({
        title: isVi ? 'Lỗi đọc ảnh' : 'Image Read Error',
        message: err?.message || (isVi ? 'Không thể đọc tệp ảnh vừa chọn.' : 'Could not read the selected image file.'),
      });
    }
  };

  const [errors, setErrors] = useState<{
    familyName?: string;
    name?: string;
    email?: string;
    password?: string;
    qr?: string;
  }>({});

  const roleOptions: { id: Role; label: string; icon: string }[] = [
    { id: 'PARENT', label: isVi ? 'Bố / Mẹ' : 'Parent', icon: 'supervisor_account' },
    { id: 'GRANDPARENT', label: isVi ? 'Ông / Bà' : 'Elder', icon: 'elderly' },
    { id: 'CHILD', label: isVi ? 'Con nhỏ' : 'Child', icon: 'child_care' },
  ];

  const handleLoginEmail = async () => {
    const next: typeof errors = {};
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      next.email = isVi ? 'Vui lòng nhập email đã được cấp' : 'Please enter your email';
    } else if (!EMAIL_RE.test(cleanEmail)) {
      next.email = isVi ? 'Định dạng email không hợp lệ' : 'Invalid email address';
    }
    if (!password || password.length < 8) {
      next.password = isVi ? 'Mật khẩu tối thiểu 8 ký tự' : 'Password must be at least 8 characters';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await loginWithEmail(cleanEmail, password);
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Không thể đăng nhập' : 'Sign-in failed',
        message:
          err?.message ||
          (isVi
            ? 'Email hoặc mật khẩu không đúng, hoặc chủ nhà chưa cấp tài khoản.'
            : 'Invalid email or password.'),
      });
    }
  };

  const handleCreateOwnerFamily = async () => {
    const next: typeof errors = {};
    const cleanEmail = email.trim().toLowerCase();
    const hasEmail = cleanEmail.length > 0;
    const hasPassword = password.length > 0;

    if (!familyName.trim()) {
      next.familyName = isVi ? 'Vui lòng đặt tên gia đình' : 'Please enter your family name';
    }
    if (!name.trim()) {
      next.name = isVi ? 'Vui lòng nhập tên của bạn (Chủ nhà)' : 'Please enter your name (Owner)';
    }

    if (hasEmail && !hasPassword) {
      next.password = isVi
        ? 'Khi gắn email, bắt buộc phải đặt mật khẩu (tối thiểu 8 ký tự)'
        : 'Password is required when setting an email (min 8 chars)';
    } else if (!hasEmail && hasPassword) {
      next.email = isVi
        ? 'Vui lòng nhập email đi kèm với mật khẩu'
        : 'Please enter an email to pair with your password';
    } else if (hasEmail && hasPassword) {
      if (!EMAIL_RE.test(cleanEmail)) {
        next.email = isVi ? 'Email không hợp lệ' : 'Invalid email format';
      }
      if (password.length < 8) {
        next.password = isVi ? 'Mật khẩu cần ít nhất 8 ký tự' : 'Password must be at least 8 characters';
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await createNewFamily(
        familyName.trim(),
        province.trim() || 'Việt Nam',
        selectedRole,
        name.trim(),
        hasEmail ? cleanEmail : undefined,
        hasPassword ? password : undefined
      );
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Không thể tạo gia đình' : 'Could not create family',
        message: err?.message || (isVi ? 'Vui lòng thử lại sau.' : 'Please try again later.'),
      });
    }
  };

  const handleLoginQR = async (payloadToUse?: string) => {
    const target = (payloadToUse || qrInput).trim();
    if (!target) {
      setErrors({ qr: isVi ? 'Vui lòng dán nội dung mã QR' : 'Please paste QR code payload' });
      return;
    }
    setErrors({});
    try {
      await loginWithQR(target);
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Không thể đăng nhập qua mã QR' : 'QR Sign-in failed',
        message:
          err?.message ||
          (isVi
            ? 'Mã QR không đúng định dạng đăng nhập cá nhân hoặc đã bị chủ nhà hủy.'
            : 'Invalid QR login payload or access was revoked.'),
      });
    }
  };

  const handleDemo = async (role: Role = 'CHILD') => {
    if (demoLoadingRole) return;
    setDemoLoadingRole(role);
    try {
      await loginDemoAccount(role);
    } catch (err: any) {
      setAlertInfo({
        title: 'Demo',
        message: err?.message || 'Không thể tải tài khoản demo',
      });
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: 16,
    fontSize: 16,
    backgroundColor: colors.surfaceContainer,
    border: `1.5px solid ${hasError ? colors.error : colors.outlineVariant}`,
    color: colors.textDark,
    outline: 'none',
    boxSizing: 'border-box',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.textDark,
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Bar: Quick Theme & Language */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button
          onClick={toggleTheme}
          type="button"
          style={{
            border: 'none',
            backgroundColor: colors.surfaceContainerLow,
            color: colors.textDark,
            padding: '7px 14px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: 'inherit',
            fontSynthesis: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MIcon name={isDark ? 'dark_mode' : 'wb_sunny'} size={16} color="#F59E0B" />
          <span style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{isDark ? (isVi ? 'Tối' : 'Dark') : isVi ? 'Sáng' : 'Light'}</span>
        </button>

        <button
          onClick={() => setLanguagePreference(isVi ? 'en' : 'vi')}
          type="button"
          style={{
            border: 'none',
            backgroundColor: colors.surfaceContainerLow,
            color: colors.textDark,
            padding: '7px 14px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: 'inherit',
            fontSynthesis: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MIcon name="language" size={16} color={colors.primary} />
          <span style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{isVi ? 'English' : 'Tiếng Việt'}</span>
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* App Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src="/icon.png"
            alt="Nhịp Nhà"
            style={{ width: 72, height: 72, borderRadius: 22, margin: '0 auto 8px', display: 'block' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <AccessibleText variant="display" weight="900" color={colors.primary}>
            Nhịp Nhà
          </AccessibleText>
          <div style={{ marginTop: 4 }}>
            <AccessibleText variant="label" weight="800" color={colors.textSecondary}>
              {isVi
                ? 'Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ"'
                : '"Little Footsteps" Family Bonding Ecosystem'}
            </AccessibleText>
          </div>
          <div style={{ marginTop: 4 }}>
            <AccessibleText variant="caption" color={colors.textMuted}>
              {isVi
                ? 'Đề án RBPC 2026 • Hướng tới SDG 3, 4, 8'
                : 'RBPC 2026 • Towards SDG 3, 4, 8'}
            </AccessibleText>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: colors.surfaceContainerLow,
            padding: 4,
            borderRadius: 999,
            marginBottom: 18,
          }}
        >
          {[
            { id: 'login', label: isVi ? 'Đăng nhập' : 'Sign In', icon: 'login' },
            { id: 'qr', label: isVi ? 'Mã QR / Mời' : 'QR / Invite', icon: 'qr_code_scanner' },
            { id: 'register', label: isVi ? 'Tạo gia đình' : 'New Family', icon: 'add_home' },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMode(tab.id as any);
                  setErrors({});
                }}
                type="button"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? colors.primary : 'transparent',
                  color: active ? colors.onPrimary : colors.textSecondary,
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontSynthesis: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.16s ease',
                }}
              >
                <MIcon name={tab.icon} size={16} color={active ? colors.onPrimary : colors.textSecondary} />
                <span style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Email + Password Login */}
        {mode === 'login' && (
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 22,
              borderRadius: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ba.an@dongthap.vn"
                style={inputStyle(!!errors.email)}
              />
              {errors.email && (
                <div style={{ color: colors.error, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Mật khẩu' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isVi ? 'Tối thiểu 8 ký tự' : 'Min 8 characters'}
                  style={inputStyle(!!errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: colors.textMuted,
                  }}
                >
                  <MIcon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>
              {errors.password && (
                <div style={{ color: colors.error, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {errors.password}
                </div>
              )}
            </div>

            <BigButton
              variant="primary"
              iconName="login"
              onClick={handleLoginEmail}
              loading={isLoading}
            >
              {isVi ? 'Đăng Nhập Ngay' : 'Sign In'}
            </BigButton>
          </div>
        )}

        {/* Tab 2: Zero-Type QR Pairing & Invite Code */}
        {mode === 'qr' && (
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 22,
              borderRadius: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                backgroundColor: colors.surfaceContainerLow,
                padding: '12px 16px',
                borderRadius: 18,
                borderLeft: `4px solid ${colors.primary}`,
              }}
            >
              <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
                {isVi ? 'Ghép đôi 1 chạm (Zero-Type)' : 'One-Touch Pairing'}
              </AccessibleText>
              <div style={{ marginTop: 4 }}>
                <AccessibleText variant="caption" color={colors.textSecondary}>
                  {isVi
                    ? 'Thiết kế tối ưu cho trẻ em ở quê & ông bà già yếu. Không cần nhớ email hay mật khẩu.'
                    : 'Designed for children and elder grandparents. No email or password needed.'}
                </AccessibleText>
              </div>
            </div>

            <BigButton
              variant="morning"
              iconName="photo_camera"
              onClick={() => setScannerOpen(true)}
            >
              {isVi ? 'Mở Camera Quét Mã QR' : 'Open Camera to Scan QR'}
            </BigButton>

            <BigButton
              variant="tonal"
              iconName="tag"
              onClick={onJoinWithCode}
            >
              {isVi ? 'Nhập Mã Mời Gia Đình (8 Ký Tự)' : 'Enter 8-digit Invite Code'}
            </BigButton>

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUploadQRImage}
            />

            <BigButton
              variant="tonal"
              iconName="photo_library"
              onClick={() => uploadInputRef.current?.click()}
            >
              {isVi ? 'Tải Ảnh Mã QR Từ Máy' : 'Upload QR Image from Device'}
            </BigButton>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Hoặc dán chuỗi mã QR đăng nhập cá nhân:' : 'Or paste personal login QR text:'}
              </label>
              <textarea
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder='{"app":"nhipnha","type":"login",...}'
                rows={3}
                style={{
                  ...inputStyle(!!errors.qr),
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              />
              {errors.qr && (
                <div style={{ color: colors.error, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {errors.qr}
                </div>
              )}
            </div>

            <BigButton
              variant="outline"
              iconName="verified"
              onClick={() => handleLoginQR()}
              loading={isLoading}
            >
              {isVi ? 'Đăng Nhập Bằng Mã Đã Dán' : 'Sign In With Pasted Code'}
            </BigButton>
          </div>
        )}

        {/* Tab 3: Create New Family (Owner) */}
        {mode === 'register' && (
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 22,
              borderRadius: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tên gia đình (bắt buộc)' : 'Family Name (required)'}
              </label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Gia đình Bác Ba & Bé An' : 'e.g. The Ba Family'}
                style={inputStyle(!!errors.familyName)}
              />
              {errors.familyName && (
                <div style={{ color: colors.error, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {errors.familyName}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tỉnh / Thành quê nhà' : 'Hometown / Province'}
              </label>
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Đồng Tháp, An Giang' : 'e.g. Dong Thap'}
                style={inputStyle(false)}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tên của bạn (Chủ nhà)' : 'Your Name (Owner)'}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Bác Ba' : 'e.g. John Doe'}
                style={inputStyle(!!errors.name)}
              />
              {errors.name && (
                <div style={{ color: colors.error, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Vai trò của bạn:' : 'Your Role:'}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {roleOptions.map((r) => {
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: 18,
                        border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                        backgroundColor: active ? colors.primaryContainer : colors.surfaceContainerLow,
                        color: active ? colors.onPrimaryContainer : colors.textDark,
                        fontWeight: 700,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        fontSynthesis: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MIcon name={r.icon} size={20} color={active ? colors.onPrimaryContainer : colors.textSecondary} />
                      <span style={{ fontFamily: 'inherit', fontWeight: 'inherit' }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: `1px dashed ${colors.outlineVariant}`, paddingTop: 12 }}>
              <AccessibleText variant="caption" color={colors.textSecondary} style={{ display: 'block', marginBottom: 10 }}>
                {isVi
                  ? 'Gắn Email & Mật khẩu cho Chủ nhà (khuyên dùng):'
                  : 'Owner Email & Password (recommended):'}
              </AccessibleText>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isVi ? 'Email chủ nhà (tùy chọn)' : 'Owner email'}
                  style={inputStyle(!!errors.email)}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isVi ? 'Mật khẩu chủ nhà (tối thiểu 8 ký tự)' : 'Owner password (min 8 chars)'}
                  style={inputStyle(!!errors.password)}
                />
              </div>
            </div>

            <BigButton
              variant="primary"
              iconName="add_moderator"
              onClick={handleCreateOwnerFamily}
              loading={isLoading}
            >
              {isVi ? 'Tạo Gia Đình & Nhận Mã QR Chủ Nhà' : 'Create Family & Get Owner QR'}
            </BigButton>
          </div>
        )}

        {/* Demo Accounts Bar */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            <AccessibleText variant="caption" weight="800" color={colors.textMuted}>
              {isVi ? 'DÀNH CHO KIỂM THỬ (1 CHẠM)' : 'TESTING ACCOUNTS (1 TAP)'}
            </AccessibleText>
            <div style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              onClick={() => handleDemo('CHILD')}
              type="button"
              style={{
                padding: '12px 8px',
                borderRadius: 18,
                backgroundColor: colors.surfaceContainerLow,
                border: `1px solid ${colors.outlineVariant}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSynthesis: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {demoLoadingRole === "CHILD" ? <GoogleLoadingIndicator size={24} strokeWidth={3} multiColor={true} /> : <MIcon name="child_care" size={24} color="#F59E0B" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, fontFamily: 'inherit' }}>Bé An</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: colors.textSecondary, fontFamily: 'inherit' }}>
                {isVi ? 'Trẻ em' : 'Child'}
              </span>
            </button>

            <button
              onClick={() => handleDemo('PARENT')}
              type="button"
              style={{
                padding: '12px 8px',
                borderRadius: 18,
                backgroundColor: colors.surfaceContainerLow,
                border: `1px solid ${colors.outlineVariant}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSynthesis: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {demoLoadingRole === "PARENT" ? <GoogleLoadingIndicator size={24} strokeWidth={3} multiColor={true} /> : <MIcon name="supervisor_account" size={24} color="#DF5018" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, fontFamily: 'inherit' }}>Mẹ Hoa</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: colors.textSecondary, fontFamily: 'inherit' }}>
                {isVi ? 'Phụ huynh' : 'Parent'}
              </span>
            </button>

            <button
              onClick={() => handleDemo('GRANDPARENT')}
              type="button"
              style={{
                padding: '12px 8px',
                borderRadius: 18,
                backgroundColor: colors.surfaceContainerLow,
                border: `1px solid ${colors.outlineVariant}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSynthesis: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {demoLoadingRole === "GRANDPARENT" ? <GoogleLoadingIndicator size={24} strokeWidth={3} multiColor={true} /> : <MIcon name="elderly" size={24} color="#4C43D6" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textDark, fontFamily: 'inherit' }}>Bà Nội</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: colors.textSecondary, fontFamily: 'inherit' }}>
                {isVi ? 'Chữ lớn' : 'Elder'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(data) => {
          setScannerOpen(false);
          handleAutoLoginOrPair(data);
        }}
      />

      {/* QR Processing Loading Overlay */}
      {isProcessingQR && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              padding: '24px 32px',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            }}
          >
            <GoogleLoadingIndicator size={44} strokeWidth={4} multiColor={true} />
            <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
              {isVi ? 'Đang đọc mã QR và đăng nhập...' : 'Scanning QR & signing in...'}
            </AccessibleText>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertInfo && (
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
              {alertInfo.title}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
              {alertInfo.message}
            </AccessibleText>
            <BigButton variant="primary" onClick={() => setAlertInfo(null)}>
              OK
            </BigButton>
          </div>
        </div>
      )}

      {demoLoadingRole && (
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
              border: 1.5px solid ,
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
                  ? Äang káº¿t ná»‘i gÃ³c nhÃ¬n ...
                  : Connecting  demo persona...}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
                {isVi ? 'Äang Ä‘á»“ng bá»™ nhá»‹p sinh hoáº¡t gia Ä‘Ã¬nh' : 'Synchronizing family daily rhythms'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
