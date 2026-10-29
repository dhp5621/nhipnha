import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { THEME } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

interface AudioWaveformProps {
  isRecording: boolean;
  isPlaying?: boolean;
  durationLeft?: number;
  maxDuration?: number;
  waveform?: number[];
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  isPlaying = false,
  durationLeft = 15,
  maxDuration = 15,
  waveform,
}) => {
  const { activeLanguage } = useLanguage();
  const [liveBars, setLiveBars] = useState<number[]>([
    25, 45, 75, 92, 60, 38, 84, 96, 55, 32, 68, 88, 50, 72, 40, 62,
  ]);

  useEffect(() => {
    if (!isRecording && !isPlaying) return;

    const interval = setInterval(() => {
      setLiveBars((prev) =>
        prev.map(() => Math.floor(22 + Math.random() * 78))
      );
    }, 140);

    return () => clearInterval(interval);
  }, [isRecording, isPlaying]);

  const barsToDisplay = waveform && waveform.length > 0 ? waveform : liveBars;

  const isVi = activeLanguage === 'vi';
  const statusLabel = isRecording
    ? isVi
      ? `Đang thu âm • 00:${durationLeft.toString().padStart(2, '0')}s`
      : `Recording • 00:${durationLeft.toString().padStart(2, '0')}s`
    : isPlaying
    ? isVi
      ? 'Đang phát lời nhắn yêu thương...'
      : 'Playing loving voice note...'
    : waveform && waveform.length > 0
    ? isVi
      ? 'Đã thu âm xong • Sẵn sàng gửi'
      : 'Voice recorded • Ready to send'
    : isVi
    ? 'Bấm nút bên dưới để bắt đầu nói'
    : 'Tap the button below to start speaking';

  const progressRatio = isRecording
    ? Math.max(0, Math.min(1, (maxDuration - durationLeft) / maxDuration))
    : isPlaying
    ? 0.65
    : waveform
    ? 1
    : 0;

  return (
    <View
      style={[
        styles.container,
        isRecording && styles.containerRecording,
        isPlaying && styles.containerPlaying,
      ]}
    >
      {/* Top Status Pill */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.statusPill,
            isRecording
              ? styles.pillRecording
              : isPlaying
              ? styles.pillPlaying
              : styles.pillIdle,
          ]}
        >
          <Text style={styles.statusEmoji}>
            {isRecording ? '🔴' : isPlaying ? '🔊' : waveform ? '✅' : '🎙️'}
          </Text>
          <Text
            style={[
              styles.timerText,
              isRecording && { color: '#9A3412' },
              isPlaying && { color: '#3730A3' },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Expressive Waveform Bars */}
      <View style={styles.barsContainer}>
        {barsToDisplay.map((heightPercent, idx) => {
          const isActiveBar = isRecording || isPlaying;
          const barHeight = Math.max(12, (heightPercent / 100) * 58);
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isRecording
                    ? idx % 2 === 0
                      ? '#EA580C'
                      : '#F97316'
                    : isPlaying
                    ? idx % 2 === 0
                      ? '#4F46E5'
                      : '#6366F1'
                    : waveform
                    ? '#16A34A'
                    : '#CBD5E1',
                  opacity: isActiveBar ? 1 : waveform ? 0.85 : 0.6,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Subtle Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progressRatio * 100)}%`,
              backgroundColor: isRecording
                ? '#EA580C'
                : isPlaying
                ? '#4F46E5'
                : '#16A34A',
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF6F0',
    borderWidth: 2,
    borderColor: '#E5DEC9',
    borderRadius: THEME.borderRadius.card,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  containerRecording: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FB923C',
  },
  containerPlaying: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillIdle: {
    backgroundColor: '#EFECE6',
  },
  pillRecording: {
    backgroundColor: '#FFEDD5',
  },
  pillPlaying: {
    backgroundColor: '#E0E7FF',
  },
  statusEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  timerText: {
    fontSize: THEME.typography.bodyRegular,
    fontWeight: '800',
    color: THEME.colors.textDark,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    width: '100%',
    gap: 5,
  },
  bar: {
    width: 7,
    borderRadius: 999,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
