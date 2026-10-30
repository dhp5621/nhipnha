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
  return (
    <span
      className={`material-icons ${className}`}
      style={{
        fontSize: size,
        color,
        width: size,
        height: size,
        lineHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  );
};
