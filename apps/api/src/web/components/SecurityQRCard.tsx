import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { AccessibleText } from './AccessibleText';

interface SecurityQRCardProps {
  title: string;
  subtitle?: string;
  codeText?: string;
  qrPayload?: string;
  badgeLabel?: string;
  isLoginSecret?: boolean;
}

export const SecurityQRCard: React.FC<SecurityQRCardProps> = ({
  title,
  subtitle,
  codeText,
  qrPayload,
  badgeLabel,
  isLoginSecret = true,
}) => {
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const isVi = activeLanguage === 'vi';
  const rawPayload = (qrPayload || codeText || '').trim();
  const qrData = encodeURIComponent(rawPayload);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}&color=1E1510&bgcolor=FFFFFF`;

  // Detect if the code/payload is a JSON object or long cryptographic credential token
  let isJson = false;
  let parsedPayload: Record<string, any> | null = null;
  if (rawPayload.startsWith('{') && rawPayload.endsWith('}')) {
    try {
      parsedPayload = JSON.parse(rawPayload);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  const isLongToken = isJson || rawPayload.length > 20;
  const memberId = parsedPayload?.memberId ? String(parsedPayload.memberId) : null;
  const displayCode = codeText && !codeText.trim().startsWith('{') ? codeText.trim() : (memberId || rawPayload);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(rawPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: 28,
        padding: '20px 16px',
        border: `1px solid ${colors.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: 420,
        boxSizing: 'border-box',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {badgeLabel ? (
        <span
          style={{
            backgroundColor: isDark ? 'rgba(255, 181, 156, 0.2)' : '#FFDCC6',
            color: isDark ? '#FFB59C' : '#331200',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {badgeLabel}
        </span>
      ) : null}

      <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
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

      {/* Token Display & Copy Actions */}
      {isLongToken ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Compact Monospace Token Preview Box */}
          <div
            style={{
              width: '100%',
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : colors.surfaceContainerHighest,
              border: `1px solid ${colors.outlineVariant}`,
              borderRadius: 16,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxSizing: 'border-box',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: colors.textSecondary, letterSpacing: 0.5 }}>
                {isVi ? 'TOKEN ĐĂNG NHẬP (BẢO MẬT)' : 'LOGIN CREDENTIAL TOKEN'}
              </span>
              {memberId ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: colors.primary,
                    fontFamily: 'monospace',
                    backgroundColor: isDark ? 'rgba(255, 181, 156, 0.15)' : '#FFECE2',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {memberId}
                </span>
              ) : null}
            </div>

            <div
              title={rawPayload}
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: colors.textDark,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                padding: '6px 10px',
                borderRadius: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                direction: 'ltr',
              }}
            >
              {rawPayload}
            </div>
          </div>

          {/* Dedicated Full-Width Copy Button */}
          <button
            onClick={handleCopy}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: copied ? (isDark ? '#064E3B' : '#DCFCE7') : colors.primary,
              color: copied ? (isDark ? '#6EE7B7' : '#15803D') : colors.onPrimary,
              border: copied ? `1px solid ${isDark ? '#059669' : '#86EFAC'}` : 'none',
              padding: '12px 16px',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
            }}
          >
            <MIcon
              name={copied ? 'done' : 'content_copy'}
              size={18}
              color={copied ? (isDark ? '#6EE7B7' : '#15803D') : colors.onPrimary}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {copied
                ? (isVi ? 'Đã sao chép Token vào bộ nhớ tạm!' : 'Token copied to clipboard!')
                : (isVi ? 'Sao chép Token Đăng Nhập' : 'Copy Login Token')}
            </span>
          </button>
        </div>
      ) : (
        /* Short Code Badge (e.g. FAM-8823) */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: colors.surfaceContainerHighest,
            padding: '8px 16px',
            borderRadius: 999,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <code
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 2,
              color: colors.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
            }}
          >
            {displayCode}
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
              flexShrink: 0,
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
      )}
    </div>
  );
};
