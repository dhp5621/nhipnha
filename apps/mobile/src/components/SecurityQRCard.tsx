import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform, Share } from 'react-native';
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
  const [copied, setCopied] = useState(false);
  const isVi = activeLanguage === 'vi';

  const rawPayload = (qrPayload || codeBadge || '').trim();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    rawPayload
  )}`;

  // Detect JSON login or pairing payload
  let isJson = false;
  let parsedPayload: Record<string, any> | null = null;
  if (rawPayload.startsWith('{') && rawPayload.endsWith('}')) {
    try {
      parsedPayload = JSON.parse(rawPayload);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  const memberId = parsedPayload?.memberId ? String(parsedPayload.memberId) : null;

  const handleCopyPayload = async () => {
    const textToCopy = rawPayload;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy).catch(() => {});
    } else {
      try {
        await Share.share({ message: textToCopy });
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    Alert.alert(
      isVi ? 'Đã sao chép mã' : 'Copied to Clipboard',
      isVi
        ? `Mã bảo mật đã được sao chép. Dán trực tiếp vào ô đăng nhập QR hoặc chỉ gửi riêng cho đúng người thân!`
        : `Code copied. Paste directly into the QR login box or share privately!`
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
            <AccessibleText
              variant="h2"
              weight="900"
              color={colors.onPrimaryContainer}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {codeBadge}
            </AccessibleText>
          </View>
        ) : null}

        {isJson ? (
          <View
            style={[
              styles.tokenPreviewBox,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.tokenHeaderRow}>
              <AccessibleText
                variant="caption"
                weight="800"
                color={colors.textSecondary}
              >
                {isVi ? 'TOKEN ĐĂNG NHẬP (BẢO MẬT)' : 'LOGIN CREDENTIAL'}
              </AccessibleText>
              {memberId ? (
                <View
                  style={[
                    styles.memberIdBadge,
                    { backgroundColor: isDark ? 'rgba(255, 181, 156, 0.15)' : '#FFECE2' },
                  ]}
                >
                  <AccessibleText
                    variant="caption"
                    weight="900"
                    color={colors.primary}
                    numberOfLines={1}
                  >
                    {memberId}
                  </AccessibleText>
                </View>
              ) : null}
            </View>
            <AccessibleText
              variant="caption"
              color={colors.textSecondary}
              numberOfLines={1}
              ellipsizeMode="middle"
              style={styles.monoPreview}
            >
              {rawPayload}
            </AccessibleText>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleCopyPayload}
        style={[
          styles.copyBtn,
          {
            backgroundColor: copied
              ? isDark
                ? '#064E3B'
                : '#DCFCE7'
              : colors.primary,
            borderColor: copied
              ? isDark
                ? '#059669'
                : '#86EFAC'
              : 'transparent',
          },
        ]}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={copied ? 'done' : 'content-copy'}
          size={18}
          color={copied ? (isDark ? '#6EE7B7' : '#15803D') : colors.onPrimary}
          style={{ marginRight: 8 }}
        />
        <AccessibleText
          variant="label"
          weight="800"
          color={copied ? (isDark ? '#6EE7B7' : '#15803D') : colors.onPrimary}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {copied
            ? (isVi ? 'Đã sao chép Token vào bộ nhớ!' : 'Token copied to clipboard!')
            : (isVi ? 'Sao chép Token Đăng Nhập' : 'Copy Login Token')}
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
    maxWidth: '100%',
    overflow: 'hidden',
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
    width: '100%',
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
    maxWidth: '90%',
  },
  tokenPreviewBox: {
    width: '100%',
    maxWidth: 340,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  tokenHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberIdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  monoPreview: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    width: '100%',
  },
});
