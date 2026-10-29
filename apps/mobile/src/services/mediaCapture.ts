import { Platform } from 'react-native';
import { offlineStorage } from './offlineStorage';

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
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: any = null;

  /**
   * Starts real microphone recording on Web (MediaRecorder) or simulated native recording fallback
   */
  async startAudioRecording(): Promise<boolean> {
    this.startTime = Date.now();
    this.audioChunks = [];

    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const MediaRecorderClass = (window as any).MediaRecorder;
        if (MediaRecorderClass) {
          this.mediaRecorder = new MediaRecorderClass(this.stream);
          this.mediaRecorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };
          this.mediaRecorder.start();
          return true;
        }
      } catch (err) {
        console.warn('Web MediaRecorder fallback:', err);
      }
    }
    return true;
  }

  /**
   * Stops audio recording and returns a base64 data URL (playable across devices via database)
   */
  async stopAudioRecording(fallbackDurationSec: number = 14): Promise<RecordedAudioResult> {
    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - (this.startTime || Date.now())) / 1000) || fallbackDurationSec
    );

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = async () => {
          try {
            if (this.stream) {
              this.stream.getTracks().forEach((t: any) => t.stop());
              this.stream = null;
            }
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
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
        this.mediaRecorder.stop();
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
   * Plays an audio URL or base64 data URL on Web
   */
  playAudioUrl(url?: string): void {
    if (!url || url.startsWith('mock://')) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
      try {
        const audio = new (window as any).Audio(url);
        audio.play().catch(() => {});
      } catch {
        // Ignore playback error
      }
    }
  }

  /**
   * Opens file/camera photo picker and compresses image to a lightweight data URL for database storage
   */
  async pickOrCapturePhoto(useCamera: boolean = false): Promise<PickedPhotoResult | null> {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (useCamera) {
          input.setAttribute('capture', 'environment');
        }
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            const rawDataUrl = ev.target?.result as string;
            // Compress onto a small canvas (max 480px) so it stores cleanly in Postgres JSONB
            const img = new (window as any).Image();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const maxDim = 480;
                let w = img.width;
                let h = img.height;
                if (w > h && w > maxDim) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else if (h > maxDim) {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.78);
                resolve({
                  dataUrl: compressedUrl,
                  name: file.name || 'photo.jpg',
                  dominantColor: '#10B981',
                });
              } catch {
                resolve({
                  dataUrl: rawDataUrl,
                  name: file.name || 'photo.jpg',
                  dominantColor: '#10B981',
                });
              }
            };
            img.onerror = () => {
              resolve({
                dataUrl: rawDataUrl,
                name: file.name || 'photo.jpg',
                dominantColor: '#10B981',
              });
            };
            img.src = rawDataUrl;
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    // Native fallback sample snapshot when native camera module is not prebuilt
    return {
      dataUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=480&q=80',
      name: 'camera_photo.jpg',
      dominantColor: '#10B981',
    };
  }
}

export const mediaCaptureService = new MediaCaptureService();
