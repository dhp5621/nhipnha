import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { THEME } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

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
  const { colors, isDark } = useTheme();
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
      ? 'Đang phát lời nhắn...'
      : 'Playing voice note...'
    : waveform && waveform.length > 0
    ? isVi
      ? 'Đã thu âm • Sẵn sàng gửi'
      : 'Recorded • Ready to send'
    : isVi
    ? 'Chạm nút bên dưới để bắt đầu nói'
    : 'Tap the button below to speak';

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
        {
          backgroundColor: isRecording
            ? colors.afternoonSurface
            : isPlaying
            ? colors.eveningSurface
            : colors.surfaceContainerLow,
        },
      ]}
    >
      {/* Top Status Pill */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isRecording
                ? colors.afternoonContainer
                : isPlaying
                ? colors.eveningContainer
                : colors.surfaceContainerHigh,
            },
          ]}
        >
          <View
            style={[
              styles.dotIndicator,
              {
                backgroundColor: isRecording
                  ? '#DC2626'
                  : isPlaying
                  ? colors.eveningPurple
                  : waveform
                  ? colors.success
                  : colors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.timerText,
              {
                color: isRecording
                  ? colors.onAfternoonContainer
                  : isPlaying
                  ? colors.onEveningContainer
                  : colors.textDark,
              },
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
          const barHeight = Math.max(12, (heightPercent / 100) * 56);
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isRecording
                    ? colors.afternoonOrange
                    : isPlaying
                    ? colors.eveningPurple
                    : waveform
                    ? colors.success
                    : isDark
                    ? '#52433B'
                    : '#CFC2B6',
                  opacity: isActiveBar ? 1 : waveform ? 0.85 : 0.65,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Progress Track */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.surfaceContainerHighest },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progressRatio * 100)}%`,
              backgroundColor: isRecording
                ? colors.afternoonOrange
                : isPlaying
                ? colors.eveningPurple
                : colors.success,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginVertical: 10,
    alignItems: 'center',
    width: '100%',
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
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  timerText: {
    fontSize: THEME.typography.bodyRegular,
    fontWeight: '800',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
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
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
