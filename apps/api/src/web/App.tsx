'use client';

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RhythmProvider } from './context/RhythmContext';
import { LoginScreen } from './screens/LoginScreen';
import { QRLoginScreen } from './screens/QRLoginScreen';
import { ChildHomeScreen } from './screens/ChildHomeScreen';
import { MorningTouchScreen } from './screens/MorningTouchScreen';
import { AfternoonTouchScreen } from './screens/AfternoonTouchScreen';
import { EveningTouchScreen } from './screens/EveningTouchScreen';
import { ParentDashboardScreen } from './screens/ParentDashboardScreen';
import { RoleSwitchScreen } from './screens/RoleSwitchScreen';
import { OwnerManagementScreen } from './screens/OwnerManagementScreen';
import { AccessibleText } from './components/AccessibleText';
import { MIcon } from './components/MIcon';
import { GoogleLoadingIndicator } from './components/GoogleLoadingIndicator';

type ScreenName =
  | 'QR_LOGIN'
  | 'CHILD_HOME'
  | 'MORNING_TOUCH'
  | 'AFTERNOON_TOUCH'
  | 'EVENING_TOUCH'
  | 'PARENT_DASHBOARD'
  | 'ROLE_SWITCH'
  | 'OWNER_CONSOLE';

function NavigationRoot() {
  const { isPaired, isLoading, member, family } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, toggleTheme, textScale } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);
  const [showFamilyCode, setShowFamilyCode] = useState(false);

  const isVi = activeLanguage === 'vi';

  // Responsive dock bar sizing based on accessibility text size preference
  const isLargeText = textScale === 'large' || (textScale === 'role_default' && member?.role === 'GRANDPARENT');
  const isExtraLargeText = textScale === 'extra_large';
  const navIconSize = isExtraLargeText ? 28 : isLargeText ? 25 : 22;
  const navMinHeight = isExtraLargeText ? 62 : isLargeText ? 54 : 46;
  const navPadding = isExtraLargeText ? '12px 18px' : isLargeText ? '10px 16px' : '8px 14px';

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.background,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <GoogleLoadingIndicator size={52} strokeWidth={4} multiColor={true} />
        <AccessibleText variant="bodyLarge" weight="800" color={colors.textDark}>
          {isVi ? 'Đang tải Nhịp Nhà...' : 'Loading Home Rhythm...'}
        </AccessibleText>
      </div>
    );
  }

  // Not paired -> Show Login / Register or QR Pairing screen
  if (!isPaired || currentScreen === 'QR_LOGIN') {
    const showPairing = showFamilyCode || currentScreen === 'QR_LOGIN';
    return showPairing ? (
      <QRLoginScreen
        onSuccess={() => {
          setShowFamilyCode(false);
          setCurrentScreen(null);
        }}
        onBackToLogin={() => {
          setShowFamilyCode(false);
          setCurrentScreen(null);
        }}
      />
    ) : (
      <LoginScreen onJoinWithCode={() => setShowFamilyCode(true)} />
    );
  }

  const renderMainContent = () => {
    if (currentScreen === 'MORNING_TOUCH') {
      return <MorningTouchScreen onBack={() => setCurrentScreen(null)} />;
    }

    if (currentScreen === 'AFTERNOON_TOUCH') {
      return <AfternoonTouchScreen onBack={() => setCurrentScreen(null)} />;
    }

    if (currentScreen === 'EVENING_TOUCH') {
      return <EveningTouchScreen onBack={() => setCurrentScreen(null)} />;
    }

    if (currentScreen === 'OWNER_CONSOLE') {
      return <OwnerManagementScreen onBack={() => setCurrentScreen('ROLE_SWITCH')} />;
    }

    if (currentScreen === 'ROLE_SWITCH') {
      return (
        <RoleSwitchScreen
          onBack={() => setCurrentScreen(null)}
          onGoToLogin={() => {
            setShowFamilyCode(false);
            setCurrentScreen(null);
          }}
          onOpenOwnerConsole={() => setCurrentScreen('OWNER_CONSOLE')}
        />
      );
    }

    if (member?.role === 'PARENT') {
      return (
        <ParentDashboardScreen
          onNavigateToSwitch={() => setCurrentScreen('ROLE_SWITCH')}
        />
      );
    }

    return (
      <ChildHomeScreen
        onNavigateToMorning={() => setCurrentScreen('MORNING_TOUCH')}
        onNavigateToAfternoon={() => setCurrentScreen('AFTERNOON_TOUCH')}
        onNavigateToEvening={() => setCurrentScreen('EVENING_TOUCH')}
        onNavigateToSwitch={() => setCurrentScreen('ROLE_SWITCH')}
      />
    );
  };

  const isHomeTab = currentScreen !== 'ROLE_SWITCH' && currentScreen !== 'OWNER_CONSOLE';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.textDark,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* PC / Desktop Navigation Layout wrapper */}
      <div className="app-layout-container">
        {/* Desktop Sidebar / Navigation Rail (visible on PC >= 768px) */}
        <aside
          className="desktop-nav-rail"
          style={{
            backgroundColor: colors.surfaceContainerLow,
            borderRight: `1px solid ${colors.outlineVariant}`,
          }}
        >
          {/* Rail Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px 18px' }}>
            <img
              src="/icon.png"
              alt="Nhịp Nhà"
              style={{ width: 42, height: 42, borderRadius: 14 }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: colors.primary, display: 'block' }}>
                Nhịp Nhà
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>
                RBPC 2026 • SDG 3, 4, 8
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <button
              onClick={() => setCurrentScreen(null)}
              type="button"
              className="desktop-nav-item"
              style={{
                backgroundColor: isHomeTab ? colors.primaryContainer : 'transparent',
                color: isHomeTab ? colors.onPrimaryContainer : colors.textDark,
              }}
            >
              <MIcon
                name={member?.role === 'PARENT' ? 'insights' : 'home'}
                size={22}
                color={isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
              />
              <span style={{ fontWeight: 800, fontSize: 14 }}>
                {member?.role === 'PARENT'
                  ? isVi
                    ? 'Nhịp Gia Đình'
                    : 'Family Rhythm'
                  : isVi
                  ? 'Trang Chính'
                  : 'Home'}
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('ROLE_SWITCH')}
              type="button"
              className="desktop-nav-item"
              style={{
                backgroundColor: !isHomeTab && currentScreen !== 'OWNER_CONSOLE' ? colors.primaryContainer : 'transparent',
                color: !isHomeTab && currentScreen !== 'OWNER_CONSOLE' ? colors.onPrimaryContainer : colors.textDark,
              }}
            >
              <MIcon
                name="tune"
                size={22}
                color={!isHomeTab && currentScreen !== 'OWNER_CONSOLE' ? colors.onPrimaryContainer : colors.textSecondary}
              />
              <span style={{ fontWeight: 800, fontSize: 14 }}>
                {isVi ? 'Cài Đặt & Vai Trò' : 'Settings & Role'}
              </span>
            </button>

            {member?.isOwner && (
              <button
                onClick={() => setCurrentScreen('OWNER_CONSOLE')}
                type="button"
                className="desktop-nav-item"
                style={{
                  backgroundColor: currentScreen === 'OWNER_CONSOLE' ? colors.primaryContainer : 'transparent',
                  color: currentScreen === 'OWNER_CONSOLE' ? colors.onPrimaryContainer : colors.textDark,
                }}
              >
                <MIcon
                  name="admin_panel_settings"
                  size={22}
                  color={currentScreen === 'OWNER_CONSOLE' ? colors.onPrimaryContainer : colors.textSecondary}
                />
                <span style={{ fontWeight: 800, fontSize: 14 }}>
                  {isVi ? 'Quản Trị Chủ Nhà' : 'Owner Console'}
                </span>
              </button>
            )}
          </div>

          {/* Desktop User Profile Card at bottom of rail */}
          <div
            style={{
              padding: 14,
              borderRadius: 20,
              backgroundColor: colors.surfaceContainer,
              border: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: colors.primary,
                color: colors.onPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {member?.name?.charAt(0) || 'N'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: colors.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member?.name}
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 700 }}>
                <code>{family?.code}</code> • {member?.role}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="app-main-content">
          {renderMainContent()}
        </main>
      </div>

      {/* Floating Material 3 Mobile Navigation Dock Bar (visible on Mobile < 768px) */}
      <nav
        className="mobile-dock-wrapper"
        style={{
          background: 'transparent',
          pointerEvents: 'none',
        }}
      >
        <div
          className="mobile-dock-bar"
          style={{
            pointerEvents: 'auto',
            backgroundColor: isDark ? 'rgba(30, 24, 18, 0.76)' : 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.45)'
              : '0 12px 36px rgba(0, 0, 0, 0.14)',
          }}
        >
          <button
            onClick={() => setCurrentScreen(null)}
            type="button"
            className="mobile-dock-item"
            style={{
              backgroundColor: isHomeTab ? colors.primaryContainer : 'transparent',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              minHeight: navMinHeight,
              padding: navPadding,
            }}
          >
            <MIcon
              name={member?.role === 'PARENT' ? 'insights' : 'home'}
              size={navIconSize}
              color={isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            />
            <AccessibleText
              variant="label"
              weight="800"
              color={isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {member?.role === 'PARENT'
                ? isVi
                  ? 'Nhịp Gia Đình'
                  : 'Family Rhythm'
                : isVi
                ? 'Trang Chính'
                : 'Home'}
            </AccessibleText>
          </button>

          <button
            onClick={() => setCurrentScreen('ROLE_SWITCH')}
            type="button"
            className="mobile-dock-item"
            style={{
              backgroundColor: !isHomeTab ? colors.primaryContainer : 'transparent',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              minHeight: navMinHeight,
              padding: navPadding,
            }}
          >
            <MIcon
              name="tune"
              size={navIconSize}
              color={!isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            />
            <AccessibleText
              variant="label"
              weight="800"
              color={!isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {isVi ? 'Cài Đặt' : 'Settings'}
            </AccessibleText>
          </button>
        </div>
      </nav>

      {/* Global Responsive, Google Sans Flex & Material 3 CSS */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
          font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Smooth page and card entrance animations */
        .app-main-content > * {
          animation: m3-fade-slide-up 0.28s cubic-bezier(0.2, 0, 0, 1) backwards;
        }

        @keyframes m3-fade-slide-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }

        /* Interactive tactile feedback */
        .big-button {
          transition: transform 0.16s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.16s ease, filter 0.16s ease !important;
        }

        .big-button:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        .big-button:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }

        /* Responsive Layout Grid */
        .app-layout-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .desktop-nav-rail {
          display: none;
          width: 260px;
          flex-shrink: 0;
          padding: 24px 16px;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .desktop-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: all 0.16s ease;
          text-align: left;
          width: 100%;
        }

        .desktop-nav-item:hover {
          filter: brightness(0.96);
        }

        .app-main-content {
          flex: 1;
          min-width: 0;
          padding-bottom: 110px;
        }

        .mobile-dock-wrapper {
          display: block;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 18px 16px;
          background: transparent !important;
          pointer-events: none;
          z-index: 100;
        }

        .mobile-dock-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px;
          border-radius: 999px;
          max-width: 480px;
          margin: 0 auto;
          pointer-events: auto;
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        .mobile-dock-item {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.16s ease;
        }

        /* Desktop Breakpoint: >= 768px */
        @media (min-width: 768px) {
          .desktop-nav-rail {
            display: flex;
          }

          .mobile-dock-wrapper {
            display: none;
          }

          .app-main-content {
            padding-bottom: 40px;
          }
        }
      `}</style>
    </div>
  );
}

export default function WebApp() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <RhythmProvider>
            <NavigationRoot />
          </RhythmProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
