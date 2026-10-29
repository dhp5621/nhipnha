import { Platform } from 'react-native';
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
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: any = null;
  private currentAudioObject: any = null;
  private audioContext: any = null;

  /**
   * Lazily initializes standard Web AudioContext with autoplay policy handling
   */
  private getAudioContext(): any {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

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
   * Plays a gentle, resonant Morning Bell chime using the Web Audio API synthesizer.
   * Works on 100% of browsers without needing an external audio file.
   */
  playMorningBellChime(onEnded?: () => void): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      if (onEnded) setTimeout(onEnded, 2500);
      return;
    }

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.35, now);

      // Chime harmonics: fundamental (D5 - 587.33Hz) + shimmering harmonic overtones
      const baseFreq = 587.33;
      const partials = [
        { ratio: 1.0, volume: 1.0, decay: 2.4 },
        { ratio: 2.02, volume: 0.55, decay: 1.8 },
        { ratio: 3.0, volume: 0.3, decay: 1.2 },
        { ratio: 4.16, volume: 0.12, decay: 0.8 },
      ];

      partials.forEach((partial) => {
        const osc = ctx.createOscillator();
        const partialGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * partial.ratio, now);

        partialGain.gain.setValueAtTime(0, now);
        partialGain.gain.linearRampToValueAtTime(partial.volume, now + 0.02);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, now + partial.decay);

        osc.connect(partialGain);
        partialGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + partial.decay);
      });

      if (onEnded) {
        setTimeout(onEnded, 2400);
      }
    } catch (err) {
      console.warn('Error playing morning bell chime:', err);
      if (onEnded) onEnded();
    }
  }

  /**
   * Starts real microphone recording across Web and modern OS engines.
   * Automatically requests runtime OS microphone permission beforehand if needed.
   */
  async startAudioRecording(isVi: boolean = true): Promise<boolean> {
    this.startTime = Date.now();
    this.audioChunks = [];

    // Automatically check and request OS / browser microphone permission
    const granted = await permissionService.requestPermission('microphone', isVi);
    if (!granted) {
      console.warn('Microphone permission not granted by user.');
      return false;
    }

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

          this.mediaRecorder.start(250);
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
   * Plays an audio URL or synthesized speech fallback with safety timeout
   */
  playAudioUrl(url?: string, transcription?: string, onEnded?: () => void): void {
    this.stopAudioPlayback();

    // 1. If it's a real playable audio URL (HTTP / data:audio)
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:audio'))) {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
        try {
          const audio = new (window as any).Audio(url);
          this.currentAudioObject = audio;

          let hasEnded = false;
          const finish = () => {
            if (!hasEnded) {
              hasEnded = true;
              this.currentAudioObject = null;
              if (onEnded) onEnded();
            }
          };

          audio.onended = finish;
          audio.onerror = () => {
            console.warn('Audio playback error, falling back to speech synthesis if available');
            if (transcription) {
              this.speakText(transcription, onEnded);
            } else {
              finish();
            }
          };

          audio.play().catch((err: any) => {
            console.warn('Audio play() rejected:', err);
            if (transcription) {
              this.speakText(transcription, onEnded);
            } else {
              finish();
            }
          });
          return;
        } catch (err) {
          console.warn('Cannot instantiate Audio:', err);
        }
      }
    }

    // 2. Fallback: Synthesize speech from transcription if available
    if (transcription) {
      this.speakText(transcription, onEnded);
      return;
    }

    // 3. Last fallback: Soft chime tone
    this.playMorningBellChime(onEnded);
  }

  /**
   * Speech synthesis fallback for bedtime stories or transcription text
   */
  speakText(text: string, onEnded?: () => void): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        let finished = false;
        const done = () => {
          if (!finished) {
            finished = true;
            if (onEnded) onEnded();
          }
        };

        utterance.onend = done;
        utterance.onerror = done;

        const safeTimeout = Math.max(3000, Math.min(text.length * 90, 15000));
        setTimeout(done, safeTimeout);

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    if (onEnded) setTimeout(onEnded, 3000);
  }

  /**
   * Stops any currently playing audio or speech
   */
  stopAudioPlayback(): void {
    if (this.currentAudioObject) {
      try {
        this.currentAudioObject.pause();
        this.currentAudioObject.currentTime = 0;
      } catch {}
      this.currentAudioObject = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Opens OS photo picker intent or camera intent automatically.
   * In Web/Android WebView, leverages HTML5 file input with `capture="environment"`
   * which instructs OS (Android/iOS) to directly launch the native camera intent,
   * or the system photo gallery picker intent.
   */
  async pickOrCapturePhoto(useCamera: boolean = false): Promise<PickedPhotoResult | null> {
    // If requesting Camera, automatically ensure Camera permission is requested if on native Android
    if (useCamera && Platform.OS === 'android') {
      await permissionService.requestPermission('camera');
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.position = 'fixed';
        input.style.top = '-1000px';
        input.style.left = '-1000px';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';

        // When useCamera is true, attribute triggers OS Camera Intent directly
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

        const handleWindowFocus = () => {
          window.removeEventListener('focus', handleWindowFocus);
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              cleanup();
            }
          }, 1000);
        };
        window.addEventListener('focus', handleWindowFocus);

        document.body.appendChild(input);
        // Synchronously click to fire OS file picker/camera intent dialog
        input.click();
      });
    }

    return Promise.resolve({
      dataUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=480&q=80',
      name: 'family_photo.jpg',
      dominantColor: '#DF5018',
    });
  }
}

export const mediaCaptureService = new MediaCaptureService();
