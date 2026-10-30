import React from 'react';

interface GoogleLoadingIndicatorProps {
  size?: number;
  strokeWidth?: number;
  multiColor?: boolean;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Authentic Google Material Design indeterminate circular loader.
 * Features the signature smooth accelerating/decelerating dash-offset
 * and optional Google 4-color palette (Blue, Red, Yellow, Green) or single accent color.
 */
export const GoogleLoadingIndicator: React.FC<GoogleLoadingIndicatorProps> = ({
  size = 36,
  strokeWidth = 3.5,
  multiColor = true,
  color,
  className = '',
  style,
}) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66

  return (
    <div
      className={`google-spinner ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      role="progressbar"
      aria-label="Loading..."
    >
      <svg
        viewBox="0 0 50 50"
        style={{
          width: '100%',
          height: '100%',
          animation: 'google-spin 1.5s linear infinite',
        }}
      >
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke={color || (multiColor ? undefined : 'currentColor')}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={multiColor && !color ? 'google-spinner-path-multicolor' : 'google-spinner-path'}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      <style jsx>{`
        @keyframes google-spin {
          100% {
            transform: rotate(360deg);
          }
        }

        .google-spinner-path {
          animation: google-dash 1.4s ease-in-out infinite;
        }

        .google-spinner-path-multicolor {
          animation:
            google-dash 1.4s ease-in-out infinite,
            google-colors 5.6s ease-in-out infinite;
        }

        @keyframes google-dash {
          0% {
            stroke-dashoffset: 125.66;
            transform: rotate(0deg);
          }
          50% {
            stroke-dashoffset: 31.41;
            transform: rotate(135deg);
          }
          100% {
            stroke-dashoffset: 125.66;
            transform: rotate(450deg);
          }
        }

        @keyframes google-colors {
          0%, 100% {
            stroke: #4285F4; /* Google Blue */
          }
          25% {
            stroke: #EA4335; /* Google Red */
          }
          50% {
            stroke: #FBBC05; /* Google Yellow */
          }
          75% {
            stroke: #34A853; /* Google Green */
          }
        }
      `}</style>
    </div>
  );
};
