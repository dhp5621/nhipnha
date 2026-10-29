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
  private currentAudioObject: any = null;

  /**
   * Detects the best supported audio mime type for the current browser/engine
   */
  private getSupportedMimeType(): string {
    if (typeof window === 'undefined') return '';
    const MediaRecorderClass = (window as any).MediaRecorder;
    if (!MediaRecorderClass || typeof MediaRecorderClass.isTypeSupported !== 'function') {
      return '';
    }

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];

    for (const candidate of candidates) {
      if (MediaRecorderClass.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return '';
  }

  /**
   * Starts real microphone recording across Web and modern engines
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
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const MediaRecorderClass = (window as any).MediaRecorder;
        if (MediaRecorderClass) {
          const mimeType = this.getSupportedMimeType();
          const options = mimeType ? { mimeType } : undefined;
          this.mediaRecorder = new MediaRecorderClass(this.stream, options);

          this.mediaRecorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.start(250); // Slice chunks every 250ms for reliability
          return true;
        }
      } catch (err: any) {
        console.warn('Microphone hardware recording error, using fallback:', err);
      }
    }
    return true;
  }

  /**
   * Stops audio recording and returns a playable base64 data URL with waveform data
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

            const activeMimeType = this.mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(this.audioChunks, { type: activeMimeType });
            
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
          this.mediaRecorder.stop();
        } catch {
          if (this.stream) {
            this.stream.getTracks().forEach((t: any) => t.stop());
            this.stream = null;
          }
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
   * Plays an audio URL or base64 data URL cleanly across platforms
   */
  playAudioUrl(url?: string, onEnded?: () => void): void {
    if (!url || url.startsWith('mock://')) {
      if (onEnded) setTimeout(onEnded, 3000);
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
      try {
        if (this.currentAudioObject) {
          this.currentAudioObject.pause();
          this.currentAudioObject = null;
        }

        const audio = new (window as any).Audio(url);
        this.currentAudioObject = audio;

        if (onEnded) {
          audio.onended = () => {
            onEnded();
            this.currentAudioObject = null;
          };
          audio.onerror = () => {
            onEnded();
            this.currentAudioObject = null;
          };
        }

        audio.play().catch((err: any) => {
          console.warn('Audio playback error:', err);
          if (onEnded) onEnded();
        });
      } catch (err) {
        console.warn('Cannot initialize audio element:', err);
        if (onEnded) onEnded();
      }
    }
  }

  /**
   * Stops any currently playing audio track
   */
  stopAudioPlayback(): void {
    if (this.currentAudioObject) {
      try {
        this.currentAudioObject.pause();
      } catch {}
      this.currentAudioObject = null;
    }
  }

  /**
   * Opens OS file picker or camera cleanly via HTML5 file input with fallback compression
   */
  pickOrCapturePhoto(useCamera: boolean = false): Promise<PickedPhotoResult | null> {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        // Create file input element attached to DOM briefly for strict mobile Safari/Chrome gesture compatibility
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.position = 'fixed';
        input.style.top = '-1000px';
        input.style.left = '-1000px';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';

        if (useCamera) {
          input.setAttribute('capture', 'environment');
        }

        const cleanup = () => {
          try {
            if (input.parentNode) {
              document.body.removeChild(input);
            }
          } catch {}
        };

        input.onchange = () => {
          const file = input.files?.[0];
          cleanup();

          if (!file) {
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.onload = (ev) => {
            const rawDataUrl = ev.target?.result as string;

            // Compress onto canvas (max 480px, quality 0.8) so it uploads swiftly & fits in PostgreSQL JSONB
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
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve({
                  dataUrl: compressedUrl,
                  name: file.name || 'photo.jpg',
                  dominantColor: '#DF5018',
                });
              } catch {
                resolve({
                  dataUrl: rawDataUrl,
                  name: file.name || 'photo.jpg',
                  dominantColor: '#DF5018',
                });
              }
            };
            img.onerror = () => {
              resolve({
                dataUrl: rawDataUrl,
                name: file.name || 'photo.jpg',
                dominantColor: '#DF5018',
              });
            };
            img.src = rawDataUrl;
          };

          reader.onerror = () => {
            resolve(null);
          };

          reader.readAsDataURL(file);
        };

        // Window focus listener to detect user cancel dialog on browsers
        const handleWindowFocus = () => {
          window.removeEventListener('focus', handleWindowFocus);
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              cleanup();
              // Don't reject, just let user re-click
            }
          }, 1000);
        };
        window.addEventListener('focus', handleWindowFocus);

        document.body.appendChild(input);
        input.click();
      });
    }

    // Native fallback sample snapshot when running on standalone build without Expo Camera module
    return Promise.resolve({
      dataUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=480&q=80',
      name: 'family_photo.jpg',
      dominantColor: '#DF5018',
    });
  }
}

export const mediaCaptureService = new MediaCaptureService();
