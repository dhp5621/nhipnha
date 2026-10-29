import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { THEME } from '../constants/theme';

interface AudioWaveformProps {
  isRecording: boolean;
  isPlaying?: boolean;
  durationLeft?: number;
  waveform?: number[];
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  isPlaying = false,
  durationLeft = 15,
  waveform,
}) => {
  const [liveBars, setLiveBars] = useState<number[]>([20, 45, 70, 90, 60, 40, 80, 95, 55, 30, 65, 85]);

  useEffect(() => {
    if (!isRecording && !isPlaying) return;

    const interval = setInterval(() => {
      setLiveBars((prev) =>
        prev.map(() => Math.floor(20 + Math.random() * 80))
      );
    }, 150);

    return () => clearInterval(interval);
  }, [isRecording, isPlaying]);

  const barsToDisplay = waveform && waveform.length > 0 ? waveform : liveBars;

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <Text style={styles.recordingDot}>{isRecording ? '🔴' : isPlaying ? '🔊' : '🎙️'}</Text>
        <Text style={styles.timerText}>
          {isRecording
            ? `Đang thu âm: 00:${durationLeft.toString().padStart(2, '0')}s`
            : isPlaying
            ? 'Đang phát lời nhắn'
            : 'Sẵn sàng ghi âm'}
        </Text>
      </View>

      <View style={styles.barsContainer}>
        {barsToDisplay.map((heightPercent, idx) => (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                height: Math.max(12, (heightPercent / 100) * 55),
                backgroundColor: isRecording
                  ? '#EA580C'
                  : isPlaying
                  ? '#4F46E5'
                  : '#94A3B8',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingDot: {
    fontSize: 20,
    marginRight: 8,
  },
  timerText: {
    fontSize: THEME.typography.bodyLarge,
    fontWeight: '700',
    color: THEME.colors.textDark,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: '100%',
  },
  bar: {
    width: 6,
    marginHorizontal: 3,
    borderRadius: 4,
  },
});
