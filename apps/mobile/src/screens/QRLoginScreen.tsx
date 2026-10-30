import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, scanFromURLAsync } from 'expo-camera';
import jsQR from 'jsqr';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissions';
import { mediaCaptureService } from '../services/mediaCapture';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';
import type { Role } from '@nhipnha/shared';

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
  const { t, activeLanguage, setLanguagePreference } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [manualCode, setManualCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('PARENT');
  const [memberName, setMemberName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const scanTimerRef = useRef<any>(null);

  const isVi = activeLanguage === 'vi';

  const stopCameraScanner = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((tr: any) => tr.stop());
      } catch {}
      streamRef.current = null;
    }
    setScannerOpen(false);
  };

  useEffect(() => {
    return () => stopCameraScanner();
  }, []);

  const handleDecodedQR = async (rawValue: string) => {
    stopCameraScanner();
    try {
      const trimmed = rawValue.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'login' && parsed.memberId && parsed.secret) {
            await loginWithQR(trimmed);
            onSuccess();
            return;
          }
        } catch {}
      }
      try {
        await pairWithQR(trimmed);
        onSuccess();
        return;
      } catch (errPair: any) {
        // Fall back to clean code or loginWithQR
        try {
          await pairWithCode(trimmed);
          onSuccess();
          return;
        } catch {
          await loginWithQR(trimmed);
          onSuccess();
          return;
        }
      }
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Đăng nhập mã QR thất bại' : 'QR Sign-in Failed',
        err?.message || (isVi ? 'Không thể đăng nhập bằng mã QR này hoặc mã đã hết hạn.' : 'Could not sign in with this QR code.')
      );
    }
  };

  const handleStartCameraScan = async () => {
    const granted = await permissionService.requestPermission('camera', isVi);
    if (!granted) {
      Alert.alert(
        isVi ? 'Chưa cấp quyền máy ảnh' : 'Camera Permission Required',
        isVi
          ? 'Vui lòng cho phép truy cập máy ảnh để quét mã QR kết nối gia đình.'
          : 'Please grant camera access to scan the family QR code.'
      );
      return;
    }

    setScannerOpen(true);

    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Use native BarcodeDetector if supported by the browser
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        if (BarcodeDetectorClass) {
          const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
          scanTimerRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                stopCameraScanner();
                handleDecodedQR(barcodes[0].rawValue);
              }
            } catch {}
          }, 350);
        }
      } catch {
        setScannerOpen(false);
      }
    }
  };

  const handlePickQRImage = async () => {
    try {
      const photo = await mediaCaptureService.pickOrCapturePhoto(false);
      if (!photo) return;

      // 1. Native iOS & Android: decode directly via expo-camera scanFromURLAsync
      if (Platform.OS !== 'web' && typeof scanFromURLAsync === 'function') {
        try {
          const fileUri = photo.uri || photo.dataUrl;
          const results = await scanFromURLAsync(fileUri, ['qr']);
          if (results && results.length > 0 && results[0]?.data) {
            handleDecodedQR(results[0].data);
            return;
          }
        } catch (nativeErr) {
          console.warn('Native scanFromURLAsync error:', nativeErr);
        }
      }

      // 2. Web DOM Canvas fallback using jsQR
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const img = new (window as any).Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = ctx.getImageData(0, 0, img.width, img.height);
              const qr = jsQR(imgData.data, imgData.width, imgData.height);
              if (qr && qr.data) {
                handleDecodedQR(qr.data);
                return;
              }
            }
          } catch {}
          Alert.alert(
            isVi ? 'Không tìm thấy mã QR' : 'No QR Detected',
            isVi
              ? 'Không tìm thấy mã QR trong ảnh. Bạn có thể mở máy ảnh quét trực tiếp hoặc nhập mã mời.'
              : 'No QR code found in image. You can scan live with camera or enter the invite code.'
          );
        };
        img.src = photo.dataUrl;
        return;
      }

      Alert.alert(
        isVi ? 'Không tìm thấy mã QR' : 'No QR Detected',
        isVi
          ? 'Không nhận diện được mã QR trong ảnh vừa chọn. Vui lòng thử lại với ảnh rõ nét hơn hoặc quét trực tiếp.'
          : 'Could not detect QR code in image. Please try a clearer image or scan live.'
      );
    } catch (err: any) {
      console.warn('Pick QR error:', err);
    }
  };

  const handleJoinByCode = async () => {
    const raw = manualCode.trim();
    if (!raw) {
      Alert.alert(
        isVi ? 'Thiếu mã mời hoặc mã QR' : 'Missing Code',
        isVi
          ? 'Vui lòng nhập mã mời từ chủ nhà (ví dụ: MOI-7K3F9QXA) hoặc dán dữ liệu mã QR.'
          : 'Please enter the invite code from your family owner or paste QR data.'
      );
      return;
    }
    try {
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'login' && parsed.memberId && parsed.secret) {
          await loginWithQR(raw);
          onSuccess();
          return;
        }
      }
      // Role is strictly determined by the server invite!
      await pairWithCode(raw, undefined, memberName.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Mã không hợp lệ' : 'Invalid Code',
        err?.message ||
          (isVi ? 'Vui lòng kiểm tra lại mã mời từ chủ nhà' : 'Please check your invite code')
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

    const hasEmail = ownerEmail.trim().length > 0;
    const hasPass = ownerPassword.length > 0;
    if (hasEmail !== hasPass) {
      Alert.alert(
        isVi ? 'Thiếu thông tin bảo mật' : 'Incomplete Credentials',
        isVi
          ? 'Chủ nhà cần nhập cả Email và Mật khẩu (tối thiểu 8 ký tự), hoặc để trống cả hai nếu chỉ dùng mã QR Chủ nhà.'
          : 'Owner must provide both Email and Password (min 8 chars), or leave both blank to use Owner QR only.'
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
        memberName.trim() || defaultName,
        hasEmail ? ownerEmail.trim().toLowerCase() : undefined,
        hasPass ? ownerPassword : undefined
      );
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Lỗi tạo gia đình' : 'Error Creating Family',
        err?.message || (isVi ? 'Không thể tạo gia đình' : 'Could not create family')
      );
    }
  };

  const handleQuickDemo = async () => {
    try {
      await loginDemoAccount('CHILD');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load demo family from server');
    }
  };

  const roles: { id: Role; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'PARENT', label: isVi ? 'Bố / Mẹ' : 'Parent', icon: 'supervisor-account' },
    { id: 'GRANDPARENT', label: isVi ? 'Ông / Bà' : 'Grandparent', icon: 'elderly' },
    { id: 'CHILD', label: isVi ? 'Con nhỏ' : 'Child', icon: 'child-care' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Quick Controls (Back + Theme + Language) */}
      <View style={styles.topUtilityBar}>
        {onBackToLogin && (
          <TouchableOpacity
            onPress={() => {
              stopCameraScanner();
              onBackToLogin();
            }}
            style={[
              styles.utilityChip,
              { backgroundColor: colors.surfaceContainerHigh, marginRight: 'auto' },
            ]}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <AccessibleText variant="label" color={colors.textDark} weight="700">
              {isVi ? 'Quay lại' : 'Back'}
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
        <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
        <AccessibleText variant="display" weight="900" style={{ marginTop: 14 }}>
          {t('appName')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {isVi
            ? 'Quét mã QR đăng nhập hoặc tạo không gian gia đình mới'
            : 'Scan login QR or create a new family space'}
        </AccessibleText>
      </View>

      {/* Segmented Mode Picker: Join vs Create */}
      <View style={[styles.modeSegment, { backgroundColor: colors.surfaceContainerHigh }]}>
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
            {isVi ? 'Quét QR / Nhập mã mời' : 'Scan QR / Enter Invite'}
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
            {isVi ? 'Lập nhà mới (Chủ nhà)' : 'Create Family (Owner)'}
          </AccessibleText>
        </TouchableOpacity>
      </View>

      {tab === 'join' ? (
        <View style={[styles.surfaceCard, { backgroundColor: colors.surfaceContainerLow }]}>
          <AccessibleText variant="h2" weight="800">
            {isVi ? 'Đăng nhập bằng Mã QR / Mã mời' : 'Sign In via QR / Invite Code'}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ marginTop: 4, marginBottom: 12 }}
          >
            {isVi
              ? 'Vai trò của bạn đã được Chủ nhà thiết lập sẵn trong mã QR / mã mời để đảm bảo an toàn.'
              : 'Your role is pre-configured by the Family Owner inside the QR / invite code.'}
          </AccessibleText>

          {/* Security Warning */}
          <View
            style={[
              styles.leakWarning,
              {
                backgroundColor: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
              },
            ]}
          >
            <MaterialIcons
              name="gpp-maybe"
              size={20}
              color={isDark ? '#FCA5A5' : '#B91C1C'}
              style={{ marginRight: 8 }}
            />
            <AccessibleText
              variant="caption"
              color={isDark ? '#F87171' : '#7F1D1D'}
              style={{ flex: 1 }}
            >
              {isVi
                ? 'CẢNH BÁO: Tuyệt đối không chụp gửi mã QR đăng nhập cho người ngoài vì bất kỳ ai có mã đều có thể truy cập tài khoản.'
                : 'WARNING: Never share your login QR with outsiders—anyone with the QR can access the account.'}
            </AccessibleText>
          </View>

          {scannerOpen ? (
            <View style={styles.cameraBox}>
              {Platform.OS !== 'web' ? (
                <CameraView
                  style={{ width: '100%', height: 260, borderRadius: 20, overflow: 'hidden' }}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={(result) => {
                    if (result.data) {
                      stopCameraScanner();
                      handleDecodedQR(result.data);
                    }
                  }}
                />
              ) : (
                React.createElement('video', {
                  ref: videoRef,
                  style: { width: '100%', height: 260, borderRadius: 20, objectFit: 'cover' },
                })
              )}
              <View style={{ marginTop: 10 }}>
                <BigButton
                  title={isVi ? 'Đóng máy ảnh' : 'Close Camera'}
                  icon="close"
                  variant="secondary"
                  onPress={stopCameraScanner}
                />
              </View>
            </View>
          ) : (
            <View>
              <BigButton
                title={isVi ? 'Mở máy ảnh quét mã QR' : 'Open Camera to Scan QR'}
                subtitle={isVi ? 'Quét trực tiếp từ màn hình máy Chủ nhà' : 'Scan directly from the Owner screen'}
                icon="qr-code-scanner"
                variant="morning"
                size="hero"
                loading={isLoading}
                onPress={handleStartCameraScan}
              />
              <View style={{ marginTop: 10 }}>
                <BigButton
                  title={isVi ? 'Chọn ảnh mã QR từ máy' : 'Pick QR Image from Gallery'}
                  subtitle={isVi ? 'Nhận diện mã QR từ ảnh chụp màn hình' : 'Detect QR code from saved screenshot'}
                  icon="photo-library"
                  variant="secondary"
                  onPress={handlePickQRImage}
                />
              </View>
            </View>
          )}

          <View style={styles.orDivider}>
            <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
            <AccessibleText variant="caption" color={colors.textMuted} style={{ marginHorizontal: 10 }}>
              {isVi ? 'HOẶC NHẬP MÃ MỜI / DÁN QR' : 'OR ENTER INVITE / PASTE QR'}
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
            placeholder="MOI-XXXXXXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.textDark,
                marginBottom: 12,
              },
            ]}
            value={memberName}
            onChangeText={setMemberName}
            placeholder={
              isVi
                ? 'Tên hiển thị của bạn (nếu chủ nhà chưa đặt sẵn)'
                : 'Your display name (if not pre-filled by owner)'
            }
            placeholderTextColor={colors.textMuted}
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
        <View style={[styles.surfaceCard, { backgroundColor: colors.surfaceContainerLow }]}>
          <AccessibleText variant="h2" weight="800">
            {isVi ? 'Tạo không gian gia đình mới (Chủ nhà)' : 'Create New Family (Owner)'}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ marginTop: 4, marginBottom: 12 }}
          >
            {isVi
              ? 'Bạn sẽ là Chủ nhà. Chỉ Chủ nhà mới có quyền tạo tài khoản, gán vai trò và tạo mã QR cho các thành viên khác.'
              : 'You will be the Family Owner. Only the Owner can create member accounts, assign roles, and issue QR codes.'}
          </AccessibleText>

          <AccessibleText variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>
            {isVi ? 'Vai trò của Chủ nhà:' : 'Owner Role:'}
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
                    size={26}
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
            placeholder={isVi ? 'Tên của bạn (VD: Mẹ Hoa, Bố Nam)' : 'Your name'}
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
            value={newFamilyName}
            onChangeText={setNewFamilyName}
            placeholder={isVi ? 'Tên gia đình (ví dụ: Gia đình Bé An)' : 'Family name'}
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
            placeholder={isVi ? 'Tỉnh / Quê nhà (ví dụ: Đồng Tháp)' : 'Hometown province'}
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
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            placeholder={isVi ? 'Email đăng nhập chủ nhà (tùy chọn kèm mật khẩu)' : 'Owner email'}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.textDark,
                marginBottom: 14,
              },
            ]}
            value={ownerPassword}
            onChangeText={setOwnerPassword}
            placeholder={isVi ? 'Mật khẩu chủ nhà (tối thiểu 8 ký tự)' : 'Owner password (min 8 chars)'}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <BigButton
            title={isVi ? 'Lập Gia Đình & Nhận Mã QR Chủ Nhà' : 'Create Family & Get Owner QR'}
            icon="add-home"
            variant="primary"
            size="hero"
            loading={isLoading}
            onPress={handleCreateFamily}
          />
        </View>
      )}

      {/* Subtle Demo Account Entry at the bottom */}
      <TouchableOpacity
        onPress={handleQuickDemo}
        style={[styles.demoBanner, { backgroundColor: colors.surfaceContainer }]}
      >
        <View style={{ flex: 1 }}>
          <AccessibleText variant="label" weight="800" color={colors.primary}>
            {isVi ? 'Dùng thử gia đình mẫu kiểm thử (NHIP-8868)' : 'Try Demo Family for Testing (NHIP-8868)'}
          </AccessibleText>
          <AccessibleText variant="caption" color={colors.textSecondary}>
            {isVi
              ? 'Chỉ dành cho kiểm thử — Cho phép chuyển đổi thử cả 3 vai trò'
              : 'For testing only — Allows switching between all 3 roles'}
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
  leakWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cameraBox: {
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
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
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 5,
  },
  codeInput: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 18,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 8,
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
