import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RhythmProvider } from './src/context/RhythmContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { QRLoginScreen } from './src/screens/QRLoginScreen';
import { ChildHomeScreen } from './src/screens/ChildHomeScreen';
import { MorningTouchScreen } from './src/screens/MorningTouchScreen';
import { AfternoonTouchScreen } from './src/screens/AfternoonTouchScreen';
import { EveningTouchScreen } from './src/screens/EveningTouchScreen';
import { ParentDashboardScreen } from './src/screens/ParentDashboardScreen';
import { RoleSwitchScreen } from './src/screens/RoleSwitchScreen';
import { OwnerManagementScreen } from './src/screens/OwnerManagementScreen';
import { AccessibleText } from './src/components/AccessibleText';

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
  const { isPaired, isLoading, member } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark, textScale } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);
  const [showFamilyCode, setShowFamilyCode] = useState(false);

  const isVi = activeLanguage === 'vi';

  // Responsive floating navbar dimensions based on accessibility text size preference
  const isLargeText = textScale === 'large' || (textScale === 'role_default' && member?.role === 'GRANDPARENT');
  const isExtraLargeText = textScale === 'extra_large';
  const navIconSize = isExtraLargeText ? 28 : isLargeText ? 25 : 22;
  const navMinHeight = isExtraLargeText ? 62 : isLargeText ? 54 : 46;
  const navPaddingVert = isExtraLargeText ? 13 : isLargeText ? 10 : 7;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not paired -> account login page first, with family code / QR pairing one tap away
  if (!isPaired || currentScreen === 'QR_LOGIN') {
    const showPairing = showFamilyCode || currentScreen === 'QR_LOGIN';
    return (
      <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
        {showPairing ? (
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
        )}
      </View>
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
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <View style={styles.screenArea}>{renderMainContent()}</View>

      {/* Material 3 Expressive Production Floating Navigation Bar */}
      <View
        pointerEvents="box-none"
        style={styles.dockWrapper}
      >
        <View
          style={[
            styles.dockBar,
            {
              backgroundColor: isDark ? 'rgba(30, 24, 18, 0.82)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              borderWidth: 1,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCurrentScreen(null)}
            style={[
              styles.dockItem,
              {
                backgroundColor: isHomeTab ? colors.primaryContainer : 'transparent',
                borderRadius: 999,
                minHeight: navMinHeight,
                paddingVertical: navPaddingVert,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isHomeTab }}
          >
            <MaterialIcons
              name={member?.role === 'PARENT' ? 'insights' : 'home'}
              size={navIconSize}
              color={isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
              style={styles.dockIcon}
            />
            <AccessibleText
              variant="label"
              weight="800"
              color={isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {member?.role === 'PARENT'
                ? isVi
                  ? 'Nhịp gia đình'
                  : 'Family Rhythm'
                : isVi
                ? 'Trang chính'
                : 'Home'}
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('ROLE_SWITCH')}
            style={[
              styles.dockItem,
              {
                backgroundColor: !isHomeTab ? colors.primaryContainer : 'transparent',
                borderRadius: 999,
                minHeight: navMinHeight,
                paddingVertical: navPaddingVert,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: !isHomeTab }}
          >
            <MaterialIcons
              name="tune"
              size={navIconSize}
              color={!isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
              style={styles.dockIcon}
            />
            <AccessibleText
              variant="label"
              weight="800"
              color={!isHomeTab ? colors.onPrimaryContainer : colors.textSecondary}
            >
              {isVi ? 'Cài đặt' : 'Settings'}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ThemedSafeArea({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {children}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <RhythmProvider>
              <ThemedSafeArea>
                <NavigationRoot />
              </ThemedSafeArea>
            </RhythmProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
  },
  screenArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  dockBar: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 6,
    justifyContent: 'space-between',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  dockItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dockIcon: {
    marginRight: 8,
  },
});
