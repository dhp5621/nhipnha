import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import type { MoodType } from '@nhipnha/shared';
import { useRhythm } from '../context/RhythmContext';
import { EmotionSelector } from '../components/EmotionSelector';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { offlineStorage } from '../services/offlineStorage';
import { THEME } from '../constants/theme';

interface AfternoonTouchScreenProps {
  onBack: () => void;
}

export const AfternoonTouchScreen: React.FC<AfternoonTouchScreenProps> = ({ onBack }) => {
  const { state, submitAfternoonTouch } = useRhythm();
  const [selectedMood, setSelectedMood] = useState<MoodType>(state.afternoonMood || 'JOYFUL');
  const [isRecording, setIsRecording] = useState(false);
  const [durationLeft, setDurationLeft] = useState(15);
  const [recordedVoice, setRecordedVoice] = useState<{ url: string; duration: number; waveform: number[] } | null>(null);
  const [saving, setSaving] = useState(false);

  // 15-second countdown timer during recording
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording && durationLeft > 0) {
      timer = setInterval(() => {
        setDurationLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, durationLeft]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setDurationLeft(15);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const mockAudio = await offlineStorage.recordMockVoice(15 - durationLeft || 14);
    setRecordedVoice({
      url: mockAudio.voiceUrl,
      duration: mockAudio.durationSec,
      waveform: mockAudio.waveform,
    });
  };

  const handleSaveAfternoonRhythm = async () => {
    setSaving(true);
    try {
      await submitAfternoonTouch(selectedMood, recordedVoice || undefined);
      Alert.alert(
        'Đã Lưu Nhịp Chiều!',
        'Lời nhắn đã được lưu trữ (offline-first) và chuyển giao an toàn đến ba mẹ!'
      );
      onBack();
    } catch {
      Alert.alert('Thông báo', 'Đã lưu tạm thời vào bộ nhớ ngoại tuyến trên máy.');
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#C2410C" weight="800" center>
          🎒 Chạm Chiều: Kể Chuyện Tan Trường
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color="#475569" center style={{ marginTop: 4 }}>
          Khoảng thời gian: 16:00 – 18:30 chiều
        </AccessibleText>
      </View>

      {/* Step 1: Mood */}
      <View style={styles.sectionCard}>
        <AccessibleText variant="h2" weight="800" color="#7C2D12">
          1. Hôm nay ở trường con thấy thế nào?
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#78350F" style={{ marginTop: 4 }}>
          Chạm vào 1 trong 4 khuôn mặt thân thiện bên dưới:
        </AccessibleText>

        <EmotionSelector
          selectedMood={selectedMood}
          onSelectMood={(mood) => setSelectedMood(mood)}
        />
      </View>

      {/* Step 2: 15s Voice Message with countdown and waveform */}
      <View style={styles.sectionCard}>
        <AccessibleText variant="h2" weight="800" color="#7C2D12">
          2. Nói lời yêu thương 15 giây gửi ba mẹ
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#78350F" style={{ marginTop: 4 }}>
          Kể chuyện vui ở lớp, hôm nay ăn gì ngon, hoặc nói con nhớ ba mẹ:
        </AccessibleText>

        <AudioWaveform
          isRecording={isRecording}
          durationLeft={durationLeft}
          waveform={recordedVoice?.waveform}
        />

        {!isRecording ? (
          <BigButton
            title={recordedVoice ? "Ghi Âm Lại (15 Giây)" : "Bắt Đầu Ghi Âm (15 Giây)"}
            subtitle="Đếm ngược tự động, không lo tốn dung lượng 4G"
            icon="🎙️"
            variant="afternoon"
            size="hero"
            onPress={handleStartRecording}
          />
        ) : (
          <BigButton
            title="Dừng Ghi Âm Ngay"
            subtitle={`Thời gian còn lại: ${durationLeft}s`}
            icon="⏹️"
            variant="primary"
            size="hero"
            onPress={handleStopRecording}
          />
        )}
      </View>

      {/* Step 3: Offline-first submit */}
      <View style={styles.submitSection}>
        <BigButton
          title="HOÀN TẤT & GỬI CHO BA MẸ"
          subtitle="Tự động đồng bộ ngay cả khi mạng chập chờn"
          icon="💌"
          variant="success"
          size="hero"
          loading={saving}
          onPress={handleSaveAfternoonRhythm}
        />

        <BigButton
          title="Quay Lại"
          variant="secondary"
          onPress={onBack}
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
  header: {
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.card,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  submitSection: {
    marginTop: 12,
  },
});
