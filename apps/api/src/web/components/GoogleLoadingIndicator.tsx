import React from 'react';

interface GoogleLoadingIndicatorProps {
  size?: number;
  strokeWidth?: number;
  multiColor?: boolean;
  color?: string;
  variant?: 'circular' | 'dots';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Authentic Google Material Design indeterminate loader.
 * Supports:
 * - 'circular': The signature Google continuous expanding/contracting arc spinner.
 * - 'dots': The iconic Google 4-color wave pulsating dots (Blue, Red, Yellow, Green).
 */
export const GoogleLoadingIndicator: React.FC<GoogleLoadingIndicatorProps> = ({
  size = 36,
  strokeWidth = 4,
  multiColor = true,
  color,
  variant = 'circular',
  className = '',
  style,
}) => {
  if (variant === 'dots') {
    const dotSize = Math.max(6, Math.round(size / 4));
    const colors = color
      ? [color, color, color, color]
      : ['#4285F4', '#EA4335', '#FBBC05', '#34A853']; // Google 4-colors

    return (
      <div
        className={`google-dots-loader ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Math.max(4, Math.round(dotSize * 0.6)),
          height: size,
          ...style,
        }}
        role="progressbar"
        aria-label="Loading..."
      >
        {colors.map((c, i) => (
          <span
            key={i}
            className="google-dot"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: c,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
        <style jsx>{`
          .google-dot {
            display: inline-block;
            animation: google-dot-bounce 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          @keyframes google-dot-bounce {
            0%, 80%, 100% {
              transform: scale(0.65);
              opacity: 0.45;
            }
            40% {
              transform: scale(1.18);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  // Canonical Material Design Circular Indeterminate Spinner
  return (
    <div
      className={`google-circular-loader ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        ...style,
      }}
      role="progressbar"
      aria-label="Loading..."
    >
      <svg
        className="google-spinner-svg"
        viewBox="25 25 50 50"
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center center',
          animation: 'google-rotate 2s linear infinite',
        }}
      >
        <circle
          className={multiColor && !color ? 'google-path-multicolor' : 'google-path-single'}
          cx="50"
          cy="50"
          r="20"
          fill="none"
          stroke={color || (multiColor ? undefined : 'currentColor')}
          strokeWidth={strokeWidth}
          strokeMiterlimit="10"
          strokeLinecap="round"
          style={{
            transformOrigin: 'center center',
          }}
        />
      </svg>

      <style jsx>{`
        @keyframes google-rotate {
          100% {
            transform: rotate(360deg);
          }
        }

        .google-path-single {
          stroke-dasharray: 1, 150;
          stroke-dashoffset: 0;
          animation: google-dash 1.5s ease-in-out infinite;
        }

        .google-path-multicolor {
          stroke-dasharray: 1, 150;
          stroke-dashoffset: 0;
          animation:
            google-dash 1.5s ease-in-out infinite,
            google-colors 6s ease-in-out infinite;
        }

        @keyframes google-dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
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
