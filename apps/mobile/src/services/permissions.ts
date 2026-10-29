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
          return has ? 'granted' : 'denied';
        }
        if (type === 'camera') {
          const has = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          return has ? 'granted' : 'denied';
        }
      }

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
          try {
            const permName = type === 'microphone' ? 'microphone' : type === 'camera' ? 'camera' : 'notifications';
            const status = await (navigator as any).permissions.query({ name: permName });
            if (status.state === 'granted') return 'granted';
            if (status.state === 'denied') return 'denied';
            return 'undetermined';
          } catch {
            // Some browsers do not support microphone/camera query in permissions API
          }
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
      // 1. Android Native Permissions Check & Request
      if (Platform.OS === 'android') {
        const targetPerm =
          type === 'microphone'
            ? PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            : type === 'camera'
            ? PermissionsAndroid.PERMISSIONS.CAMERA
            : null;

        if (targetPerm) {
          const has = await PermissionsAndroid.check(targetPerm);
          if (has) {
            await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
            return true;
          }

          const result = await PermissionsAndroid.request(targetPerm, {
            title: isVi
              ? type === 'microphone'
                ? 'Cho phép sử dụng Micro'
                : 'Cho phép sử dụng Máy ảnh'
              : type === 'microphone'
              ? 'Microphone Permission'
              : 'Camera Permission',
            message: isVi
              ? type === 'microphone'
                ? 'Nhịp Nhà cần quyền micro để gửi tin nhắn thoại yêu thương kết nối gia đình.'
                : 'Nhịp Nhà cần quyền máy ảnh để chụp ảnh và quét mã kết nối.'
              : type === 'microphone'
              ? 'Nhịp Nhà needs microphone access to record voice messages for family.'
              : 'Nhịp Nhà needs camera access to capture moments and scan QR codes.',
            buttonPositive: isVi ? 'Cho phép' : 'Allow',
            buttonNegative: isVi ? 'Để sau' : 'Not now',
          });

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

      // 2. Web Platform: Check live hardware permissions and probe mediaDevices
      if (Platform.OS === 'web') {
        if (type === 'microphone') {
          if (
            typeof navigator !== 'undefined' &&
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
          ) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
              return true;
            } catch (err: any) {
              console.warn('Microphone permission request rejected:', err);
              await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'denied');
              return false;
            }
          }
          return true;
        }

        if (type === 'camera') {
          // In web browsers, file input with capture or camera works via browser prompt without pre-blocking
          await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
          return true;
        }

        return true;
      }

      // 3. iOS Fallback via Alert Dialog
      const current = await AsyncStorage.getItem(`${PERM_STORAGE_PREFIX}${type}`);
      if (current === 'granted') return true;

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
