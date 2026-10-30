import React from 'react';
import type { EmpathyAssistantResponse } from '@nhipnha/shared';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MIcon } from './MIcon';
import { AccessibleText } from './AccessibleText';

interface EmpathyPromptCardProps {
  data: EmpathyAssistantResponse;
  selectedPrompt?: string;
  onSelectPrompt: (prompt: string) => void;
}

export const EmpathyPromptCard: React.FC<EmpathyPromptCardProps> = ({
  data,
  selectedPrompt,
  onSelectPrompt,
}) => {
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const isVi = activeLanguage === 'vi';

  return (
    <div
      style={{
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: 28,
        padding: 20,
        border: `1px solid ${colors.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(255, 181, 156, 0.2)' : '#FFDCC6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MIcon name="psychology" size={22} color={isDark ? '#FFB59C' : '#9C4400'} />
          </div>
          <div>
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {isVi ? 'Trợ Lý Thấu Cảm AI' : 'AI Empathy Assistant'}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {isVi ? 'Gợi ý câu hỏi mở • Tránh hỏi điểm số' : 'Open prompts • Non-evaluative'}
            </AccessibleText>
          </div>
        </div>

        <span
          style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
            color: isDark ? '#86EFAC' : '#15803D',
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <MIcon name="auto_awesome" size={13} color="#15803D" />
          Level 2 AI
        </span>
      </div>

      {/* Psychological Summary */}
      <div
        style={{
          backgroundColor: colors.surfaceContainer,
          padding: '12px 14px',
          borderRadius: 18,
          borderLeft: `4px solid ${colors.primary}`,
        }}
      >
        <AccessibleText variant="bodyRegular" weight="700" color={colors.textDark}>
          {data.summary}
        </AccessibleText>

        {data.cvInsight ? (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <MIcon name="palette" size={16} color={colors.accent} style={{ marginTop: 2 }} />
            <AccessibleText variant="caption" color={colors.textSecondary} weight="600">
              {data.cvInsight}
            </AccessibleText>
          </div>
        ) : null}
      </div>

      {/* Suggested Prompts List */}
      <div>
        <AccessibleText
          variant="label"
          weight="800"
          color={colors.textSecondary}
          style={{ marginBottom: 8, display: 'block' }}
        >
          {isVi
            ? 'Chạm chọn 1 câu để đọc gửi cho con:'
            : 'Tap one prompt to record for your child:'}
        </AccessibleText>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.suggestedPrompts.map((prompt, idx) => {
            const isSelected = selectedPrompt === prompt;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 18,
                  backgroundColor: isSelected
                    ? isDark
                      ? '#4E2D00'
                      : '#FFDCC6'
                    : colors.surfaceContainerHighest,
                  border: isSelected
                    ? `2px solid ${colors.primary}`
                    : `1px solid transparent`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <MIcon
                  name={isSelected ? 'check_circle' : 'chat_bubble_outline'}
                  size={18}
                  color={isSelected ? colors.primary : colors.textSecondary}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <AccessibleText
                  variant="bodyRegular"
                  weight={isSelected ? '800' : '600'}
                  color={isSelected ? colors.onPrimaryContainer : colors.textDark}
                >
                  “{prompt}”
                </AccessibleText>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
