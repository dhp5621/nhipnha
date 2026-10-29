import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';

import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
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
import type { Role } from '@nhipnha/shared';

type ScreenName =
  | 'QR_LOGIN'
  | 'CHILD_HOME'
  | 'MORNING_TOUCH'
  | 'AFTERNOON_TOUCH'
  | 'EVENING_TOUCH'
  | 'PARENT_DASHBOARD'
  | 'ROLE_SWITCH';

function NavigationRoot() {
  const { isPaired, isLoading, member, switchRole } = useAuth();
  const { activeLanguage } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<ScreenName | null>(null);

  const isVi = activeLanguage === 'vi';

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.morningBorder} />
      </View>
    );
  }

  // Not paired -> Show Zero-type QR login
  if (!isPaired || currentScreen === 'QR_LOGIN') {
    return <QRLoginScreen onSuccess={() => setCurrentScreen(null)} />;
  }

  const handleQuickRoleSelect = (role: Role, name: string) => {
    switchRole(role, name);
    setCurrentScreen(null);
  };

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

  return (
    <View style={styles.rootContainer}>
      <View style={styles.screenArea}>{renderMainContent()}</View>

      {/* M3 Expressive Floating Generation & Settings Dock */}
      <View style={styles.dockWrapper}>
        <View style={[styles.dockBar, THEME.shadows.expressive]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleQuickRoleSelect('CHILD', 'Bé An (8 tuổi)')}
            style={[
              styles.dockItem,
              member?.role === 'CHILD' && currentScreen !== 'ROLE_SWITCH' && styles.dockItemActiveMorning,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: member?.role === 'CHILD' && currentScreen !== 'ROLE_SWITCH' }}
          >
            <Text style={styles.dockEmoji}>🧒</Text>
            <Text
              style={[
                styles.dockLabel,
                member?.role === 'CHILD' && currentScreen !== 'ROLE_SWITCH' && styles.dockLabelActiveMorning,
              ]}
            >
              {isVi ? 'Bé An' : 'Child'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleQuickRoleSelect('GRANDPARENT', 'Bà Nội Bảy (68 tuổi)')}
            style={[
              styles.dockItem,
              member?.role === 'GRANDPARENT' && currentScreen !== 'ROLE_SWITCH' && styles.dockItemActiveEvening,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: member?.role === 'GRANDPARENT' && currentScreen !== 'ROLE_SWITCH' }}
          >
            <Text style={styles.dockEmoji}>👵</Text>
            <Text
              style={[
                styles.dockLabel,
                member?.role === 'GRANDPARENT' && currentScreen !== 'ROLE_SWITCH' && styles.dockLabelActiveEvening,
              ]}
            >
              {isVi ? 'Bà Nội' : 'Elder'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleQuickRoleSelect('PARENT', 'Mẹ Hoa (Công nhân)')}
            style={[
              styles.dockItem,
              member?.role === 'PARENT' && currentScreen !== 'ROLE_SWITCH' && styles.dockItemActiveAfternoon,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: member?.role === 'PARENT' && currentScreen !== 'ROLE_SWITCH' }}
          >
            <Text style={styles.dockEmoji}>👩‍🏭</Text>
            <Text
              style={[
                styles.dockLabel,
                member?.role === 'PARENT' && currentScreen !== 'ROLE_SWITCH' && styles.dockLabelActiveAfternoon,
              ]}
            >
              {isVi ? 'Mẹ Hoa' : 'Parent'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('ROLE_SWITCH')}
            style={[
              styles.dockItem,
              currentScreen === 'ROLE_SWITCH' && styles.dockItemActiveNeutral,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentScreen === 'ROLE_SWITCH' }}
          >
            <Text style={styles.dockEmoji}>⚙️</Text>
            <Text
              style={[
                styles.dockLabel,
                currentScreen === 'ROLE_SWITCH' && styles.dockLabelActiveNeutral,
              ]}
            >
              {isVi ? 'Cài đặt' : 'Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <RhythmProvider>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar style="dark" backgroundColor={THEME.colors.background} />
              <NavigationRoot />
            </SafeAreaView>
          </RhythmProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  dockWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#EDE4D9',
  },
  dockBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 5,
    borderWidth: 2,
    borderColor: '#E5DEC9',
    justifyContent: 'space-between',
  },
  dockItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 999,
    minHeight: 48,
  },
  dockItemActiveMorning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  dockItemActiveAfternoon: {
    backgroundColor: '#FFEDD5',
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  dockItemActiveEvening: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  dockItemActiveNeutral: {
    backgroundColor: '#F2EAE0',
    borderWidth: 1.5,
    borderColor: '#85736B',
  },
  dockEmoji: {
    fontSize: 18,
    marginRight: 5,
  },
  dockLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  dockLabelActiveMorning: {
    color: '#78350F',
  },
  dockLabelActiveAfternoon: {
    color: '#9A3412',
  },
  dockLabelActiveEvening: {
    color: '#1E1B4B',
  },
  dockLabelActiveNeutral: {
    color: '#1E1510',
  },
});
