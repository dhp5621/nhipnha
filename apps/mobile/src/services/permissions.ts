import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PermissionType = 'microphone' | 'camera' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

const PERM_STORAGE_PREFIX = 'nhipnha_perm_';

export const permissionService = {
  async getStatus(type: PermissionType): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        if (type === 'microphone') {
          const has = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          if (has) return 'granted';
        }
        if (type === 'camera') {
          const has = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          if (has) return 'granted';
        }
      }
      const saved = await AsyncStorage.getItem(`${PERM_STORAGE_PREFIX}${type}`);
      if (saved === 'granted' || saved === 'denied') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'undetermined';
  },

  async requestPermission(
    type: PermissionType,
    isVi: boolean = true
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (type === 'microphone') {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: isVi ? 'Cho phép sử dụng Micro' : 'Microphone Permission',
              message: isVi
                ? 'Nhịp Nhà cần quyền micro để ghi âm lời nhắn thoại gửi cho gia đình.'
                : 'Nhịp Nhà needs microphone access to record voice notes for your family.',
              buttonPositive: isVi ? 'Cho phép' : 'Allow',
              buttonNegative: isVi ? 'Để sau' : 'Not now',
            }
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          await AsyncStorage.setItem(
            `${PERM_STORAGE_PREFIX}${type}`,
            granted ? 'granted' : 'denied'
          );
          if (!granted && result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            this.promptOpenSettings(type, isVi);
          }
          return granted;
        }

        if (type === 'camera') {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: isVi ? 'Cho phép sử dụng Máy ảnh' : 'Camera Permission',
              message: isVi
                ? 'Nhịp Nhà cần quyền máy ảnh để quét mã QR gia đình và chụp ảnh nhật ký.'
                : 'Nhịp Nhà needs camera access to scan family QR codes and capture photos.',
              buttonPositive: isVi ? 'Cho phép' : 'Allow',
              buttonNegative: isVi ? 'Để sau' : 'Not now',
            }
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          await AsyncStorage.setItem(
            `${PERM_STORAGE_PREFIX}${type}`,
            granted ? 'granted' : 'denied'
          );
          if (!granted && result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            this.promptOpenSettings(type, isVi);
          }
          return granted;
        }
      }

      const current = await AsyncStorage.getItem(`${PERM_STORAGE_PREFIX}${type}`);
      if (current === 'granted') return true;

      // On Web, React Native's Alert.alert does not support multi-button callbacks.
      // Auto-grant and persist so web actions never hang.
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
        return true;
      }

      // iOS fallback: ask once via native alert
      return new Promise((resolve) => {
        const title =
          type === 'microphone'
            ? isVi
              ? 'Cấp quyền Micro'
              : 'Microphone Access'
            : type === 'camera'
            ? isVi
              ? 'Cấp quyền Máy ảnh'
              : 'Camera Access'
            : isVi
            ? 'Cấp quyền Thông báo'
            : 'Notification Access';

        const desc =
          type === 'microphone'
            ? isVi
              ? 'Cho phép Nhịp Nhà truy cập micro để ghi âm lời nhắn thoại gửi cho gia đình?'
              : 'Allow Nhịp Nhà to access the microphone to record voice notes?'
            : type === 'camera'
            ? isVi
              ? 'Cho phép Nhịp Nhà truy cập máy ảnh để quét mã QR và chụp ảnh?'
              : 'Allow Nhịp Nhà to access the camera for QR scanning and photos?'
            : isVi
            ? 'Cho phép nhận thông báo Tiếng chuông buổi sáng và tin nhắn mới?'
            : 'Allow notifications for Morning Bell and family messages?';

        Alert.alert(title, desc, [
          {
            text: isVi ? 'Từ chối' : 'Deny',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'denied');
              resolve(false);
            },
          },
          {
            text: isVi ? 'Cho phép' : 'Allow',
            onPress: async () => {
              await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
              resolve(true);
            },
          },
        ]);
      });
    } catch {
      return true;
    }
  },

  promptOpenSettings(type: PermissionType, isVi: boolean = true) {
    if (Platform.OS === 'web') return;
    const label =
      type === 'microphone'
        ? isVi
          ? 'Micro'
          : 'Microphone'
        : isVi
        ? 'Máy ảnh'
        : 'Camera';
    Alert.alert(
      isVi ? `Chưa bật quyền ${label}` : `${label} Permission Required`,
      isVi
        ? `Vui lòng mở Cài đặt hệ thống để bật quyền ${label} cho Nhịp Nhà.`
        : `Please open System Settings to enable ${label} access for Nhịp Nhà.`,
      [
        { text: isVi ? 'Đóng' : 'Cancel', style: 'cancel' },
        {
          text: isVi ? 'Mở Cài đặt' : 'Open Settings',
          onPress: () => Linking.openSettings().catch(() => {}),
        },
      ]
    );
  },
};
