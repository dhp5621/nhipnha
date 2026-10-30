import React from 'react';

interface MIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MIcon: React.FC<MIconProps> = ({
  name,
  size = 24,
  color,
  style,
  className = '',
}) => {
  // Normalize icon names:
  // 1. Convert kebab-case (e.g. 'arrow-back', 'dark-mode', 'qr-code', 'check-circle') to snake_case
  // 2. Map aliases ('pin' -> 'tag', 'home-filled' -> 'home')
  const normalizedName = (() => {
    const s = (name || '').trim().replace(/-/g, '_');
    if (s === 'pin') return 'tag';
    if (s === 'home_filled') return 'home';
    return s;
  })();

  return (
    <span
      className={`material-symbols-rounded material-symbols-outlined material-icons ${className}`}
      style={{
        fontFamily:
          "'Material Symbols Rounded', 'Material Symbols Outlined', 'Material Icons', sans-serif",
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontSize: size,
        color,
        width: size,
        height: size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
        direction: 'ltr',
        letterSpacing: 'normal',
        textTransform: 'none',
        fontFeatureSettings: "'liga'",
        WebkitFontFeatureSettings: "'liga'",
        WebkitFontSmoothing: 'antialiased',
        ...style,
      }}
      aria-hidden="true"
    >
      {normalizedName}
    </span>
  );
};
