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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';

interface LoginScreenProps {
  /** Opens the family code / QR pairing screen. */
  onJoinWithCode: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{8,15}$/;

// UI only for now: the real auth API comes in the next phase.
export const LoginScreen: React.FC<LoginScreenProps> = ({ onJoinWithCode }) => {
  const { loginDemoAccount, isLoading } = useAuth();
  const { activeLanguage, setLanguagePreference } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const isVi = activeLanguage === 'vi';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; identifier?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    const id = identifier.trim();
    if (mode === 'register' && !name.trim()) {
      next.name = isVi ? 'Vui lòng nhập tên' : 'Please enter your name';
    }
    if (!id) {
      next.identifier = isVi ? 'Nhập email hoặc số điện thoại' : 'Enter your email or phone number';
    } else if (!EMAIL_RE.test(id) && !PHONE_RE.test(id)) {
      next.identifier = isVi ? 'Email hoặc số điện thoại không hợp lệ' : 'Invalid email or phone number';
    }
    if (password.length < 6) {
      next.password = isVi ? 'Mật khẩu tối thiểu 6 ký tự' : 'Password must be at least 6 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // No account API yet, so tell the user instead of faking a login.
    Alert.alert(
      isVi ? 'Sắp ra mắt' : 'Coming soon',
      isVi
        ? 'Đăng nhập tài khoản chưa được kết nối máy chủ. Hãy dùng mã gia đình hoặc thử bản demo.'
        : 'Account sign-in is not connected to the server yet. Use a family code or try the demo.'
    );
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

  const switchMode = () => {
    setErrors({});
    setMode(mode === 'login' ? 'register' : 'login');
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
          <View style={[styles.logo, { backgroundColor: colors.primaryContainer }]}>
            <MaterialIcons name="favorite" size={36} color={colors.onPrimaryContainer} />
          </View>
          <AccessibleText variant="h1" weight="800">
            Nhịp Nhà
          </AccessibleText>
          <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
            {mode === 'login'
              ? isVi
                ? 'Đăng nhập để kết nối với gia đình'
                : 'Sign in to stay close to your family'
              : isVi
              ? 'Tạo tài khoản mới'
              : 'Create your account'}
          </AccessibleText>
        </View>

        {mode === 'register' && (
          <View style={styles.field}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={isVi ? 'Tên của bạn' : 'Your name'}
              placeholderTextColor={colors.textMuted}
              style={inputStyle(!!errors.name)}
              autoCapitalize="words"
            />
            {renderError(errors.name)}
          </View>
        )}

        <View style={styles.field}>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={isVi ? 'Email hoặc số điện thoại' : 'Email or phone number'}
            placeholderTextColor={colors.textMuted}
            style={inputStyle(!!errors.identifier)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {renderError(errors.identifier)}
        </View>

        <View style={styles.field}>
          <View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={isVi ? 'Mật khẩu' : 'Password'}
              placeholderTextColor={colors.textMuted}
              style={[inputStyle(!!errors.password), { paddingRight: 52 }]}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={isVi ? 'Hiện/ẩn mật khẩu' : 'Show or hide password'}
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
          title={
            mode === 'login'
              ? isVi
                ? 'Đăng nhập'
                : 'Log in'
              : isVi
              ? 'Tạo tài khoản'
              : 'Create account'
          }
          icon={mode === 'login' ? 'login' : 'person-add'}
          onPress={handleSubmit}
        />

        <TouchableOpacity onPress={switchMode} style={styles.linkRow} accessibilityRole="button">
          <AccessibleText variant="bodyRegular" color={colors.primary} weight="700">
            {mode === 'login'
              ? isVi
                ? 'Chưa có tài khoản? Đăng ký'
                : "Don't have an account? Sign up"
              : isVi
              ? 'Đã có tài khoản? Đăng nhập'
              : 'Already have an account? Log in'}
          </AccessibleText>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
          <AccessibleText variant="caption" color={colors.textMuted}>
            {isVi ? 'hoặc' : 'or'}
          </AccessibleText>
          <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
        </View>

        <BigButton
          variant="secondary"
          title={isVi ? 'Vào gia đình bằng mã' : 'Join with family code'}
          icon="qr-code-scanner"
          onPress={onJoinWithCode}
        />

        {/* Demo entry is always shown; it is for testing and is separate from real login. */}
        <View style={{ height: 12 }} />
        <BigButton
          variant="secondary"
          title={isVi ? 'Dùng thử bản demo' : 'Try demo'}
          subtitle={isVi ? 'Chỉ để kiểm thử, dữ liệu mẫu' : 'For testing only, sample data'}
          icon="science"
          onPress={handleDemo}
          loading={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 40, gap: 6 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  header: { alignItems: 'center', gap: 6, marginVertical: 20 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  field: { marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eye: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  error: { marginTop: 4, marginLeft: 6 },
  linkRow: { alignItems: 'center', paddingVertical: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 10 },
  line: { flex: 1, height: 1 },
});
