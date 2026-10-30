import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AccessibleText } from './AccessibleText';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SecurityQRCardProps {
  title: string;
  subtitle?: string;
  qrPayload: string;
  codeBadge?: string;
  isLoginSecret?: boolean;
}

export const SecurityQRCard: React.FC<SecurityQRCardProps> = ({
  title,
  subtitle,
  qrPayload,
  codeBadge,
  isLoginSecret = true,
}) => {
  const { colors, isDark } = useTheme();
  const { activeLanguage } = useLanguage();
  const isVi = activeLanguage === 'vi';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    qrPayload
  )}`;

  const handleCopyPayload = () => {
    const textToCopy = codeBadge || qrPayload;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(qrPayload).catch(() => {});
    }
    Alert.alert(
      isVi ? 'Đã sao chép mã' : 'Copied to Clipboard',
      isVi
        ? `Mã bảo mật đã được sao chép. Tuyệt đối chỉ gửi riêng cho đúng thành viên trong gia đình!`
        : `Code copied. Only share privately with the intended family member!`
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <MaterialIcons name="qr-code-2" size={24} color={colors.primary} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <AccessibleText variant="h2" weight="900">
            {title}
          </AccessibleText>
          {subtitle ? (
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {subtitle}
            </AccessibleText>
          ) : null}
        </View>
      </View>

      {/* Strict Security Leak Warning Banner */}
      <View
        style={[
          styles.warningBox,
          {
            backgroundColor: isDark ? 'rgba(185, 28, 28, 0.2)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
          },
        ]}
      >
        <MaterialIcons
          name="gpp-maybe"
          size={22}
          color={isDark ? '#FCA5A5' : '#B91C1C'}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <AccessibleText
            variant="label"
            weight="900"
            color={isDark ? '#FCA5A5' : '#991B1B'}
          >
            {isVi
              ? 'CẢNH BÁO BẢO MẬT — CẤM RÒ RỈ MÃ QR'
              : 'SECURITY WARNING — DO NOT LEAK THIS QR CODE'}
          </AccessibleText>
          <AccessibleText
            variant="caption"
            color={isDark ? '#F87171' : '#7F1D1D'}
            style={{ marginTop: 2 }}
          >
            {isLoginSecret
              ? isVi
                ? 'Mã QR này dùng để đăng nhập trực tiếp không cần mật khẩu (tối đa 3 thiết bị cùng lúc). Bất kỳ ai chụp hoặc có được mã QR này đều có thể đăng nhập vào tài khoản. Tuyệt đối không đăng công khai hay gửi cho người lạ!'
                : 'This QR code grants direct sign-in access (up to 3 devices). Anyone who obtains or photographs this QR can log into the account. Never post publicly or share with strangers!'
              : isVi
              ? 'Mã mời gia đình định sẵn vai trò. Tuyệt đối không chia sẻ công khai lên mạng xã hội để tránh người lạ xâm nhập gia đình!'
              : 'This family invite assigns a fixed role. Never share publicly on social media to prevent unauthorized access!'}
          </AccessibleText>
        </View>
      </View>

      <View style={styles.qrCenter}>
        <View style={styles.qrFrame}>
          <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
        </View>

        {codeBadge ? (
          <View style={[styles.codeBadge, { backgroundColor: colors.primaryContainer }]}>
            <AccessibleText variant="h2" weight="900" color={colors.onPrimaryContainer}>
              {codeBadge}
            </AccessibleText>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleCopyPayload}
        style={[styles.copyBtn, { backgroundColor: colors.surfaceContainerHigh }]}
        accessibilityRole="button"
      >
        <MaterialIcons name="content-copy" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <AccessibleText variant="label" weight="800" color={colors.primary}>
          {isVi ? 'Sao chép dữ liệu mã QR (để dán đăng nhập)' : 'Copy QR payload (for quick paste)'}
        </AccessibleText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  qrCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 24,
    elevation: 2,
  },
  qrImage: {
    width: 190,
    height: 190,
  },
  codeBadge: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 10,
  },
});
