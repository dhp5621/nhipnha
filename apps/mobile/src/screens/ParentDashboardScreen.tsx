import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';
import { EmpathyPromptCard } from '../components/EmpathyPromptCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import { THEME } from '../constants/theme';
import { CREATIVE_ATTACHMENTS, type EmpathyAssistantResponse } from '@nhipnha/shared';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  onNavigateToSwitch,
}) => {
  const { family, member } = useAuth();
  const { state } = useRhythm();
  const { t, activeLanguage, setLanguagePreference } = useLanguage();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [sentMessage, setSentMessage] = useState(false);

  const isVi = activeLanguage === 'vi';
  const activeAttachment = state.afternoonAttachment || CREATIVE_ATTACHMENTS[0];

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
    Alert.alert(t('quick30sTitle'), t('sentBedtimeSuccess'));
  };

  const toggleQuickLang = () => {
    setLanguagePreference(activeLanguage === 'vi' ? 'en' : 'vi');
  };

  const getMoodBadge = () => {
    switch (state.afternoonMood) {
      case 'CALM':
        return { emoji: '⛅', label: t('moodCalm'), bg: '#E0F2FE', color: '#075985' };
      case 'TIRED':
        return { emoji: '🌧️', label: t('moodTired'), bg: '#F3F4F6', color: '#374151' };
      case 'NEED_HUG':
        return { emoji: '🫂', label: t('moodNeedHug'), bg: '#FCE7F3', color: '#9D174D' };
      case 'JOYFUL':
      default:
        return { emoji: '😄', label: t('moodJoyful'), bg: '#FEF3C7', color: '#92400E' };
    }
  };

  const moodInfo = getMoodBadge();

  const keywords = isVi
    ? ['#VẽHoaSen', '#ĐượcCôKhen', '#CanhChuaBàNấu', '#MongCuốiTuần']
    : ['#LotusDoodle', '#PraisedByTeacher', '#GrandmaSoup', '#WaitingForWeekend'];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* M3 Expressive Parent Hero Card */}
      <View style={[styles.parentBanner, THEME.shadows.expressive]}>
        <View style={styles.bannerTopRow}>
          <View style={styles.avatarCircle}>
            <AccessibleText variant="h1">👩‍🏭</AccessibleText>
          </View>
          <View style={styles.bannerTextCol}>
            <View style={styles.sdgRow}>
              <View style={styles.sdgPill}>
                <AccessibleText variant="caption" color="#9A3412" weight="900">
                  {isVi ? 'BƯỚC CHÂN NHỎ • CHA MẸ XA NHÀ' : 'LITTLE FOOTSTEPS • MIGRANT PARENT'}
                </AccessibleText>
              </View>
            </View>
            <AccessibleText variant="h1" color="#431407" weight="900">
              {t('parentDashboardTitle')}
            </AccessibleText>
            <AccessibleText variant="label" color="#7C2D12" weight="600">
              {t('parentSubtitle')}
            </AccessibleText>
          </View>

          <TouchableOpacity onPress={toggleQuickLang} style={styles.langPill}>
            <AccessibleText variant="label" weight="800" color="#9A3412">
              {isVi ? '🇻🇳 VI' : '🇬🇧 EN'}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1. DAILY 3-RHYTHM STEPPER TIMELINE */}
      <View style={[styles.card, THEME.shadows.card]}>
        <View style={styles.cardHeaderRow}>
          <AccessibleText variant="h2" weight="900" color={THEME.colors.textDark}>
            📅 {t('timelineTitle')}
          </AccessibleText>
          <View style={styles.liveTag}>
            <AccessibleText variant="caption" color="#15803D" weight="800">
              ● {isVi ? 'Đồng bộ hộp thư' : 'Mailbox Synced'}
            </AccessibleText>
          </View>
        </View>

        {/* Stepper Node 1: Morning (06:30 - 07:15) */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineLeftCol}>
            <View style={[styles.nodeCircle, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <AccessibleText variant="bodyLarge">☀️</AccessibleText>
            </View>
            <View style={styles.verticalConnector} />
          </View>
          <View style={[styles.timelineBubble, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={styles.bubbleTopRow}>
              <AccessibleText variant="bodyLarge" weight="800" color="#78350F">
                {t('morningTitle')}
              </AccessibleText>
              <AccessibleText variant="caption" color="#B45309" weight="800">
                {state.morningTime || '06:45'}
              </AccessibleText>
            </View>
            <AccessibleText variant="bodyRegular" color="#92400E" style={{ marginTop: 2 }}>
              {t('morningAlreadyDone')} — “{t('morningQuote')}”
            </AccessibleText>
          </View>
        </View>

        {/* Stepper Node 2: Afternoon (17:00 - 18:30) */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineLeftCol}>
            <View style={[styles.nodeCircle, { backgroundColor: '#FFEDD5', borderColor: '#EA580C' }]}>
              <AccessibleText variant="bodyLarge">🎒</AccessibleText>
            </View>
            <View style={styles.verticalConnector} />
          </View>
          <View style={[styles.timelineBubble, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <View style={styles.bubbleTopRow}>
              <AccessibleText variant="bodyLarge" weight="800" color="#7C2D12">
                {t('afternoonTitle')}
              </AccessibleText>
              <AccessibleText variant="caption" color="#C2410C" weight="800">
                {state.afternoonTime || '17:20'}
              </AccessibleText>
            </View>
            <View style={styles.chipsWrapRow}>
              <View style={[styles.moodChipInline, { backgroundColor: moodInfo.bg }]}>
                <AccessibleText variant="caption" weight="800" color={moodInfo.color}>
                  {moodInfo.emoji} {moodInfo.label} • 🎙️ {state.afternoonVoiceDuration || 14}s
                </AccessibleText>
              </View>
              <View style={styles.attachmentChipInline}>
                <AccessibleText variant="caption" weight="800" color="#9A3412">
                  {activeAttachment.emoji} {isVi ? activeAttachment.titleVi : activeAttachment.titleEn}
                </AccessibleText>
              </View>
            </View>
          </View>
        </View>

        {/* Stepper Node 3: Evening (20:30 - 21:00) */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineLeftCol}>
            <View style={[styles.nodeCircle, { backgroundColor: '#E0E7FF', borderColor: '#4F46E5' }]}>
              <AccessibleText variant="bodyLarge">🌙</AccessibleText>
            </View>
          </View>
          <View style={[styles.timelineBubble, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
            <View style={styles.bubbleTopRow}>
              <AccessibleText variant="bodyLarge" weight="800" color="#1E1B4B">
                {t('eveningTitle')}
              </AccessibleText>
              <AccessibleText variant="caption" color="#4338CA" weight="800">
                {t('eveningTimeWindow')}
              </AccessibleText>
            </View>
            <AccessibleText variant="bodyRegular" color="#3730A3" style={{ marginTop: 2 }}>
              {sentMessage ? `✓ ${t('sentBedtimeSuccess')}` : t('eveningSubtitle')}
            </AccessibleText>
          </View>
        </View>
      </View>

      {/* 2. AI EMPATHY ASSISTANT (Section 5.1, 5.3, 5.4: NLP, CV, Human-Centered AI) */}
      <View style={[styles.card, styles.aiCard, THEME.shadows.card]}>
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleRow}>
            <View style={styles.aiIconCircle}>
              <AccessibleText variant="h2">🌿</AccessibleText>
            </View>
            <View style={{ flex: 1 }}>
              <AccessibleText variant="h2" weight="900" color="#052E16">
                {t('aiAssistantTitle')}
              </AccessibleText>
              <AccessibleText variant="caption" color="#15803D" weight="800">
                {t('aiLevelBadge')}
              </AccessibleText>
            </View>
          </View>
        </View>

        <AccessibleText variant="bodyRegular" color="#14532D" weight="600" style={styles.aiExplanation}>
          💡 {t('aiAssistantDesc')}
        </AccessibleText>

        {/* Keywords Chips (Section 5.1: AI tóm tắt thành các từ khóa) */}
        <View style={styles.keywordSection}>
          <AccessibleText variant="caption" color="#166534" weight="800">
            {t('aiKeywordsLabel')}
          </AccessibleText>
          <View style={styles.keywordRow}>
            {keywords.map((kw, i) => (
              <View key={i} style={styles.keywordPill}>
                <AccessibleText variant="caption" color="#14532D" weight="800">
                  {kw}
                </AccessibleText>
              </View>
            ))}
          </View>
        </View>

        {/* AI Summary Quote Box */}
        <View style={styles.summaryBox}>
          <AccessibleText variant="caption" color="#15803D" weight="800">
            {isVi ? 'BẢN TÓM TẮT NHẬT KÝ 15 GIÂY CỦA CON:' : "CHILD'S 15S DIARY SUMMARY:"}
          </AccessibleText>
          <AccessibleText variant="bodyLarge" color="#1E293B" weight="700" style={{ marginTop: 4 }}>
            {aiData?.summary ||
              'Bé An có một ngày vui vẻ tại trường, được cô giáo khen vẽ hoa sen và ăn cơm ngon cùng bà.'}
          </AccessibleText>
        </View>

        {/* Computer Vision Non-Diagnostic Signal Box (Section 5.3) */}
        <View style={styles.cvBox}>
          <View style={styles.cvHeaderRow}>
            <AccessibleText variant="label" color="#9A3412" weight="800">
              {t('cvSignalTitle')}
            </AccessibleText>
          </View>
          <AccessibleText variant="bodyRegular" color="#7C2D12" weight="600" style={{ marginTop: 4 }}>
            {activeAttachment.emoji} {isVi ? activeAttachment.cvSignalVi : activeAttachment.cvSignalEn}
          </AccessibleText>
        </View>

        {/* Human-Centered AI Safeguard Banner (Section 5.4) */}
        <View style={styles.humanSafeguardBox}>
          <AccessibleText variant="caption" color="#166534" weight="700">
            🛡️ {t('aiHumanCenteredNote')}
          </AccessibleText>
        </View>

        <AccessibleText variant="bodyLarge" weight="800" color="#052E16" style={{ marginTop: 12, marginBottom: 4 }}>
          👇 {t('aiPromptPick')}
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

      {/* 3. ASYNC VOICE MAILBOX & MORNING BELL SCHEDULER */}
      <View style={[styles.card, styles.voiceCard, THEME.shadows.expressive]}>
        <View style={styles.voiceHeaderRow}>
          <View style={styles.voiceIconCircle}>
            <AccessibleText variant="h2">🎙️</AccessibleText>
          </View>
          <View style={{ flex: 1 }}>
            <AccessibleText variant="h2" weight="900" color="#1E1B4B">
              {t('quick30sTitle')}
            </AccessibleText>
            <AccessibleText variant="bodyRegular" color="#3730A3" style={{ marginTop: 2 }}>
              {t('quick30sDesc')}
            </AccessibleText>
          </View>
        </View>

        {selectedPrompt ? (
          <View style={styles.selectedScriptBox}>
            <AccessibleText variant="caption" color="#4338CA" weight="800">
              {isVi ? 'CÂU HỎI MỞ ĐANG CHỌN ĐỂ ĐỌC CHO CON:' : 'SELECTED EMPATHY PROMPT TO READ ALOUD:'}
            </AccessibleText>
            <AccessibleText variant="bodyLarge" color="#1E1B4B" weight="800" style={{ marginTop: 4 }}>
              “{selectedPrompt}”
            </AccessibleText>
          </View>
        ) : null}

        <AudioWaveform
          isRecording={isRecording30s}
          durationLeft={durationLeft}
          maxDuration={30}
        />

        {!isRecording30s ? (
          <BigButton
            title={t('quick30sRecordBtn')}
            subtitle={
              sentMessage
                ? isVi
                  ? '✓ Đã gửi vào Hộp thư thoại • Bấm nếu muốn hẹn giờ Tiếng chuông sáng'
                  : '✓ Sent to Voice Mailbox • Tap to schedule Morning Bell'
                : isVi
                ? 'Chỉ mất 30 giây sau ca làm • Xóa bỏ áp lực gọi cùng lúc'
                : 'Takes only 30s after your shift • Zero simultaneous call pressure'
            }
            icon="🎙️"
            variant="evening"
            size="hero"
            onPress={handleStartRecording}
          />
        ) : (
          <BigButton
            title={t('quick30sSendBtn')}
            subtitle={`${t('recordingTimeLeft')}: ${durationLeft}s`}
            icon="📤"
            variant="success"
            size="hero"
            onPress={handleSendBedtimeVoice}
          />
        )}
      </View>

      {/* 4. WEEKLY RECAP NEWSLETTER (Section 5.1, 5.2, 5.4 Level 2 AI) */}
      <View style={[styles.card, styles.weeklyCard, THEME.shadows.card]}>
        <View style={styles.weeklyHeaderRow}>
          <AccessibleText variant="h2" weight="900" color="#451A03">
            {t('weeklyRecapTitle')}
          </AccessibleText>
        </View>
        <AccessibleText variant="bodyRegular" color="#78350F" style={{ marginTop: 4, marginBottom: 10 }}>
          {t('weeklyRecapSubtitle')}
        </AccessibleText>

        {/* 7-Day Mood Bar Strip */}
        <View style={styles.weekDaysRow}>
          {[
            { d: isVi ? 'T2' : 'M', e: '😄', bg: '#FEF3C7' },
            { d: isVi ? 'T3' : 'T', e: '⛅', bg: '#E0F2FE' },
            { d: isVi ? 'T4' : 'W', e: '😄', bg: '#FEF3C7' },
            { d: isVi ? 'T5' : 'T', e: '🫂', bg: '#FCE7F3' },
            { d: isVi ? 'T6' : 'F', e: '😄', bg: '#FEF3C7' },
            { d: isVi ? 'T7' : 'S', e: '⛅', bg: '#E0F2FE' },
            { d: isVi ? 'CN' : 'S', e: '😄', bg: '#FEF3C7' },
          ].map((day, idx) => (
            <View key={idx} style={[styles.dayPill, { backgroundColor: day.bg }]}>
              <AccessibleText variant="bodyLarge">{day.e}</AccessibleText>
              <AccessibleText variant="caption" color="#451A03" weight="800">
                {day.d}
              </AccessibleText>
            </View>
          ))}
        </View>

        <View style={styles.weeklyPointBox}>
          <AccessibleText variant="bodyRegular" color="#451A03" weight="700">
            {t('weeklyMilestone1')}
          </AccessibleText>
          <AccessibleText variant="bodyRegular" color="#451A03" weight="700" style={{ marginTop: 6 }}>
            {t('weeklyMilestone2')}
          </AccessibleText>
          <AccessibleText variant="bodyRegular" color="#78350F" weight="700" style={{ marginTop: 6 }}>
            {t('weeklyRecurringTopics')}
          </AccessibleText>
        </View>

        <AccessibleText variant="caption" color="#92400E" weight="700" style={{ marginTop: 8 }}>
          {t('weeklyEditableNote')}
        </AccessibleText>
      </View>

      {/* Switch role demo button */}
      <View style={styles.footer}>
        <BigButton
          title={t('switchRoleBtn')}
          subtitle={
            isVi
              ? 'Chuyển sang giao diện Trẻ ở quê (Bé An) hoặc Ông Bà (Bà Nội)'
              : 'Switch to Rural Child (Be An) or Grandparent screen'
          }
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 44,
    backgroundColor: THEME.colors.background,
  },
  parentBanner: {
    backgroundColor: '#FFF4ED',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FDBA74',
    marginBottom: 14,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    borderWidth: 2,
    borderColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
  },
  sdgRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  sdgPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  langPill: {
    backgroundColor: '#FFEDD5',
    borderWidth: 1.5,
    borderColor: '#FB923C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.cardExpressive,
    padding: 18,
    marginVertical: 9,
    borderWidth: 2,
    borderColor: '#E6DFD7',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 44,
    marginRight: 10,
  },
  nodeCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalConnector: {
    width: 3,
    flex: 1,
    backgroundColor: '#E5DEC9',
    marginVertical: 4,
    borderRadius: 2,
  },
  timelineBubble: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  bubbleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  moodChipInline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  attachmentChipInline: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiCard: {
    backgroundColor: '#F2FCF5',
    borderColor: '#86EFAC',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
  },
  aiExplanation: {
    marginVertical: 10,
  },
  keywordSection: {
    marginBottom: 10,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  keywordPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    marginVertical: 4,
  },
  cvBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    marginTop: 8,
  },
  cvHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  humanSafeguardBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  voiceCard: {
    backgroundColor: '#F8FAFF',
    borderColor: '#A5B4FC',
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#818CF8',
  },
  selectedScriptBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginBottom: 4,
  },
  weeklyCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayPill: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  weeklyPointBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  footer: {
    marginTop: 14,
  },
});
