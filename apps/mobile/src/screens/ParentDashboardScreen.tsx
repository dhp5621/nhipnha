import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { apiClient } from '../services/api';
import { EmpathyPromptCard } from '../components/EmpathyPromptCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';
import type { EmpathyAssistantResponse } from '@nhipnha/shared';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state } = useRhythm();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [sentMessage, setSentMessage] = useState(false);

  useEffect(() => {
    async function fetchAiInsights() {
      const mood = state.afternoonMood || 'JOYFUL';
      const insights = await apiClient.getEmpathySuggestions(mood);
      setAiData(insights);
      if (insights.suggestedPrompts.length > 0) {
        setSelectedPrompt(insights.suggestedPrompts[0]);
      }
    }
    fetchAiInsights();
  }, [state.afternoonMood]);

  // 30-second recording countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording30s && durationLeft > 0) {
      interval = setInterval(() => {
        setDurationLeft((prev) => {
          if (prev <= 1) {
            handleSendBedtimeVoice();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording30s, durationLeft]);

  const handleStartRecording = () => {
    setIsRecording30s(true);
    setDurationLeft(30);
  };

  const handleSendBedtimeVoice = async () => {
    setIsRecording30s(false);
    await apiClient.sendBedtimeMessage({
      familyId: family?.id || 'fam_dongthap_001',
      senderName: member?.name || 'Mẹ Hoa',
      transcription: selectedPrompt || 'Con yêu ngủ ngoan nhé, mẹ thương con nhiều!',
      durationSec: 30 - durationLeft || 25,
    });
    setSentMessage(true);
    Alert.alert('Đã Gửi Lời Nhắn!', 'Lời dặn dò đã chuyển đến điện thoại của bé An ở quê!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AccessibleText variant="h1" color="#0F172A" weight="800">
          Nhật Ký Ngày Của Bé An
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#475569" style={{ marginTop: 2 }}>
          {member?.name || 'Mẹ Hoa'} • Khu Công Nghiệp Sóng Thần
        </AccessibleText>
      </View>

      {/* Daily Timeline */}
      <View style={styles.card}>
        <AccessibleText variant="h2" weight="800" color="#1E293B">
          📅 Dòng Thời Gian "3 Nhịp" Của Con
        </AccessibleText>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">☀️</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#854D0E">
              Chạm Sáng ({state.morningTime || '06:45'})
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              Bé đã dậy đúng giờ, ăn sáng và chuẩn bị đến trường.
            </AccessibleText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">🎒</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#9A3412">
              Chạm Chiều ({state.afternoonTime || '16:40'})
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              Cảm xúc: {state.afternoonMood === 'JOYFUL' ? 'Vui vẻ 😄' : state.afternoonMood === 'CALM' ? 'Bình yên ⛅' : state.afternoonMood === 'TIRED' ? 'Hơi mệt 🌧️' : 'Cần ôm 🫂'}
            </AccessibleText>
            <AccessibleText variant="label" color="#C2410C" weight="600">
              Đã ghi âm lời nhắn 15s: "Chiều nay con được cô khen vẽ hoa sen đẹp..."
            </AccessibleText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <AccessibleText variant="h2">🌙</AccessibleText>
          <View style={styles.timelineContent}>
            <AccessibleText variant="bodyLarge" weight="700" color="#3730A3">
              Chạm Tối (20:00 - 22:00)
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#334155">
              {sentMessage ? '✓ Bạn đã gửi lời dặn dò ngủ ngon.' : 'Đang chờ bạn gửi lời dặn dò ấm áp 30s.'}
            </AccessibleText>
          </View>
        </View>
      </View>

      {/* AI EMPATHY ASSISTANT */}
      <View style={[styles.card, styles.aiCard]}>
        <View style={styles.aiHeader}>
          <AccessibleText variant="h2" weight="800" color="#166534">
            🤖 Trợ Lý Thấu Cảm (AI Empathy)
          </AccessibleText>
          <View style={styles.sdgTag}>
            <AccessibleText variant="label" color="#15803D" weight="700">
              SDG 3 & 4
            </AccessibleText>
          </View>
        </View>

        <AccessibleText variant="bodyRegular" color="#14532D" weight="600" style={styles.aiExplanation}>
          💡 Tóm tắt trung thực điều con kể & gợi ý phản hồi thấu cảm trong 30 giây để tránh áp lực hỏi điểm số:
        </AccessibleText>

        <View style={styles.summaryBox}>
          <AccessibleText variant="bodyLarge" color="#1F2937">
            {aiData?.summary || 'Bé An có một ngày vui vẻ tại trường, được cô giáo khen và ăn cơm ngon cùng bà.'}
          </AccessibleText>
        </View>

        <AccessibleText variant="h2" weight="700" color="#14532D" style={{ marginTop: 14 }}>
          Chọn 1 gợi ý thấu cảm để đọc/ghi âm gửi con:
        </AccessibleText>

        {aiData?.suggestedPrompts.map((prompt, index) => (
          <EmpathyPromptCard
            key={index}
            index={index}
            prompt={prompt}
            isSelected={selectedPrompt === prompt}
            onSelectPrompt={(p) => setSelectedPrompt(p)}
          />
        ))}
      </View>

      {/* QUICK 30s VOICE RESPONSE */}
      <View style={styles.card}>
        <AccessibleText variant="h2" weight="800" color="#1E1B4B">
          🎙️ Phản Hồi Nhanh 30 Giây (Gửi Bé Vào Chạm Tối)
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color="#475569" style={{ marginTop: 4 }}>
          Sau ca làm mệt mỏi, hãy dùng 30 giây để tiếp thêm hơi ấm cho con:
        </AccessibleText>

        <AudioWaveform
          isRecording={isRecording30s}
          durationLeft={durationLeft}
        />

        {!isRecording30s ? (
          <BigButton
            title={sentMessage ? "Ghi Âm Thêm Lời Dặn Mới" : "Bắt Đầu Ghi Âm 30 Giây"}
            subtitle="Đọc theo gợi ý AI đã chọn ở trên"
            icon="🎙️"
            variant="evening"
            size="hero"
            onPress={handleStartRecording}
          />
        ) : (
          <BigButton
            title="Dừng & Gửi Về Quê Cho Con Ngay"
            subtitle={`Đang ghi âm: còn ${durationLeft}s`}
            icon="📤"
            variant="success"
            size="hero"
            onPress={handleSendBedtimeVoice}
          />
        )}
      </View>

      {/* Switch role demo button */}
      <View style={styles.footer}>
        <BigButton
          title="Chuyển sang Giao Diện Trẻ Em / Demo"
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
  header: {
    marginBottom: 16,
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
  timelineItem: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'flex-start',
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  aiCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sdgTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  aiExplanation: {
    marginVertical: 8,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginVertical: 6,
  },
  footer: {
    marginTop: 16,
  },
});
