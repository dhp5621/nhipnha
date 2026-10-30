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

interface QRLoginScreenProps {
  onSuccess: () => void;
  onBackToLogin?: () => void;
}

export const QRLoginScreen: React.FC<QRLoginScreenProps> = ({ onSuccess, onBackToLogin }) => {
  const {
    pairWithQR,
    pairWithCode,
    loginWithQR,
    createNewFamily,
    loginDemoAccount,
    isLoading,
  } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [manualCode, setManualCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('PARENT');
  const [memberName, setMemberName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const isVi = activeLanguage === 'vi';

  const roleOptions: { id: Role; labelVi: string; labelEn: string; icon: string }[] = [
    { id: 'CHILD', labelVi: 'Trẻ em', labelEn: 'Child', icon: 'child_care' },
    { id: 'PARENT', labelVi: 'Phụ huynh', labelEn: 'Parent', icon: 'supervisor_account' },
    { id: 'GRANDPARENT', labelVi: 'Ông / Bà', labelEn: 'Elder', icon: 'elderly' },
  ];

  const handlePairSuccess = async (qrPayloadString: string) => {
    setIsProcessingQR(true);
    const trimmed = qrPayloadString.trim();
    try {
      // 1. Try personal login if JSON contains type: 'login' or memberId/secret
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.type === 'login' || (parsed?.memberId && parsed?.secret)) {
          await loginWithQR(trimmed);
          onSuccess();
          return;
        }
      } catch {}

      // 2. Try pairWithQR first
      try {
        await pairWithQR(trimmed, selectedRole, memberName || undefined);
        onSuccess();
        return;
      } catch (errPair: any) {
        // Fall back to clean code if possible
        const cleanCode = extractCodeFromQR(trimmed);
        if (cleanCode && cleanCode !== trimmed) {
          await pairWithCode(cleanCode, selectedRole, memberName || undefined);
          onSuccess();
          return;
        }
        // If pairWithQR failed, also try direct loginWithQR as fallback
        try {
          await loginWithQR(trimmed);
          onSuccess();
          return;
        } catch {}

        throw errPair;
      }
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Lỗi kết nối mã QR' : 'QR Connection Error',
        message:
          err?.message ||
          (isVi
            ? 'Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng thử lại với mã khác.'
            : 'Invalid QR code or invitation expired. Please try another code.'),
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
        await handlePairSuccess(qrData);
      } else {
        setIsProcessingQR(false);
        setAlertInfo({
          title: isVi ? 'Không tìm thấy mã QR trong ảnh' : 'No QR Code Detected',
          message: isVi
            ? 'Không tìm thấy mã QR trong hình ảnh vừa tải lên. Vui lòng chọn ảnh rõ hơn hoặc mở camera quét trực tiếp.'
            : 'Could not detect a QR code from this image. Please try another image or scan live.',
        });
      }
    } catch (err: any) {
      setIsProcessingQR(false);
      setAlertInfo({
        title: isVi ? 'Lỗi đọc ảnh' : 'Image Read Error',
        message: err?.message || (isVi ? 'Không thể đọc tệp ảnh vừa chọn.' : 'Could not read the image file.'),
      });
    }
  };

  const handleManualPair = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) {
      setAlertInfo({
        title: isVi ? 'Thiếu thông tin' : 'Missing Info',
        message: isVi ? 'Vui lòng nhập mã kết nối gia đình' : 'Please enter family code',
      });
      return;
    }

    try {
      await pairWithCode(code, selectedRole, memberName || undefined);
      onSuccess();
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Lỗi kết nối' : 'Connection Error',
        message: err?.message || (isVi ? 'Mã gia đình không đúng' : 'Invalid family code'),
      });
    }
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim() || !memberName.trim()) {
      setAlertInfo({
        title: isVi ? 'Thiếu thông tin' : 'Missing Info',
        message: isVi ? 'Vui lòng nhập tên gia đình và tên của bạn' : 'Please fill all required fields',
      });
      return;
    }

    try {
      await createNewFamily(
        newFamilyName.trim(),
        newProvince.trim() || 'Việt Nam',
        selectedRole,
        memberName.trim(),
        ownerEmail.trim() || undefined,
        ownerPassword.trim() || undefined
      );
      onSuccess();
    } catch (err: any) {
      setAlertInfo({
        title: isVi ? 'Lỗi tạo gia đình' : 'Error Creating Family',
        message: err?.message || (isVi ? 'Không thể tạo gia đình' : 'Could not create family'),
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 16,
    fontSize: 16,
    backgroundColor: colors.surfaceContainer,
    border: `1.5px solid ${colors.outlineVariant}`,
    color: colors.textDark,
    outline: 'none',
    boxSizing: 'border-box',
  };

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
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Top bar with back to login */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {onBackToLogin ? (
            <button
              onClick={onBackToLogin}
              type="button"
              style={{
                border: 'none',
                backgroundColor: colors.surfaceContainerLow,
                color: colors.textDark,
                padding: '8px 14px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MIcon name="arrow_back" size={18} />
              <span>{isVi ? 'Về Đăng Nhập' : 'Back to Login'}</span>
            </button>
          ) : <div />}

          <span
            style={{
              backgroundColor: isDark ? 'rgba(255, 181, 156, 0.2)' : '#FFDCC6',
              color: isDark ? '#FFB59C' : '#331200',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 999,
            }}
          >
            Zero-Type Pairing
          </span>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            backgroundColor: colors.surfaceContainerLow,
            padding: 4,
            borderRadius: 999,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setTab('join')}
            type="button"
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tab === 'join' ? colors.primary : 'transparent',
              color: tab === 'join' ? colors.onPrimary : colors.textSecondary,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {isVi ? 'Tham Gia Gia Đình' : 'Join Family'}
          </button>
          <button
            onClick={() => setTab('create')}
            type="button"
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tab === 'create' ? colors.primary : 'transparent',
              color: tab === 'create' ? colors.onPrimary : colors.textSecondary,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {isVi ? 'Tạo Gia Đình Mới' : 'Create Family'}
          </button>
        </div>

        {tab === 'join' ? (
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 24,
              borderRadius: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <AccessibleText variant="h1" weight="900" color={colors.textDark}>
                {isVi ? 'Ghép Đôi 1 Chạm' : 'One-Touch Pairing'}
              </AccessibleText>
              <div style={{ marginTop: 4 }}>
                <AccessibleText variant="caption" color={colors.textSecondary}>
                  {isVi
                    ? 'Quét mã QR dán trên tường ở quê hoặc nhập mã 8 chữ số'
                    : 'Scan QR code at home or enter 8-character code'}
                </AccessibleText>
              </div>
            </div>

            <BigButton
              variant="morning"
              iconName="qr_code_scanner"
              onClick={() => setScannerOpen(true)}
              minHeight={58}
            >
              {isVi ? 'MỞ CAMERA QUÉT MÃ QR' : 'SCAN QR WITH CAMERA'}
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
              {isVi ? 'TẢI ẢNH MÃ QR TỪ THIẾT BỊ' : 'UPLOAD QR IMAGE FROM DEVICE'}
            </BigButton>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
              <AccessibleText variant="caption" color={colors.textMuted} weight="700">
                {isVi ? 'HOẶC NHẬP MÃ SỐ' : 'OR ENTER CODE'}
              </AccessibleText>
              <div style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Mã gia đình / Mã mời (8 ký tự):' : 'Family Code / Invite Code (8 chars):'}
              </label>
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="NHIP-8868"
                style={{
                  ...inputStyle,
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textAlign: 'center',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tên của bạn:' : 'Your Name:'}
              </label>
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Bé An, Mẹ Hoa' : 'e.g. An'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Vai trò kết nối:' : 'Your Role:'}
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
                        padding: '12px 6px',
                        borderRadius: 18,
                        border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
                        backgroundColor: active ? colors.primaryContainer : colors.surfaceContainerLow,
                        color: active ? colors.onPrimaryContainer : colors.textDark,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MIcon name={r.icon} size={20} color={active ? colors.onPrimaryContainer : colors.textSecondary} />
                      <span>{isVi ? r.labelVi : r.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <BigButton
              variant="primary"
              iconName="link"
              onClick={handleManualPair}
              loading={isLoading}
            >
              {isVi ? 'KẾT NỐI VÀO GIA ĐÌNH' : 'CONNECT TO FAMILY'}
            </BigButton>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: colors.surface,
              padding: 24,
              borderRadius: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tên gia đình:' : 'Family Name:'}
              </label>
              <input
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Gia đình Bé An' : 'e.g. Ba Family'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tỉnh / Thành quê nhà:' : 'Province:'}
              </label>
              <input
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Đồng Tháp' : 'e.g. Dong Thap'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                {isVi ? 'Tên của bạn:' : 'Your Name:'}
              </label>
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Bác Ba' : 'e.g. John'}
                style={inputStyle}
              />
            </div>

            <BigButton
              variant="primary"
              iconName="add_circle"
              onClick={handleCreateFamily}
              loading={isLoading}
            >
              {isVi ? 'Khởi Tạo Gia Đình' : 'Create Family'}
            </BigButton>
          </div>
        )}
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(data) => {
          setScannerOpen(false);
          handlePairSuccess(data);
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
              {isVi ? 'Đang đọc mã QR và kết nối...' : 'Reading QR & connecting...'}
            </AccessibleText>
          </div>
        </div>
      )}

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
    </div>
  );
};
