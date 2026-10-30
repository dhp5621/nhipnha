import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { AccessibleText } from './AccessibleText';

interface SecurityQRCardProps {
  title: string;
  subtitle?: string;
  codeText: string;
  qrPayload?: string;
  badgeLabel?: string;
}

export const SecurityQRCard: React.FC<SecurityQRCardProps> = ({
  title,
  subtitle,
  codeText,
  qrPayload,
  badgeLabel,
}) => {
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const isVi = activeLanguage === 'vi';
  const qrData = encodeURIComponent(qrPayload || codeText);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}&color=1E1510&bgcolor=FFFFFF`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: 28,
        padding: 22,
        border: `1px solid ${colors.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      {badgeLabel ? (
        <span
          style={{
            backgroundColor: '#FFDCC6',
            color: '#331200',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {badgeLabel}
        </span>
      ) : null}

      <div>
        <AccessibleText variant="h2" weight="900" color={colors.textDark}>
          {title}
        </AccessibleText>
        {subtitle ? (
          <AccessibleText
            variant="caption"
            color={colors.textSecondary}
            style={{ display: 'block', marginTop: 3 }}
          >
            {subtitle}
          </AccessibleText>
        ) : null}
      </div>

      {/* QR Code Container */}
      <div
        style={{
          padding: 12,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <img
          src={qrImageUrl}
          alt="QR Code"
          style={{
            width: 190,
            height: 190,
            display: 'block',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Code Badge & Copy Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surfaceContainerHighest,
          padding: '8px 16px',
          borderRadius: 999,
        }}
      >
        <code
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2,
            color: colors.primary,
          }}
        >
          {codeText}
        </code>

        <button
          onClick={handleCopy}
          type="button"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            padding: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: copied ? colors.secondary : colors.textSecondary,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          <MIcon
            name={copied ? 'done' : 'content_copy'}
            size={18}
            color={copied ? colors.secondary : colors.textSecondary}
          />
          <span>{copied ? (isVi ? 'Đã chép' : 'Copied') : isVi ? 'Chép' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
