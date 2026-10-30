import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { scanFromURLAsync } from 'expo-camera';
import jsQR from 'jsqr';
import { mediaCaptureService } from '../services/mediaCapture';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import type { Role } from '@nhipnha/shared';

interface LoginScreenProps {
  /** Opens the QR scanner / invite code / create family screen. */
  onJoinWithCode: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC<LoginScreenProps> = ({ onJoinWithCode }) => {
  const {
    loginWithEmail,
    loginWithQR,
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
  const [errors, setErrors] = useState<{
    familyName?: string;
    name?: string;
    email?: string;
    password?: string;
    qr?: string;
  }>({});

  const roleOptions: { id: Role; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'PARENT', label: isVi ? 'Bố / Mẹ' : 'Parent', icon: 'supervisor-account' },
    { id: 'GRANDPARENT', label: isVi ? 'Ông / Bà' : 'Elder', icon: 'elderly' },
    { id: 'CHILD', label: isVi ? 'Con nhỏ' : 'Child', icon: 'child-care' },
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
      Alert.alert(
        isVi ? 'Không thể đăng nhập' : 'Sign-in failed',
        err?.message ||
          (isVi
            ? 'Email hoặc mật khẩu không đúng, hoặc chủ nhà chưa cấp tài khoản.'
            : 'Invalid email or password.')
      );
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

    // Rule: either both email & password are set, or both left empty (QR-only owner)
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
      const res = await createNewFamily(
        familyName.trim(),
        province.trim() || 'Việt Nam',
        selectedRole,
        name.trim(),
        hasEmail ? cleanEmail : undefined,
        hasPassword ? password : undefined
      );
      if (res.loginCode) {
        Alert.alert(
          isVi ? 'Đã tạo gia đình & Mã QR Chủ nhà!' : 'Family & Owner QR Created!',
          isVi
            ? 'CẢNH BÁO: Mã QR đăng nhập của bạn đã được lưu trong Cài đặt > Quản lý Chủ nhà. Tuyệt đối KHÔNG làm rò rỉ mã QR vì bất kỳ ai có mã đều đăng nhập được!'
            : 'WARNING: Your personal login QR is saved in Settings > Owner Console. Never leak your QR code as anyone with it can sign in!'
        );
      }
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Không thể tạo gia đình' : 'Could not create family',
        err?.message || (isVi ? 'Vui lòng kiểm tra lại thông tin' : 'Please check your input')
      );
    }
  };

  const handlePickQRImage = async () => {
    try {
      const photo = await mediaCaptureService.pickOrCapturePhoto(false);
      if (!photo) return;

      const handleDecodedQR = async (decodedData: string) => {
        try {
          const trimmed = decodedData.trim();
          if (trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.type === 'login' && parsed.memberId && parsed.secret) {
                await loginWithQR(trimmed);
                return;
              }
            } catch {}
          }
          try {
            await pairWithCode(trimmed);
            return;
          } catch {
            await loginWithQR(trimmed);
          }
        } catch (err: any) {
          Alert.alert(
            isVi ? 'Đăng nhập thất bại' : 'Sign-in Failed',
            err?.message || (isVi ? 'Không thể đăng nhập bằng mã QR trong ảnh này.' : 'Could not sign in with this QR code.')
          );
        }
      };

      // 1. Native iOS & Android: decode directly via expo-camera scanFromURLAsync
      if (Platform.OS !== 'web' && typeof scanFromURLAsync === 'function') {
        try {
          const fileUri = photo.uri || photo.dataUrl;
          const results = await scanFromURLAsync(fileUri, ['qr']);
          if (results && results.length > 0 && results[0]?.data) {
            await handleDecodedQR(results[0].data);
            return;
          }
        } catch (nativeErr) {
          console.warn('Native scanFromURLAsync error:', nativeErr);
        }
      }

      // 2. Web DOM Canvas fallback using jsQR
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const img = new (window as any).Image();
        img.onload = async () => {
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
                await handleDecodedQR(qr.data);
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

  const handleQuickQRorInviteSubmit = async () => {
    const raw = qrInput.trim();
    if (!raw) {
      setErrors({
        qr: isVi
          ? 'Vui lòng dán dữ liệu mã QR hoặc nhập mã mời (MOI-...)'
          : 'Please paste QR data or enter an invite code (MOI-...)',
      });
      return;
    }
    setErrors({});

    try {
      // Check if it's a JSON login payload (`{"app":"nhipnha","type":"login",...}`)
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'login' && parsed.memberId && parsed.secret) {
          await loginWithQR(raw);
          return;
        }
      }
      // Otherwise treat as an invite code (e.g. MOI-XXXX) or QR invite payload
      await pairWithCode(raw);
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Mã không hợp lệ' : 'Invalid Code',
        err?.message ||
          (isVi
            ? 'Không thể đăng nhập bằng mã này. Hãy nhờ chủ nhà kiểm tra lại.'
            : 'Could not sign in with this code.')
      );
    }
  };

  const handleDemo = async () => {
    try {
      await loginDemoAccount('CHILD');
    } catch (err: any) {
      Alert.alert(
        isVi ? 'Lỗi kết nối' : 'Connection error',
        err?.message || (isVi ? 'Không tải được gia đình demo' : 'Could not load the demo family')
      );
    }
  };

  const inputStyle = (hasError: boolean) => [
    styles.input,
    {
      backgroundColor: colors.surfaceContainerHigh,
      color: colors.textDark,
      borderColor: hasError ? '#B3261E' : colors.outlineVariant,
    },
  ];

  const renderError = (msg?: string) =>
    msg ? (
      <AccessibleText variant="caption" color="#B3261E" style={styles.error}>
        {msg}
      </AccessibleText>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setLanguagePreference(isVi ? 'en' : 'vi')}
            style={[styles.chip, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityRole="button"
          >
            <MaterialIcons name="translate" size={18} color={colors.textSecondary} />
            <AccessibleText variant="label" weight="700" color={colors.textSecondary}>
              {isVi ? ' VI' : ' EN'}
            </AccessibleText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.chip, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityRole="button"
            accessibilityLabel={isVi ? 'Đổi giao diện' : 'Toggle theme'}
          >
            <MaterialIcons
              name={isDark ? 'light-mode' : 'dark-mode'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
          <AccessibleText variant="h1" weight="900">
            Nhịp Nhà
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            {mode === 'login'
              ? isVi
                ? 'Đăng nhập bằng Email & Mật khẩu do chủ nhà cấp'
                : 'Sign in with Email & Password set by your family owner'
              : mode === 'qr'
              ? isVi
                ? 'Quét mã QR đăng nhập hoặc nhập Mã mời từ chủ nhà'
                : 'Scan login QR or enter an invite code from your family owner'
              : isVi
              ? 'Tạo gia đình mới — Bạn sẽ là Chủ nhà quản lý thành viên'
              : 'Create a new family — You will be the Family Owner'}
          </AccessibleText>
        </View>

        {/* Mode Segmented Switcher */}
        <View style={[styles.modeBar, { backgroundColor: colors.surfaceContainer }]}>
          <TouchableOpacity
            onPress={() => {
              setErrors({});
              setMode('login');
            }}
            style={[
              styles.modeTab,
              mode === 'login' && { backgroundColor: colors.primaryContainer },
            ]}
          >
            <AccessibleText
              variant="label"
              weight="800"
              color={mode === 'login' ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {isVi ? 'Email / MK' : 'Email'}
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setErrors({});
              setMode('qr');
            }}
            style={[
              styles.modeTab,
              mode === 'qr' && { backgroundColor: colors.primaryContainer },
            ]}
          >
            <AccessibleText
              variant="label"
              weight="800"
              color={mode === 'qr' ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {isVi ? 'Quét QR / Mã mời' : 'QR / Invite'}
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setErrors({});
              setMode('register');
            }}
            style={[
              styles.modeTab,
              mode === 'register' && { backgroundColor: colors.primaryContainer },
            ]}
          >
            <AccessibleText
              variant="label"
              weight="800"
              color={mode === 'register' ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {isVi ? 'Lập nhà mới' : 'New Family'}
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {mode === 'login' && (
          <View>
            <View style={styles.field}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={isVi ? 'Email thành viên' : 'Member email'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.email)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {renderError(errors.email)}
            </View>

            <View style={styles.field}>
              <View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isVi ? 'Mật khẩu (tối thiểu 8 ký tự)' : 'Password (min 8 chars)'}
                  placeholderTextColor={colors.textMuted}
                  style={[inputStyle(!!errors.password), { paddingRight: 52 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleLoginEmail}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eye}
                  accessibilityRole="button"
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {renderError(errors.password)}
            </View>

            <BigButton
              title={isVi ? 'Đăng nhập' : 'Log in'}
              icon="login"
              onPress={handleLoginEmail}
              loading={isLoading}
            />
          </View>
        )}

        {mode === 'qr' && (
          <View>
            <View
              style={[
                styles.warningBanner,
                {
                  backgroundColor: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
                },
              ]}
            >
              <MaterialIcons
                name="security"
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
                  ? 'Lưu ý: Vai trò của bạn được ấn định sẵn bởi Chủ nhà. Không chia sẻ mã QR cá nhân cho người lạ vì mã QR cho phép đăng nhập trực tiếp.'
                  : 'Note: Your role is pre-assigned by the Family Owner. Never share your personal login QR with strangers.'}
              </AccessibleText>
            </View>

            <View style={styles.field}>
              <TextInput
                value={qrInput}
                onChangeText={setQrInput}
                placeholder={
                  isVi
                    ? 'Nhập mã mời (VD: MOI-7K3F9QXA) hoặc dán mã QR'
                    : 'Enter invite code (e.g. MOI-7K3F9QXA) or paste QR'
                }
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.qr)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {renderError(errors.qr)}
            </View>

            <BigButton
              title={isVi ? 'Xác nhận Mã mời / Mã QR' : 'Verify Invite / QR Code'}
              icon="verified-user"
              onPress={handleQuickQRorInviteSubmit}
              loading={isLoading}
            />

            <View style={{ height: 10 }} />

            <BigButton
              variant="secondary"
              title={isVi ? 'Mở máy ảnh quét mã QR' : 'Open Camera QR Scanner'}
              icon="qr-code-scanner"
              onPress={onJoinWithCode}
            />

            <View style={{ height: 10 }} />

            <BigButton
              variant="secondary"
              title={isVi ? 'Tải ảnh mã QR từ thư viện' : 'Upload QR Image from Gallery'}
              icon="photo-library"
              onPress={handlePickQRImage}
            />
          </View>
        )}

        {mode === 'register' && (
          <View>
            <View style={styles.field}>
              <TextInput
                value={familyName}
                onChangeText={setFamilyName}
                placeholder={isVi ? 'Tên gia đình (VD: Gia đình Bé An)' : 'Family Name'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.familyName)}
              />
              {renderError(errors.familyName)}
            </View>

            <View style={styles.field}>
              <TextInput
                value={province}
                onChangeText={setProvince}
                placeholder={isVi ? 'Tỉnh / Thành phố quê nhà (VD: Đồng Tháp)' : 'Hometown Province'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(false)}
              />
            </View>

            <View style={styles.field}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={isVi ? 'Tên của bạn (Chủ nhà)' : 'Your name (Family Owner)'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.name)}
              />
              {renderError(errors.name)}
            </View>

            <AccessibleText
              variant="label"
              weight="800"
              color={colors.textSecondary}
              style={{ marginBottom: 8 }}
            >
              {isVi ? 'Vai trò của bạn (Chủ nhà):' : 'Your role (Owner):'}
            </AccessibleText>

            <View style={styles.roleRow}>
              {roleOptions.map((r) => {
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
                        borderRadius: active ? 999 : 18,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={r.icon}
                      size={22}
                      color={active ? colors.onPrimaryContainer : colors.textSecondary}
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

            <AccessibleText
              variant="caption"
              color={colors.textSecondary}
              style={{ marginBottom: 6 }}
            >
              {isVi
                ? 'Gắn Email & Mật khẩu cho Chủ nhà (khuyên dùng, hoặc để trống cả hai nếu chỉ dùng mã QR Chủ nhà):'
                : 'Attach Email & Password for Owner (recommended, or leave both blank for QR-only):'}
            </AccessibleText>

            <View style={styles.field}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={isVi ? 'Email chủ nhà (tùy chọn kèm mật khẩu)' : 'Owner email'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.email)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {renderError(errors.email)}
            </View>

            <View style={styles.field}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isVi ? 'Mật khẩu chủ nhà (tối thiểu 8 ký tự)' : 'Owner password (min 8 chars)'}
                placeholderTextColor={colors.textMuted}
                style={inputStyle(!!errors.password)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              {renderError(errors.password)}
            </View>

            <BigButton
              title={isVi ? 'Tạo Gia Đình & Nhận Mã QR Chủ Nhà' : 'Create Family & Get Owner QR'}
              icon="add-moderator"
              onPress={handleCreateOwnerFamily}
              loading={isLoading}
            />
          </View>
        )}

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
          <AccessibleText variant="caption" color={colors.textMuted}>
            {isVi ? 'dành cho kiểm thử' : 'for testing'}
          </AccessibleText>
          <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
        </View>

        {/* Demo entry is always shown; it is for testing and is separate from real login. */}
        <BigButton
          variant="secondary"
          title={isVi ? 'Dùng thử bản demo (NHIP-8868)' : 'Try Demo (NHIP-8868)'}
          subtitle={
            isVi
              ? 'Chỉ để kiểm thử — Cho phép chuyển đổi thử cả 3 vai trò'
              : 'For testing only — Allows switching between all 3 roles'
          }
          icon="science"
          onPress={handleDemo}
          loading={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 44 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  header: { alignItems: 'center', gap: 6, marginVertical: 14 },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    marginBottom: 4,
  },
  modeBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  field: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
  eye: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { marginTop: 4, marginLeft: 6 },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1 },
});
