import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Family Bar */}
      <View style={styles.topBar}>
        <View style={styles.familyInfo}>
          <AccessibleText variant="h2" weight="800" color="#78350F">
            🏠 {family?.name || 'Gia đình Nhịp Nhà'}
          </AccessibleText>
          <AccessibleText variant="bodyRegular" color="#92400E" weight="600">
            Xin chào: {member?.name || 'Bé An'} • Mã: {family?.code || 'NHIP-8868'}
          </AccessibleText>
        </View>

        {state.pendingOfflineCount > 0 && (
          <View style={styles.offlineBadge}>
            <AccessibleText variant="label" color="#B45309" weight="700">
              ⚡ Chờ gửi ngoại tuyến ({state.pendingOfflineCount})
            </AccessibleText>
          </View>
        )}
      </View>

      {/* Hero Greeting */}
      <View style={styles.heroBanner}>
        <AccessibleText variant="h1" weight="800" color="#1E293B">
          3 Nhịp Gắn Kết Hôm Nay
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" style={{ marginTop: 4 }}>
          Bấm các nút lớn bên dưới để gửi tin yêu thương đến ba mẹ đang làm xa:
        </AccessibleText>
      </View>

      {/* RHYTHM 1: CHẠM SÁNG */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#B45309">
            ☀️ Chạm Sáng
          </AccessibleText>
          {state.morningCompleted ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                ✓ Đã chào ({state.morningTime || '06:45'})
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#FEF08A' }]}>
              <AccessibleText variant="label" color="#854D0E" weight="700">
                Chưa chạm
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          Báo thức, chúc ba mẹ ngày làm việc bình an trước khi con cắp sách tới trường.
        </AccessibleText>
        <BigButton
          title={state.morningCompleted ? "Xem Lại Lời Chào Sáng" : "Chạm Sáng – Báo Thức Ba Mẹ"}
          subtitle="Một chạm gửi năng lượng tích cực"
          icon="☀️"
          variant="morning"
          size="hero"
          onPress={onNavigateToMorning}
        />
      </View>

      {/* RHYTHM 2: CHẠM CHIỀU */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#C2410C">
            🎒 Chạm Chiều
          </AccessibleText>
          {state.afternoonCompleted ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                ✓ Đã gửi giọng nói ({state.afternoonTime})
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#FFEDD5' }]}>
              <AccessibleText variant="label" color="#9A3412" weight="700">
                Cần làm chiều nay
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          Chọn 4 cảm xúc tan trường và gửi giọng nói 15 giây kể chuyện cùng ba mẹ.
        </AccessibleText>
        <BigButton
          title={state.afternoonCompleted ? "Ghi Âm Thêm Lời Nhắn Chiều" : "Chạm Chiều – Kể Chuyện Tan Trường"}
          subtitle="4 cảm xúc + ghi âm 15 giây (Lưu trữ ngoại tuyến)"
          icon="🎙️"
          variant="afternoon"
          size="hero"
          onPress={onNavigateToAfternoon}
        />
      </View>

      {/* RHYTHM 3: CHẠM TỐI */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AccessibleText variant="h1" color="#3730A3">
            🌙 Chạm Tối
          </AccessibleText>
          {state.eveningListened ? (
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <AccessibleText variant="label" color="#15803D" weight="700">
                ✓ Đã nghe dặn dò
              </AccessibleText>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: '#EEF2FF' }]}>
              <AccessibleText variant="label" color="#4338CA" weight="700">
                Có tin nhắn mới!
              </AccessibleText>
            </View>
          )}
        </View>
        <AccessibleText variant="bodyRegular" color="#334155" style={styles.cardDesc}>
          Lắng nghe lời dặn dò yêu thương của ba mẹ sau ca làm trước khi đi ngủ.
        </AccessibleText>
        <BigButton
          title="Chạm Tối – Nghe Ba Mẹ Dặn Dò"
          subtitle="Bấm để phát giọng nói ấm áp"
          icon="🎧"
          variant="evening"
          size="hero"
          onPress={onNavigateToEvening}
        />
      </View>

      {/* Footer Switcher for Demo */}
      <View style={styles.footer}>
        <BigButton
          title="Chuyển sang Giao Diện Phụ Huynh / Demo"
          icon="🔄"
          variant="secondary"
          onPress={onNavigateToSwitch}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: THEME.colors.background,
    paddingBottom: 40,
  },
  topBar: {
    backgroundColor: '#FEF3C7',
    borderRadius: THEME.borderRadius.card,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  familyInfo: {
    marginBottom: 4,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
    marginTop: 6,
  },
  heroBanner: {
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDesc: {
    marginBottom: 14,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  footer: {
    marginTop: 18,
  },
});
