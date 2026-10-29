import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RhythmProvider } from './src/context/RhythmContext';
import { QRLoginScreen } from './src/screens/QRLoginScreen';
import { ChildHomeScreen } from './src/screens/ChildHomeScreen';
import { MorningTouchScreen } from './src/screens/MorningTouchScreen';
import { AfternoonTouchScreen } from './src/screens/AfternoonTouchScreen';
import { EveningTouchScreen } from './src/screens/EveningTouchScreen';
import { ParentDashboardScreen } from './src/screens/ParentDashboardScreen';
import { RoleSwitchScreen } from './src/screens/RoleSwitchScreen';
import { THEME } from './src/constants/theme';

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
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.morningBorder} />
      </View>
    );
  }

  // Not paired -> Show Zero-type QR login
  if (!isPaired) {
    return <QRLoginScreen onSuccess={() => setCurrentScreen(null)} />;
  }

  // Active navigation state
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

  // If member is PARENT, default to ParentDashboardScreen
  if (member?.role === 'PARENT') {
    return (
      <ParentDashboardScreen
        onNavigateToSwitch={() => setCurrentScreen('ROLE_SWITCH')}
      />
    );
  }

  // Default to ChildHomeScreen for CHILD and GRANDPARENT
  return (
    <ChildHomeScreen
      onNavigateToMorning={() => setCurrentScreen('MORNING_TOUCH')}
      onNavigateToAfternoon={() => setCurrentScreen('AFTERNOON_TOUCH')}
      onNavigateToEvening={() => setCurrentScreen('EVENING_TOUCH')}
      onNavigateToSwitch={() => setCurrentScreen('ROLE_SWITCH')}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RhythmProvider>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" backgroundColor={THEME.colors.background} />
            <NavigationRoot />
          </SafeAreaView>
        </RhythmProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
});
