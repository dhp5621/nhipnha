export interface RecordedAudioResult {
  url: string;
  duration: number;
  waveform: number[];
  transcript?: string;
}

export interface PickedPhotoResult {
  dataUrl: string;
  name: string;
  dominantColor: string;
}

class WebAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private startTime: number = 0;
  private currentAudioElement: HTMLAudioElement | null = null;
  private animationFrameId: number | null = null;
  private recordedWaveform: number[] = [];
  private speechRecognition: any = null;
  private recordedTranscript: string = '';

  /**
   * Synthesize a warm morning bell chime using Web Audio API oscillators
   */
  playMorningBellChime(onEnd?: () => void): void {
    if (typeof window === 'undefined') {
      setTimeout(() => onEnd?.(), 1000);
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.85);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.18);
          osc.stop(ctx.currentTime + idx * 0.18 + 0.9);
        });
      }
    } catch (e) {
      console.warn('Web Audio chime error:', e);
    }
    setTimeout(() => onEnd?.(), 1000);
  }

  /**
   * Request microphone and start audio recording with live waveform analyser & real-time Vietnamese speech recognition
   */
  async startAudioRecording(
    onWaveformSample?: (waveform: number[]) => void,
    onTranscript?: (transcript: string) => void,
    lang: string = 'vi-VN'
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.stopCurrentAudio();
      this.audioChunks = [];
      this.recordedWaveform = [];
      this.recordedTranscript = '';
      this.startTime = Date.now();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 1. Web Audio Analyser for real-time waveform visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const sampleWaveform = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);

          // Calculate average amplitude
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / (dataArray.length * 255);
          const normalized = Math.min(1, Math.max(0.12, Number((avg * 1.5).toFixed(2))));

          this.recordedWaveform.push(normalized);
          if (this.recordedWaveform.length > 28) {
            this.recordedWaveform.shift();
          }
          onWaveformSample?.([...this.recordedWaveform]);

          this.animationFrameId = requestAnimationFrame(sampleWaveform);
        };
        sampleWaveform();
      }

      // 2. Real-time Vietnamese Speech-to-Text Recognition via Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = lang;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const full = (finalTranscript + interimTranscript).trim();
            this.recordedTranscript = full;
            onTranscript?.(full);
          };

          recognition.onerror = () => {
            // Speech recognition error or silent fallback
          };

          recognition.start();
          this.speechRecognition = recognition;
        } catch {
          // Web speech not available on this engine
        }
      }

      // 3. MediaRecorder for Audio File Capture
      const recorder = new MediaRecorder(this.mediaStream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      recorder.start(200);
      this.mediaRecorder = recorder;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      return false;
    }
  }

  /**
   * Stop audio recording and return audio data URL, waveform and transcribed speech
   */
  async stopAudioRecording(fallbackDurationSec: number = 15): Promise<RecordedAudioResult> {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch {}
      this.speechRecognition = null;
    }

    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - (this.startTime || Date.now())) / 1000) || fallbackDurationSec
    );

    const fallbackWaveform = [
      0.35, 0.65, 0.85, 0.55, 0.9, 0.45, 0.75, 0.35, 0.8, 0.6, 0.4, 0.7, 0.5, 0.3,
    ];

    if (!this.mediaRecorder) {
      return {
        url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
        duration: elapsedSec,
        waveform: this.recordedWaveform.length >= 10 ? this.recordedWaveform : fallbackWaveform,
        transcript: this.recordedTranscript || undefined,
      };
    }

    return new Promise((resolve) => {
      const recorder = this.mediaRecorder!;
      recorder.onstop = () => {
        try {
          const mime = recorder.mimeType || 'audio/webm';
          const blob = new Blob(this.audioChunks, { type: mime });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = (reader.result as string) || '';
            if (this.mediaStream) {
              this.mediaStream.getTracks().forEach((track) => track.stop());
              this.mediaStream = null;
            }
            this.mediaRecorder = null;
            resolve({
              url: dataUrl,
              duration: elapsedSec,
              waveform:
                this.recordedWaveform.length >= 10
                  ? this.recordedWaveform.slice(-24)
                  : fallbackWaveform,
              transcript: this.recordedTranscript || undefined,
            });
          };
          reader.readAsDataURL(blob);
        } catch {
          resolve({
            url: '',
            duration: elapsedSec,
            waveform: fallbackWaveform,
            transcript: this.recordedTranscript || undefined,
          });
        }
      };

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    });
  }

  /**
   * Play audio URL with HTML5 Audio, graceful mock URI bypass, or Web Speech fallback
   */
  async playAudioUrl(
    url?: string,
    synthesizedText?: string,
    onEnd?: () => void
  ): Promise<void> {
    this.stopCurrentAudio();

    // If it's a mock URI (e.g. mock://audio/...), bypass HTML Audio element and speak with TTS
    if (url && (url.startsWith('mock://') || url.startsWith('file://'))) {
      this.speakText(synthesizedText, onEnd);
      return;
    }

    if (url && (url.startsWith('data:audio') || url.startsWith('http') || url.startsWith('blob:'))) {
      try {
        const audio = new Audio(url);
        this.currentAudioElement = audio;
        audio.onended = () => {
          this.currentAudioElement = null;
          onEnd?.();
        };
        audio.onerror = () => {
          this.currentAudioElement = null;
          this.speakText(synthesizedText, onEnd);
        };
        await audio.play();
        return;
      } catch (err) {
        console.warn('HTMLAudio play error:', err);
      }
    }

    this.speakText(synthesizedText, onEnd);
  }

  private speakText(text?: string, onEnd?: () => void) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.15; // Natural, cheerful young voice tone

        // Select Vietnamese voice if available on user device
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find((v) => v.lang.toLowerCase().includes('vi'));
        if (viVoice) {
          utterance.voice = viVoice;
        }

        utterance.onend = () => onEnd?.();
        utterance.onerror = () => onEnd?.();
        window.speechSynthesis.speak(utterance);
        return;
      } catch {}
    }
    setTimeout(() => onEnd?.(), 2500);
  }

  stopCurrentAudio(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  stopAudioPlayback(): void {
    this.stopCurrentAudio();
  }

  /**
   * Reads an uploaded image file as compressed data URL
   */
  async processImageFile(file: File): Promise<PickedPhotoResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          dataUrl,
          name: file.name,
          dominantColor: '#DF5018',
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const webAudioService = new WebAudioService();
