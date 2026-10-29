import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRhythm } from '../context/RhythmContext';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';

interface EveningTouchScreenProps {
  onBack: () => void;
}

export const EveningTouchScreen: React.FC<EveningTouchScreenProps> = ({ onBack }) => {
  const { state, markEveningListened } = useRhythm();
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      markEveningListened();
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000); // simulated playback
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#3730A3" weight="800" center>
          🌙 Chạm Tối: Nghe Lời Dặn Dò
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 4 }}>
          Khoảng thời gian: 20:00 – 22:00 tối
        </AccessibleText>
      </View>

      <View style={styles.card}>
        <View style={styles.parentHeader}>
          <AccessibleText variant="hero">👩‍🏭</AccessibleText>
          <View style={{ marginLeft: 12 }}>
            <AccessibleText variant="h2" weight="800" color="#1E1B4B">
              Mẹ Hoa gửi cho Bé An
            </AccessibleText>
            <AccessibleText variant="label" color="#6366F1">
              Gửi từ khu trọ KCN • 20:30 tối nay
            </AccessibleText>
          </View>
        </View>

        <AudioWaveform
          isRecording={false}
          isPlaying={isPlaying}
          waveform={[30, 45, 60, 85, 90, 70, 50, 40, 60, 75, 45, 20]}
        />

        <BigButton
          title={isPlaying ? "Tạm Dừng Nghe" : "BẤM ĐỂ NGHE GIỌNG NÓI CỦA MẸ"}
          subtitle="Nghe lời dặn dò ấm áp trước khi đi ngủ"
          icon={isPlaying ? "⏸️" : "▶️"}
          variant="evening"
          size="hero"
          onPress={togglePlayback}
        />

        <View style={styles.transcriptionBox}>
          <AccessibleText variant="h2" weight="700" color="#312E81">
            📜 Lời mẹ nhắn nhủ:
          </AccessibleText>
          <AccessibleText variant="bodyLarge" color="#1E1B4B" style={{ marginTop: 8 }}>
            "{state.eveningMessageText}"
          </AccessibleText>
        </View>

        <View style={styles.bedtimeTip}>
          <AccessibleText variant="bodyRegular" color="#065F46" weight="600">
            🍵 Dặn dò ông bà & bé: Nhớ uống ly nước ấm, mắc mùng chống muỗi và ngủ ngoan trước 21:30 để mai học giỏi nhé!
          </AccessibleText>
        </View>
      </View>

      <BigButton
        title="Quay Lại Màn Hình Chính"
        variant="secondary"
        onPress={onBack}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: THEME.colors.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 20,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginBottom: 20,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  transcriptionBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginVertical: 14,
  },
  bedtimeTip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
});
