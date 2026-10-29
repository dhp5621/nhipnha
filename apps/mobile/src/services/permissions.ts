import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export type PermissionType = 'microphone' | 'camera' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

const PERM_STORAGE_PREFIX = 'nhipnha_perm_';

export const permissionService = {
  async getStatus(type: PermissionType): Promise<PermissionStatus> {
    try {
      if (type === 'camera') {
        const res = await Camera.getCameraPermissionsAsync();
        if (res.granted) return 'granted';
        if (res.status === 'denied' && !res.canAskAgain) return 'denied';
        return 'undetermined';
      }

      if (type === 'microphone') {
        const res = await Audio.getPermissionsAsync();
        if (res.granted) return 'granted';
        if (res.status === 'denied' && !res.canAskAgain) return 'denied';
        return 'undetermined';
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

  /**
   * Requests runtime OS permission using official Expo native libraries
   */
  async requestPermission(
    type: PermissionType,
    isVi: boolean = true
  ): Promise<boolean> {
    try {
      if (type === 'camera') {
        const res = await Camera.requestCameraPermissionsAsync();
        const granted = res.granted;
        await AsyncStorage.setItem(
          `${PERM_STORAGE_PREFIX}${type}`,
          granted ? 'granted' : 'denied'
        );

        if (!granted && !res.canAskAgain && Platform.OS !== 'web') {
          this.showSettingsAlert(type, isVi);
        }
        return granted;
      }

      if (type === 'microphone') {
        const res = await Audio.requestPermissionsAsync();
        const granted = res.granted;
        await AsyncStorage.setItem(
          `${PERM_STORAGE_PREFIX}${type}`,
          granted ? 'granted' : 'denied'
        );

        if (!granted && !res.canAskAgain && Platform.OS !== 'web') {
          this.showSettingsAlert(type, isVi);
        }
        return granted;
      }

      await AsyncStorage.setItem(`${PERM_STORAGE_PREFIX}${type}`, 'granted');
      return true;
    } catch (err) {
      console.warn(`Error requesting ${type} permission:`, err);
      return false;
    }
  },

  showSettingsAlert(type: PermissionType, isVi: boolean = true) {
    Alert.alert(
      isVi ? 'Cần cấp quyền trong Cài đặt' : 'Permission Required',
      isVi
        ? type === 'microphone'
          ? 'Quyền micro đã bị từ chối trước đó. Vui lòng mở Cài đặt ứng dụng để cho phép Nhịp Nhà ghi âm lời nhắn.'
          : 'Quyền máy ảnh đã bị từ chối trước đó. Vui lòng mở Cài đặt ứng dụng để cho phép Nhịp Nhà quét mã QR và chụp ảnh.'
        : type === 'microphone'
        ? 'Microphone permission was previously denied. Please open Settings to allow audio recording.'
        : 'Camera permission was previously denied. Please open Settings to allow camera and QR scanning.',
      [
        { text: isVi ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: isVi ? 'Mở Cài đặt' : 'Open Settings',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Linking.openSettings().catch(() => {});
            }
          },
        },
      ]
    );
  },
};
