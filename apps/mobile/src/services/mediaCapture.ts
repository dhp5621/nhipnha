import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { offlineStorage } from './offlineStorage';
import { permissionService } from './permissions';

export interface RecordedAudioResult {
  url: string;
  duration: number;
  waveform: number[];
}

export interface PickedPhotoResult {
  dataUrl: string;
  name: string;
  dominantColor: string;
}

class MediaCaptureService {
  private recording: Audio.Recording | null = null;
  private currentSound: Audio.Sound | null = null;
  private startTime: number = 0;
  private fallbackWebRecorder: any = null;
  private fallbackWebChunks: any[] = [];
  private fallbackWebStream: any = null;

  /**
   * Starts real microphone recording using official Expo Audio (native Android & iOS)
   * or standard Web MediaRecorder on browsers.
   */
  async startAudioRecording(isVi: boolean = true): Promise<boolean> {
    this.startTime = Date.now();

    const granted = await permissionService.requestPermission('microphone', isVi);
    if (!granted) {
      console.warn('Microphone permission not granted by user.');
      return false;
    }

    // Native Android & iOS using official expo-av
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        if (this.recording) {
          try {
            await this.recording.stopAndUnloadAsync();
          } catch {}
          this.recording = null;
        }

        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await newRecording.startAsync();
        this.recording = newRecording;
        return true;
      } catch (err) {
        console.warn('Native expo-av recording start error:', err);
      }
    }

    // Web Fallback
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        this.fallbackWebChunks = [];
        this.fallbackWebStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const MediaRecorderClass = (window as any).MediaRecorder;
        if (MediaRecorderClass) {
          const recorder = new MediaRecorderClass(this.fallbackWebStream);
          recorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              this.fallbackWebChunks.push(event.data);
            }
          };
          recorder.start(250);
          this.fallbackWebRecorder = recorder;
          return true;
        }
      } catch (err) {
        console.warn('Web MediaRecorder error:', err);
      }
    }

    return true;
  }

  /**
   * Stops audio recording and returns a playable URI / base64 URL with waveform data
   */
  async stopAudioRecording(fallbackDurationSec: number = 14): Promise<RecordedAudioResult> {
    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - (this.startTime || Date.now())) / 1000) || fallbackDurationSec
    );

    // 1. Native expo-av recording stop
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        let dataUrl = uri || '';
        if (uri && Platform.OS !== 'web') {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            dataUrl = `data:audio/mp4;base64,${base64}`;
          } catch {
            dataUrl = uri;
          }
        }

        const mock = await offlineStorage.recordMockVoice(elapsedSec);
        return {
          url: dataUrl || mock.voiceUrl,
          duration: elapsedSec,
          waveform: mock.waveform,
        };
      } catch (err) {
        console.warn('Error stopping native recording:', err);
        this.recording = null;
      }
    }

    // 2. Web fallback recorder stop
    if (this.fallbackWebRecorder && this.fallbackWebRecorder.state !== 'inactive') {
      return new Promise((resolve) => {
        this.fallbackWebRecorder.onstop = async () => {
          try {
            if (this.fallbackWebStream) {
              this.fallbackWebStream.getTracks().forEach((t: any) => t.stop());
              this.fallbackWebStream = null;
            }

            const blob = new Blob(this.fallbackWebChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
              const dataUrl = reader.result as string;
              const mock = await offlineStorage.recordMockVoice(elapsedSec);
              resolve({
                url: dataUrl || mock.voiceUrl,
                duration: elapsedSec,
                waveform: mock.waveform,
              });
            };
            reader.readAsDataURL(blob);
          } catch {
            const mock = await offlineStorage.recordMockVoice(elapsedSec);
            resolve({
              url: mock.voiceUrl,
              duration: elapsedSec,
              waveform: mock.waveform,
            });
          }
        };

        try {
          this.fallbackWebRecorder.stop();
        } catch {
          this.fallbackWebRecorder = null;
        }
      });
    }

    const mock = await offlineStorage.recordMockVoice(elapsedSec);
    return {
      url: mock.voiceUrl,
      duration: mock.durationSec,
      waveform: mock.waveform,
    };
  }

  /**
   * Plays an audio URL using official Expo Audio.Sound
   */
  async playAudioUrl(
    url?: string,
    arg2?: string | (() => void),
    arg3?: string | (() => void)
  ): Promise<void> {
    this.stopCurrentAudio();

    let onEnd: (() => void) | undefined;
    let synthesizedText: string | undefined;

    if (typeof arg2 === 'function') {
      onEnd = arg2;
      synthesizedText = typeof arg3 === 'string' ? arg3 : undefined;
    } else if (typeof arg2 === 'string') {
      synthesizedText = arg2;
      onEnd = typeof arg3 === 'function' ? arg3 : undefined;
    }

    if (!url) {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window && synthesizedText) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(synthesizedText);
          utterance.lang = 'vi-VN';
          utterance.onend = () => onEnd?.();
          utterance.onerror = () => onEnd?.();
          window.speechSynthesis.speak(utterance);
          return;
        } catch {}
      }
      setTimeout(() => onEnd?.(), 1500);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      this.currentSound = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.stopCurrentAudio();
          onEnd?.();
        }
      });
      return;
    } catch (nativeErr) {
      console.warn('Native expo-av audio play failed, trying web audio / speech:', nativeErr);
    }

    // Web / DOM fallback
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
      try {
        const audio = new (window as any).Audio(url);
        audio.onended = () => onEnd?.();
        audio.onerror = () => onEnd?.();
        await audio.play();
        return;
      } catch {}
    }

    // TTS fallback if text provided
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      synthesizedText
    ) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(synthesizedText);
        utterance.lang = 'vi-VN';
        utterance.onend = () => onEnd?.();
        utterance.onerror = () => onEnd?.();
        window.speechSynthesis.speak(utterance);
        return;
      } catch {}
    }

    // Safety timeout
    setTimeout(() => onEnd?.(), 2500);
  }

  stopAudioPlayback(): void {
    this.stopCurrentAudio();
  }

  /**
   * Plays a warm, soothing morning chime sound
   */
  playMorningBellChime(onEnd?: () => void): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          frequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.18);
            osc.stop(ctx.currentTime + idx * 0.18 + 0.85);
          });
        }
      } catch {}
    }
    setTimeout(() => onEnd?.(), 1000);
  }

  /**
   * Stops any currently playing audio
   */
  stopCurrentAudio(): void {
    if (this.currentSound) {
      try {
        this.currentSound.stopAsync().catch(() => {});
        this.currentSound.unloadAsync().catch(() => {});
      } catch {}
      this.currentSound = null;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Captures a photo using the native system camera app (Android Intent / iOS UIImagePickerController)
   * or picks an image from the device's photo gallery via official `expo-image-picker`.
   */
  async pickOrCapturePhoto(useCamera: boolean = false): Promise<PickedPhotoResult | null> {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          return null;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const dataUrl = asset.base64
            ? `data:image/jpeg;base64,${asset.base64}`
            : asset.uri;
          return {
            dataUrl,
            name: asset.fileName || 'camera_photo.jpg',
            dominantColor: '#DF5018',
          };
        }
        return null;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const dataUrl = asset.base64
            ? `data:image/jpeg;base64,${asset.base64}`
            : asset.uri;
          return {
            dataUrl,
            name: asset.fileName || 'photo.jpg',
            dominantColor: '#DF5018',
          };
        }
        return null;
      }
    } catch (err) {
      console.warn('ImagePicker error:', err);
      return null;
    }
  }
}

export const mediaCaptureService = new MediaCaptureService();
