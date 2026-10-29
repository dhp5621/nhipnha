import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import { AccessibleText } from './src/components/AccessibleText';

type ScreenName =
  | 'QR_LOGIN'
  | 'CHILD_HOME'
  | 'MORNING_TOUCH'
  | 'AFTERNOON_TOUCH'
  | 'EVENING_TOUCH'
  | 'PARENT_DASHBOARD'
  | 'ROLE_SWITCH';

function NavigationRoot() {
  const { isPaired, isLoading, member } = useAuth();
  const { activeLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);
  const [showFamilyCode, setShowFamilyCode] = useState(false);

  const isVi = activeLanguage === 'vi';

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
            onBackToLogin={() => setShowFamilyCode(false)}
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

    if (currentScreen === 'ROLE_SWITCH') {
      return (
        <RoleSwitchScreen
          onBack={() => setCurrentScreen(null)}
          onGoToLogin={() => setCurrentScreen('QR_LOGIN')}
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

  const isHomeTab = currentScreen !== 'ROLE_SWITCH';

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <View style={styles.screenArea}>{renderMainContent()}</View>

      {/* Material 3 Expressive Production Floating Navigation Bar */}
      <View
        style={[
          styles.dockWrapper,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.dockBar,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCurrentScreen(null)}
            style={[
              styles.dockItem,
              {
                backgroundColor: isHomeTab ? colors.primaryContainer : 'transparent',
                borderRadius: isHomeTab ? 999 : 20,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isHomeTab }}
          >
            <MaterialIcons
              name={member?.role === 'PARENT' ? 'insights' : 'home-filled'}
              size={22}
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
                borderRadius: !isHomeTab ? 999 : 20,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: !isHomeTab }}
          >
            <MaterialIcons
              name="tune"
              size={22}
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 6,
  },
  dockBar: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 5,
    justifyContent: 'space-between',
    gap: 6,
  },
  dockItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  dockIcon: {
    marginRight: 8,
  },
});
