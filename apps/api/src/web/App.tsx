'use client';

import React, { useState } from 'react';
import type { Role } from '@nhipnha/shared';
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
  const { isPaired, isLoading, member, family, isDemoAccount, switchRole } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, toggleTheme, textScale } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [switchingDemoRole, setSwitchingDemoRole] = useState<{ role: Role; name: string } | null>(null);

  const handleDemoQuickSwitch = async (targetRole: Role, targetName: string) => {
    if (member?.role === targetRole || switchingDemoRole !== null) return;
    setSwitchingDemoRole({ role: targetRole, name: targetName });
    try {
      await new Promise((r) => setTimeout(r, 400));
      await switchRole(targetRole, targetName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSwitchingDemoRole(null);
    }
  };

  const navigateTo = (target: ScreenName | null) => {
    if (target === currentScreen) return;
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen(target);
      setIsNavigating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 140);
  };

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
      return <MorningTouchScreen onBack={() => navigateTo(null)} />;
    }

    if (currentScreen === 'AFTERNOON_TOUCH') {
      return <AfternoonTouchScreen onBack={() => navigateTo(null)} />;
    }

    if (currentScreen === 'EVENING_TOUCH') {
      return <EveningTouchScreen onBack={() => navigateTo(null)} />;
    }

    if (currentScreen === 'OWNER_CONSOLE') {
      return <OwnerManagementScreen onBack={() => navigateTo('ROLE_SWITCH')} />;
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
          onNavigateToSwitch={() => navigateTo('ROLE_SWITCH')}
          onNavigateToMorning={() => navigateTo('MORNING_TOUCH')}
          onNavigateToAfternoon={() => navigateTo('AFTERNOON_TOUCH')}
          onNavigateToEvening={() => navigateTo('EVENING_TOUCH')}
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
              onClick={() => navigateTo(null)}
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
              <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'inherit', fontSynthesis: 'none' }}>
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
              onClick={() => navigateTo('ROLE_SWITCH')}
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
              <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'inherit', fontSynthesis: 'none' }}>
                {isVi ? 'Cài Đặt & Vai Trò' : 'Settings & Role'}
              </span>
            </button>

            {member?.isOwner && (
              <button
                onClick={() => navigateTo('OWNER_CONSOLE')}
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
                <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'inherit', fontSynthesis: 'none' }}>
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
        <main
          className="app-main-content"
          style={{
            backgroundColor: colors.background,
            transition: 'background-color 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {/* Interactive Demo Perspective Switcher Bar (Judge & Presentation Ready) */}
          {isDemoAccount && (
            <div
              style={{
                width: '100%',
                maxWidth: 780,
                margin: '12px auto 0',
                padding: '0 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(42, 27, 8, 0.45)' : '#FFF6EA',
                  border: `1.5px solid ${isDark ? '#B06A00' : '#FFDEA8'}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MIcon name="badge" size={18} color="#E59400" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: isDark ? '#FFDF9E' : '#8C4F00',
                    }}
                  >
                    {isVi ? 'Chế độ Demo (3 Góc Nhìn):' : 'Demo Mode (3 Personas):'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { role: 'CHILD' as Role, name: 'Bé An', icon: 'child_care', color: '#F59E0B' },
                    { role: 'PARENT' as Role, name: 'Mẹ Hoa', icon: 'supervisor_account', color: '#DF5018' },
                    { role: 'GRANDPARENT' as Role, name: 'Bà Nội', icon: 'elderly', color: '#4C43D6' },
                  ].map((p) => {
                    const isActive = member?.role === p.role;
                    return (
                      <button
                        key={p.role}
                        type="button"
                        disabled={switchingDemoRole !== null}
                        onClick={() => handleDemoQuickSwitch(p.role, p.name)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          border: isActive ? `2px solid ${p.color}` : `1px solid ${colors.outlineVariant}`,
                          backgroundColor: isActive
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.16)'
                              : '#FFFFFF'
                            : colors.surfaceContainer,
                          cursor: isActive ? 'default' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 800,
                          fontSize: 12,
                          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                          transform: isActive ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                        }}
                      >
                        {switchingDemoRole?.role === p.role ? (
                          <GoogleLoadingIndicator size={14} strokeWidth={2.5} multiColor={true} />
                        ) : (
                          <MIcon name={p.icon} size={16} color={p.color} />
                        )}
                        <span style={{ color: isActive ? colors.textDark : colors.textSecondary }}>{p.name}</span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 6px',
                              borderRadius: 999,
                              backgroundColor: p.color,
                              color: '#FFFFFF',
                              fontWeight: 900,
                            }}
                          >
                            {isVi ? 'Đang xem' : 'Active'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
            onClick={() => navigateTo(null)}
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
            onClick={() => navigateTo('ROLE_SWITCH')}
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

      {/* Demo Quick Role Switching Loading Overlay */}
      {switchingDemoRole && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: isDark ? 'rgba(21, 16, 12, 0.82)' : 'rgba(252, 246, 238, 0.86)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            animation: 'm3ScreenFadeIn 0.22s ease-out forwards',
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 32,
              backgroundColor: colors.surfaceContainer,
              border: `1.5px solid ${colors.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: isDark
                ? '0 16px 48px rgba(0, 0, 0, 0.55)'
                : '0 16px 40px rgba(0, 0, 0, 0.12)',
              maxWidth: 320,
              width: '90%',
              textAlign: 'center',
            }}
          >
            <GoogleLoadingIndicator size={52} strokeWidth={4} multiColor={true} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: colors.textDark, marginBottom: 4 }}>
                {isVi
                  ? `Đang chuyển sang góc nhìn ${switchingDemoRole.name}...`
                  : `Switching to ${switchingDemoRole.name}...`}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
                {isVi ? 'Tùy biến giao diện và nhịp kết nối phù hợp' : 'Adapting UI & daily connection rhythms'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Responsive, Google Sans Flex & Material 3 CSS */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
          font-family: 'Google Sans', 'Google Sans Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-synthesis: none;
        }

        button, input, select, textarea, span, p, a, label {
          font-family: inherit;
          font-synthesis: none;
        }

        /* Top Material 3 Navigation Progress Bar */
        .m3-nav-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 0, 0, 0.08);
          overflow: hidden;
          z-index: 99999;
        }

        .m3-nav-loader-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853);
          animation: m3TopLoader 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes m3TopLoader {
          0% { left: -30%; width: 30%; }
          50% { left: 25%; width: 50%; }
          100% { left: 100%; width: 30%; }
        }

        .m3-screen-fade {
          animation: m3ScreenFadeIn 0.24s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }

        @keyframes m3ScreenFadeIn {
          from {
            opacity: 0.15;
            transform: translateY(10px) scale(0.995);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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
