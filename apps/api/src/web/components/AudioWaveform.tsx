import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';

interface AudioWaveformProps {
  waveform?: number[];
  isPlaying?: boolean;
  isRecording?: boolean;
  durationSec?: number;
  remainingSec?: number;
  onPlayToggle?: () => void;
  accentColor?: string;
  style?: React.CSSProperties;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  waveform,
  isPlaying = false,
  isRecording = false,
  durationSec,
  remainingSec,
  onPlayToggle,
  accentColor,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const color = accentColor || colors.primary;
  const totalDuration = durationSec && durationSec > 0 ? durationSec : 15;

  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [animTick, setAnimTick] = useState<number>(0);
  const animTimerRef = useRef<number | null>(null);

  // Live playback tracking and equalizer wave animation
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - elapsedSec * 1000;
      animTimerRef.current = window.setInterval(() => {
        const now = Date.now();
        const currentElapsed = (now - startTime) / 1000;
        setElapsedSec(Math.min(totalDuration, currentElapsed));
        setAnimTick((prev) => (prev + 1) % 360);
      }, 50);
    } else {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
      setElapsedSec(0);
    }

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  const defaultWaveform = [
    0.25, 0.45, 0.7, 0.55, 0.9, 0.8, 0.65, 0.4, 0.6, 0.85, 0.5, 0.75, 0.95, 0.6, 0.35, 0.7, 0.8,
    0.5, 0.3, 0.55, 0.75, 0.4,
  ];

  // Dynamically normalize bars so they NEVER render as tiny flat 4px dots
  const processedBars = useMemo(() => {
    const raw = waveform && waveform.length >= 6 ? waveform : defaultWaveform;
    const maxVal = Math.max(...raw.map((v) => (v > 1 ? v / 100 : v)), 0.05);

    return raw.map((val, idx) => {
      const norm = val > 1 ? val / 100 : val;
      // If the input was all flat / low values (e.g. 0.12), generate natural speech harmonic contours
      if (maxVal <= 0.18) {
        const curve =
          0.3 +
          0.55 * Math.sin((idx / (raw.length - 1)) * Math.PI) *
            (0.75 + 0.25 * Math.sin(idx * 1.8));
        return Math.min(1, Math.max(0.22, curve));
      }
      // Otherwise scale smoothly relative to peak so minimum height is clearly visible
      return Math.min(1, Math.max(0.2, (norm / maxVal) * 0.9));
    });
  }, [waveform]);

  const progress = isPlaying ? Math.min(1, elapsedSec / totalDuration) : 0;
  const currentBarIdx = Math.floor(progress * processedBars.length);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        borderRadius: 24,
        backgroundColor: colors.surfaceContainer,
        border: isPlaying ? `1.5px solid ${color}` : `1px solid ${colors.outlineVariant}`,
        boxShadow: isPlaying ? `0 4px 16px ${color}26` : 'none',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {/* Play / Stop Button if interactive */}
      {onPlayToggle ? (
        <button
          onClick={onPlayToggle}
          type="button"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: isPlaying ? (isDark ? '#FFFFFF' : color) : color,
            color: isPlaying ? (isDark ? color : '#FFFFFF') : '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isPlaying
              ? `0 0 0 4px ${color}40, 0 4px 12px ${color}66`
              : '0 2px 8px rgba(0,0,0,0.12)',
            transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          <MIcon
            name={isPlaying ? 'pause' : 'play_arrow'}
            size={24}
            color={isPlaying && isDark ? color : '#FFFFFF'}
          />
        </button>
      ) : isRecording ? (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: colors.error,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: 'pulse 1.2s infinite',
            boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.25)',
          }}
        >
          <MIcon name="mic" size={20} color="#FFFFFF" />
        </div>
      ) : null}

      {/* Waveform Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flex: 1,
          height: 36,
          overflow: 'hidden',
        }}
      >
        {processedBars.map((normVal, i) => {
          const isPlayed = i <= currentBarIdx;
          const isNearPlayhead = isPlaying && Math.abs(i - currentBarIdx) <= 2;

          // Dynamic wave dance when actively playing
          const dynamicMultiplier = isPlaying
            ? isPlayed
              ? 0.75 + 0.35 * Math.sin(animTick * 0.35 + i * 0.7)
              : 0.85
            : 1;

          const heightPx = Math.max(
            8,
            Math.round(normVal * 32 * dynamicMultiplier)
          );

          const barBg = isRecording
            ? color
            : isPlaying
            ? isPlayed
              ? color
              : isDark
              ? 'rgba(255, 255, 255, 0.22)'
              : 'rgba(0, 0, 0, 0.18)'
            : isDark
            ? 'rgba(255, 255, 255, 0.32)'
            : 'rgba(0, 0, 0, 0.25)';

          return (
            <div
              key={i}
              style={{
                width: 4,
                height: `${heightPx}px`,
                borderRadius: 2,
                backgroundColor: barBg,
                transform: isNearPlayhead ? 'scaleY(1.15)' : 'scaleY(1)',
                transition: isPlaying
                  ? 'height 0.08s ease, transform 0.1s ease, background-color 0.15s ease'
                  : 'height 0.2s ease, background-color 0.2s ease',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Time display: shows live advancing seconds while playing */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: isRecording
            ? colors.error
            : isPlaying
            ? color
            : colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          minWidth: isPlaying ? 54 : 32,
          textAlign: 'right',
        }}
      >
        {isRecording && remainingSec !== undefined ? (
          <span>{remainingSec}s</span>
        ) : isPlaying ? (
          <span>
            {Math.min(totalDuration, Math.floor(elapsedSec))}s / {totalDuration}s
          </span>
        ) : (
          <span>{totalDuration}s</span>
        )}
      </div>
    </div>
  );
};
