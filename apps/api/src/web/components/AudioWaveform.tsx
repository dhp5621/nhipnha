import React from 'react';
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
  const { colors } = useTheme();

  const color = accentColor || colors.primary;

  const defaultWaveform = [
    0.2, 0.45, 0.7, 0.5, 0.9, 0.8, 0.6, 0.35, 0.6, 0.85, 0.4, 0.75, 0.95, 0.55, 0.3, 0.65, 0.8,
    0.45, 0.25, 0.5, 0.7, 0.3,
  ];

  const bars = waveform && waveform.length > 0 ? waveform : defaultWaveform;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        borderRadius: 24,
        backgroundColor: colors.surfaceContainer,
        border: `1px solid ${colors.outlineVariant}`,
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
            backgroundColor: color,
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.15s ease',
          }}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          <MIcon name={isPlaying ? 'pause' : 'play_arrow'} size={24} color="#FFFFFF" />
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
        {bars.map((rawVal, i) => {
          // Support both 0..1 normalized and 0..100 percentage waveform arrays
          const heightNorm = rawVal > 1 ? Math.min(1, rawVal / 100) : Math.max(0.1, rawVal);
          const dynamicNorm = isPlaying
            ? Math.min(1, Math.max(0.2, heightNorm * (0.65 + 0.35 * Math.sin(i * 1.3))))
            : heightNorm;
          const heightPx = Math.max(4, Math.round(dynamicNorm * 34));
          const isActive = isRecording || isPlaying;
          return (
            <div
              key={i}
              className={isPlaying ? 'waveform-bar-playing' : undefined}
              style={{
                width: 4,
                height: `${heightPx}px`,
                borderRadius: 2,
                backgroundColor: isActive ? color : colors.outline,
                transition: 'height 0.15s ease, background-color 0.2s ease',
                animationDelay: isPlaying ? `${(i % 6) * 0.12}s` : undefined,
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      {/* Time display */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: isRecording ? colors.error : colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {isRecording && remainingSec !== undefined ? (
          <span>{remainingSec}s</span>
        ) : durationSec !== undefined ? (
          <span>{durationSec}s</span>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes waveBounce {
          0%, 100% { transform: scaleY(0.65); }
          50% { transform: scaleY(1.18); }
        }
        .waveform-bar-playing {
          animation: waveBounce 0.65s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};
