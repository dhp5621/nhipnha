import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRhythm } from '../context/RhythmContext';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface MorningTouchScreenProps {
  onBack: () => void;
}

export const MorningTouchScreen: React.FC<MorningTouchScreenProps> = ({ onBack }) => {
  const { state, submitMorningTouch } = useRhythm();
  const [submitting, setSubmitting] = useState(false);
  const [justTouched, setJustTouched] = useState(false);

  const handleTouch = async () => {
    setSubmitting(true);
    try {
      await submitMorningTouch();
      setJustTouched(true);
      Alert.alert('Chào Ngày Mới!', 'Đã gửi lời chào đến điện thoại ba mẹ ở nơi làm việc rồi nha con!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#B45309" weight="800" center>
          ☀️ Chạm Sáng: Chào Ngày Mới
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 6 }}>
          Khoảng thời gian: 06:00 – 08:30 sáng
        </AccessibleText>
      </View>

      <View style={styles.sunBox}>
        <AccessibleText variant="hero" center style={styles.sunEmoji}>
          🌅 🌻 🎒
        </AccessibleText>
        <AccessibleText variant="h2" weight="800" color="#78350F" center style={{ marginTop: 8 }}>
          "Chào ba mẹ, con đã dậy rồi!"
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#92400E" center style={{ marginTop: 6, paddingHorizontal: 12 }}>
          Chỉ cần chạm 1 lần vào nút bên dưới, điện thoại của ba mẹ sẽ rung nhẹ và hiện thông báo con đã sẵn sàng đi học ngoan.
        </AccessibleText>
      </View>

      <View style={styles.actionSection}>
        <BigButton
          title={state.morningCompleted || justTouched ? "✓ Đã Chào Sáng Nay!" : "CHẠM ĐỂ CHÀO BA MẸ NGAY"}
          subtitle="Gửi lời chúc ngày làm việc bình an"
          icon="☀️"
          variant={state.morningCompleted || justTouched ? "success" : "morning"}
          size="hero"
          loading={submitting}
          onPress={handleTouch}
        />

        <View style={styles.affirmationBox}>
          <AccessibleText variant="h2" color="#166534" weight="700">
            🌱 Lời khen tặng buổi sáng:
          </AccessibleText>
          <AccessibleText variant="bodyLarge" color="#14532D" style={{ marginTop: 6 }}>
            "Mỗi ngày con thức dậy đúng giờ, ăn sáng đầy đủ là niềm vui và động lực lớn nhất của ba mẹ khi đi làm xa."
          </AccessibleText>
        </View>

        <BigButton
          title="Quay Lại Trang Chủ"
          variant="secondary"
          onPress={onBack}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
  },
  sunBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: THEME.borderRadius.card,
    padding: 24,
    borderWidth: 3,
    borderColor: '#FACC15',
    alignItems: 'center',
    marginBottom: 20,
  },
  sunEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  actionSection: {
    width: '100%',
  },
  affirmationBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
    marginVertical: 14,
  },
});
