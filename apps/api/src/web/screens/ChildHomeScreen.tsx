import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { MIcon } from '../components/MIcon';

interface ChildHomeScreenProps {
  onNavigateToMorning: () => void;
  onNavigateToAfternoon: () => void;
  onNavigateToEvening: () => void;
  onNavigateToSwitch: () => void;
}

export const ChildHomeScreen: React.FC<ChildHomeScreenProps> = ({
  onNavigateToMorning,
  onNavigateToAfternoon,
  onNavigateToEvening,
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state } = useRhythm();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const isVi = activeLanguage === 'vi';
  const completedCount =
    (state.morningCompleted ? 1 : 0) +
    (state.afternoonCompleted ? 1 : 0) +
    (state.eveningListened ? 1 : 0);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 780,
        margin: '0 auto',
        padding: '20px 16px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        backgroundColor: colors.background,
        color: colors.textDark,
        transition: 'background-color 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      {/* Top Bar: Family Branding & Quick Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surfaceContainerLow,
          padding: '14px 18px',
          borderRadius: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/icon.png"
            alt="Nhịp Nhà"
            style={{ width: 44, height: 44, borderRadius: 14 }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <AccessibleText variant="h2" weight="900" color={colors.textDark}>
              {family?.name || (isVi ? 'Nhịp Nhà' : 'Home Rhythm')}
            </AccessibleText>
            <div>
              <AccessibleText variant="caption" color={colors.textSecondary}>
                {member?.name} • <code>{family?.code}</code>
              </AccessibleText>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleTheme}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              width: 38,
              height: 38,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            <MIcon name={isDark ? 'dark_mode' : 'wb_sunny'} size={18} color="#F59E0B" />
          </button>

          <button
            onClick={onNavigateToSwitch}
            type="button"
            style={{
              border: 'none',
              backgroundColor: colors.surfaceContainerHigh,
              width: 38,
              height: 38,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Settings"
          >
            <MIcon name="tune" size={18} color={colors.textDark} />
          </button>
        </div>
      </div>

      {/* Hero Rhythm Status Banner */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #371800 0%, #1F1000 100%)'
            : 'linear-gradient(135deg, #FFE8D6 0%, #FFD3B6 100%)',
          borderRadius: 32,
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: `1px solid ${colors.outlineVariant}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              backgroundColor: '#9C4400',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 999,
              letterSpacing: 0.5,
            }}
          >
            {isVi ? '3 NHỊP GẮN KẾT HÔM NAY' : "TODAY'S 3 RHYTHMS"}
          </span>

          <span
            style={{
              backgroundColor:
                completedCount === 3
                  ? isDark
                    ? 'rgba(34, 197, 94, 0.22)'
                    : '#DCFCE7'
                  : colors.surfaceContainerHigh,
              color:
                completedCount === 3
                  ? isDark
                    ? '#86EFAC'
                    : '#15803D'
                  : colors.textDark,
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {completedCount} / 3 {isVi ? 'nhịp hoàn thành' : 'completed'}
          </span>
        </div>

        <AccessibleText variant="hero" weight="900" color={isDark ? '#FFDBCF' : '#3B0900'}>
          {isVi ? `Chào ${member?.name} yêu thương!` : `Hello sweet ${member?.name}!`}
        </AccessibleText>

        <AccessibleText
          variant="bodyLarge"
          weight="600"
          color={isDark ? '#F4CBB8' : '#6A2A10'}
        >
          {completedCount === 0
            ? isVi
              ? 'Bắt đầu ngày mới bằng Chạm Sáng để bố mẹ ở xa an lòng nhé!'
              : 'Start your day with Morning Touch so parents feel reassured!'
            : completedCount === 3
            ? isVi
              ? 'Tuyệt vời! Con đã hoàn thành đủ 3 nhịp gắn kết hôm nay rồi.'
              : 'Wonderful! You completed all 3 bonding rhythms today.'
            : isVi
            ? 'Cố gắng hoàn thành nốt các nhịp còn lại trong ngày nha con.'
            : 'Keep going to complete your daily rhythm!'}
        </AccessibleText>
      </div>

      {/* 3 Rhythms Stacks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Rhythm 1: Morning Touch */}
        <div
          style={{
            backgroundColor: isDark ? colors.morningSurface : '#FFF5E0',
            borderRadius: 28,
            padding: 20,
            border: `2px solid ${state.morningCompleted ? colors.successBorder : (isDark ? colors.morningBorder : '#E59400')}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255, 185, 69, 0.2)' : '#FFDEA8',
                  color: isDark ? '#FFB945' : '#8C4F00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MIcon name="wb_sunny" size={26} color={isDark ? '#FFB945' : '#8C4F00'} />
              </div>
              <div>
                <AccessibleText variant="h2" weight="900" color={isDark ? '#FFDF9E' : '#2C1600'}>
                  ☀️ {isVi ? 'Chạm Sáng (06:30 – 07:15)' : 'Morning Touch'}
                </AccessibleText>
                <div>
                  <AccessibleText variant="caption" color={isDark ? '#D5A850' : '#734600'}>
                    {state.morningCompleted
                      ? isVi
                        ? `Đã gửi lúc ${state.morningTime || 'sáng nay'}`
                        : `Sent at ${state.morningTime || 'this morning'}`
                      : isVi
                      ? 'Tiếng chuông báo thức & gửi lời chào đi học'
                      : 'Morning chime bell & school greeting'}
                  </AccessibleText>
                </div>
              </div>
            </div>

            {state.morningCompleted ? (
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
                  color: isDark ? '#86EFAC' : '#15803D',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MIcon name="check_circle" size={16} color={isDark ? '#86EFAC' : '#15803D'} />
                {isVi ? 'Đã Gửi' : 'Done'}
              </span>
            ) : null}
          </div>

          <BigButton
            variant="morning"
            iconName={state.morningCompleted ? 'replay' : 'touch_app'}
            onClick={onNavigateToMorning}
          >
            {state.morningCompleted
              ? isVi
                ? 'Xem Lại Lời Chúc Buổi Sáng'
                : 'Review Morning Greeting'
              : isVi
              ? 'CHÀO BUỔI SÁNG (1 CHẠM)'
              : 'SEND MORNING GREETING'}
          </BigButton>
        </div>

        {/* Rhythm 2: Afternoon Touch */}
        <div
          style={{
            backgroundColor: isDark ? colors.afternoonSurface : '#FFF0EA',
            borderRadius: 28,
            padding: 20,
            border: `2px solid ${state.afternoonCompleted ? colors.successBorder : (isDark ? colors.afternoonBorder : '#D94D1A')}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255, 181, 155, 0.2)' : '#FFDBCE',
                  color: isDark ? '#FFB59B' : '#9E3306',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MIcon name="palette" size={26} color={isDark ? '#FFB59B' : '#9E3306'} />
              </div>
              <div>
                <AccessibleText variant="h2" weight="900" color={isDark ? '#FFD4C2' : '#370E00'}>
                  🎒 {isVi ? 'Chạm Chiều (17:00 – 18:30)' : 'Afternoon Touch'}
                </AccessibleText>
                <div>
                  <AccessibleText variant="caption" color={isDark ? '#D89278' : '#8A2D08'}>
                    {state.afternoonCompleted
                      ? isVi
                        ? `Đã gửi lúc ${state.afternoonTime || 'chiều nay'}`
                        : `Sent at ${state.afternoonTime || 'this afternoon'}`
                      : isVi
                      ? 'Chọn cảm xúc, thu âm 15s & đính kèm nét vẽ'
                      : '4 emotions, 15s voice note & creative doodle'}
                  </AccessibleText>
                </div>
              </div>
            </div>

            {state.afternoonCompleted ? (
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
                  color: isDark ? '#86EFAC' : '#15803D',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MIcon name="check_circle" size={16} color={isDark ? '#86EFAC' : '#15803D'} />
                {isVi ? 'Đã Gửi' : 'Done'}
              </span>
            ) : null}
          </div>

          <BigButton
            variant="afternoon"
            iconName={state.afternoonCompleted ? 'edit' : 'mic'}
            onClick={onNavigateToAfternoon}
          >
            {state.afternoonCompleted
              ? isVi
                ? 'Xem / Cập Nhật Nhật Ký Chiều'
                : 'Review Afternoon Diary'
              : isVi
              ? 'MỞ NHẬT KÝ CHIỀU 15S'
              : 'OPEN 15S DIARY'}
          </BigButton>
        </div>

        {/* Rhythm 3: Evening Touch */}
        <div
          style={{
            backgroundColor: isDark ? '#181538' : '#F1F0FF',
            borderRadius: 28,
            padding: 20,
            border: `2px solid ${state.eveningListened ? colors.successBorder : '#5B53E6'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(193, 193, 255, 0.2)' : '#E1E0FF',
                  color: isDark ? '#C1C1FF' : '#3D32B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MIcon name="nights_stay" size={26} color={isDark ? '#C1C1FF' : '#3D32B8'} />
              </div>
              <div>
                <AccessibleText variant="h2" weight="900" color={isDark ? '#D8D6FF' : '#110563'}>
                  🌙 {isVi ? 'Chạm Tối (20:30 – 21:00)' : 'Evening Touch'}
                </AccessibleText>
                <div>
                  <AccessibleText variant="caption" color={isDark ? '#9B96EA' : '#453EB5'}>
                    {state.eveningListened
                      ? isVi
                        ? 'Đã nghe lời dặn dò của bố mẹ'
                        : 'Listened to bedtime guidance'
                      : isVi
                      ? 'Hộp thư thoại chúc ngủ ngon từ bố mẹ'
                      : 'Bedtime voice message from parents'}
                  </AccessibleText>
                </div>
              </div>
            </div>

            {state.eveningListened ? (
              <span
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7',
                  color: isDark ? '#86EFAC' : '#15803D',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MIcon name="headset" size={16} color={isDark ? '#86EFAC' : '#15803D'} />
                {isVi ? 'Đã Nghe' : 'Listened'}
              </span>
            ) : null}
          </div>

          <BigButton
            variant="evening"
            iconName="volume_up"
            onClick={onNavigateToEvening}
          >
            {isVi ? 'NGHE LỜI DẶN DÒ TỐI NAY' : 'LISTEN TO BEDTIME VOICE'}
          </BigButton>
        </div>
      </div>
    </div>
  );
};
