import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { mediaCaptureService } from '../services/mediaCapture';
import { apiClient } from '../services/api';
import { EmpathyPromptCard } from '../components/EmpathyPromptCard';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';
import type { EmpathyAssistantResponse } from '@nhipnha/shared';

interface ParentDashboardScreenProps {
  onNavigateToSwitch: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = () => {
  const { family, member } = useAuth();
  const { state, refreshRhythm } = useRhythm();
  const { t, activeLanguage, setLanguagePreference } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [aiData, setAiData] = useState<EmpathyAssistantResponse | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isRecording30s, setIsRecording30s] = useState(false);
  const [durationLeft, setDurationLeft] = useState(30);
  const [sentMessage, setSentMessage] = useState(false);

  const isVi = activeLanguage === 'vi';
  const activeAttachment = state.afternoonAttachment;
  const hasDiaryToday = state.afternoonCompleted;
  const completedRhythmsCount =
    (state.morningCompleted ? 1 : 0) +
    (state.afternoonCompleted ? 1 : 0) +
    (!!state.eveningMessageText || sentMessage ? 1 : 0);

  useEffect(() => {
    async function fetchAiInsights() {
      if (!hasDiaryToday) {
        setAiData(null);
        return;
      }
      const mood = state.afternoonMood || 'JOYFUL';
      const attachTitle = activeAttachment
        ? isVi
          ? activeAttachment.titleVi
          : activeAttachment.titleEn
        : undefined;
      const insights = await apiClient.getEmpathySuggestions(
        mood,
        state.afternoonNote,
        attachTitle,
        activeLanguage
      );
      if (insights) {
        setAiData(insights);
        if (insights.suggestedPrompts.length > 0) {
          setSelectedPrompt(insights.suggestedPrompts[0]);
        }
      }
    }
    fetchAiInsights();
  }, [state.afternoonMood, state.afternoonNote, activeAttachment, activeLanguage, hasDiaryToday, isVi]);

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

  const handleStartRecording = async () => {
    const started = await mediaCaptureService.startAudioRecording(isVi);
    if (!started) return;

    setIsRecording30s(true);
    setDurationLeft(30);
  };

  const handleSendBedtimeVoice = async () => {
    setIsRecording30s(false);
    if (!family?.id) return;
    try {
      const audioRes = await mediaCaptureService.stopAudioRecording(30 - durationLeft || 25);
      await apiClient.sendBedtimeMessage({
        familyId: family.id,
        senderId: member?.id,
        senderName: member?.name || 'Bố / Mẹ',
        audioUrl: audioRes.url,
        transcription: selectedPrompt || 'Con yêu ngủ ngoan nhé, bố mẹ thương con nhiều!',
        durationSec: audioRes.duration,
      });
      setSentMessage(true);
      await refreshRhythm();
      Alert.alert(t('quick30sTitle'), t('sentBedtimeSuccess'));
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể gửi tin nhắn chúc ngủ ngon');
    }
  };

  const getMoodIconAndLabel = (): {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
  } => {
    if (!state.afternoonMood) {
      return {
        icon: 'schedule',
        label: isVi ? 'Chưa điểm danh chiều nay' : 'No afternoon check-in yet',
      };
    }
    switch (state.afternoonMood) {
      case 'CALM':
        return { icon: 'wb-cloudy', label: t('moodCalm') };
      case 'TIRED':
        return { icon: 'bedtime', label: t('moodTired') };
      case 'NEED_HUG':
        return { icon: 'favorite', label: t('moodNeedHug') };
      case 'JOYFUL':
      default:
        return { icon: 'sentiment-very-satisfied', label: t('moodJoyful') };
    }
  };

  const moodInfo = getMoodIconAndLabel();
  const keywords = aiData?.keywords || [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.miniIcon}
          />
          <View style={{ flex: 1 }}>
            <AccessibleText variant="h2" weight="900" numberOfLines={1}>
              {family?.name || t('appName')}
            </AccessibleText>
            <AccessibleText variant="caption" color={colors.textSecondary}>
              {member?.name} • {family?.code}
            </AccessibleText>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconChip, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <MaterialIcons
              name={isDark ? 'dark-mode' : 'wb-sunny'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLanguagePreference(isVi ? 'en' : 'vi')}
            style={[styles.iconChip, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <AccessibleText variant="caption" weight="900" color={colors.primary}>
              {isVi ? 'VI' : 'EN'}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Editorial Parent Header */}
      <View style={{ marginBottom: 16 }}>
        <AccessibleText variant="display" weight="900">
          {t('parentDashboardTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyRegular" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('parentSubtitle')}
        </AccessibleText>
      </View>

      {/* M3 Expressive Grouped Asymmetric Stack */}
      <View style={styles.groupedStack}>
        {/* CARD 1: 3-Rhythm Daily Summary */}
        <View
          style={[
            styles.stackTop,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800" style={{ marginBottom: 12 }}>
            {t('timelineTitle')}
          </AccessibleText>

          <View style={styles.rhythmRow}>
            <View
              style={[
                styles.rhythmPill,
                { backgroundColor: colors.morningSurface },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onMorningContainer} weight="800">
                06:30 • {t('morningTitle')}
              </AccessibleText>
              <View style={styles.inlineIconRow}>
                <MaterialIcons
                  name={state.morningCompleted ? 'check-circle' : 'schedule'}
                  size={18}
                  color={colors.onMorningContainer}
                  style={{ marginRight: 6 }}
                />
                <AccessibleText variant="bodyRegular" color={colors.onMorningContainer} weight="700">
                  {state.morningCompleted
                    ? `${t('morningAlreadyDone')}${state.morningTime ? ` (${state.morningTime})` : ''}`
                    : isVi
                    ? 'Chưa gửi lời chào sáng'
                    : 'No morning check-in yet'}
                </AccessibleText>
              </View>
            </View>

            <View
              style={[
                styles.rhythmPill,
                { backgroundColor: colors.afternoonSurface },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onAfternoonContainer} weight="800">
                17:00 • {t('afternoonTitle')}
              </AccessibleText>
              <View style={styles.inlineIconRow}>
                <MaterialIcons
                  name={moodInfo.icon}
                  size={18}
                  color={colors.onAfternoonContainer}
                  style={{ marginRight: 6 }}
                />
                <AccessibleText variant="bodyRegular" color={colors.onAfternoonContainer} weight="700" style={{ flex: 1 }}>
                  {moodInfo.label}
                  {activeAttachment
                    ? ` • ${isVi ? activeAttachment.titleVi : activeAttachment.titleEn}`
                    : ''}
                </AccessibleText>
              </View>
            </View>

            <View
              style={[
                styles.rhythmPill,
                { backgroundColor: colors.eveningSurface },
              ]}
            >
              <AccessibleText variant="caption" color={colors.onEveningContainer} weight="800">
                20:30 • {t('eveningTitle')}
              </AccessibleText>
              <View style={styles.inlineIconRow}>
                <MaterialIcons
                  name={sentMessage || state.eveningMessageText ? 'check-circle' : 'nights-stay'}
                  size={18}
                  color={colors.onEveningContainer}
                  style={{ marginRight: 6 }}
                />
                <AccessibleText variant="bodyRegular" color={colors.onEveningContainer} weight="700">
                  {sentMessage || state.eveningMessageText
                    ? t('sentBedtimeSuccess')
                    : t('eveningSubtitle')}
                </AccessibleText>
              </View>
            </View>
          </View>
        </View>

        {/* CARD 2: AI Empathy Assistant (30s) */}
        <View
          style={[
            styles.stackMiddle,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="auto-awesome" size={22} color={colors.primary} style={{ marginRight: 8 }} />
            <AccessibleText variant="h2" weight="800" style={{ flex: 1 }}>
              {t('aiAssistantTitle')}
            </AccessibleText>
          </View>

          {hasDiaryToday ? (
            <>
              {keywords.length > 0 && (
                <View style={styles.keywordRow}>
                  {keywords.map((kw, i) => (
                    <View
                      key={i}
                      style={[
                        styles.keywordChip,
                        { backgroundColor: colors.secondaryContainer },
                      ]}
                    >
                      <AccessibleText
                        variant="caption"
                        color={colors.onSecondaryContainer}
                        weight="800"
                      >
                        {kw}
                      </AccessibleText>
                    </View>
                  ))}
                </View>
              )}

              <View
                style={[
                  styles.summaryBox,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                <AccessibleText variant="bodyLarge" weight="700">
                  {aiData?.summary ||
                    state.afternoonNote ||
                    (isVi
                      ? 'Đang phân tích nhật ký 15 giây của con...'
                      : 'Analyzing child’s 15-second diary...')}
                </AccessibleText>
                {activeAttachment && (
                  <View style={{ marginTop: 8 }}>
                    {activeAttachment.imageUrl ? (
                      <Image
                        source={{ uri: activeAttachment.imageUrl }}
                        style={{ width: '100%', height: 170, borderRadius: 16, marginBottom: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.inlineIconRow}>
                      <MaterialIcons
                        name={activeAttachment.emoji as any}
                        size={18}
                        color={activeAttachment.dominantColor}
                        style={{ marginRight: 6 }}
                      />
                      <AccessibleText
                        variant="label"
                        color={colors.textSecondary}
                        style={{ flex: 1 }}
                      >
                        {aiData?.cvInsight ||
                          (isVi ? activeAttachment.cvSignalVi : activeAttachment.cvSignalEn)}
                      </AccessibleText>
                    </View>
                  </View>
                )}
              </View>

              {aiData?.suggestedPrompts && aiData.suggestedPrompts.length > 0 && (
                <>
                  <AccessibleText
                    variant="label"
                    color={colors.textSecondary}
                    style={{ marginTop: 12, marginBottom: 4 }}
                  >
                    {t('aiPromptPick')}
                  </AccessibleText>

                  {aiData.suggestedPrompts.map((prompt, index) => (
                    <EmpathyPromptCard
                      key={index}
                      index={index}
                      prompt={prompt}
                      isSelected={selectedPrompt === prompt}
                      onSelectPrompt={(p) => setSelectedPrompt(p)}
                    />
                  ))}
                </>
              )}

              <AccessibleText
                variant="caption"
                color={colors.textMuted}
                style={{ marginTop: 8 }}
              >
                {t('aiHumanCenteredNote')}
              </AccessibleText>
            </>
          ) : (
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: colors.surfaceContainerHigh, marginTop: 8 },
              ]}
            >
              <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
                {isVi
                  ? 'Khi con gửi Nhật ký 15 giây vào buổi chiều, hệ thống AI trên máy chủ sẽ tóm tắt từ khóa và gợi ý câu hỏi mở tại đây.'
                  : 'Once your child sends their 15s afternoon diary, our server AI will summarize keywords and suggest open prompts here.'}
              </AccessibleText>
            </View>
          )}
        </View>

        {/* CARD 3: 30s Voice Mailbox Recorder */}
        <View
          style={[
            styles.stackMiddle,
            { backgroundColor: colors.eveningSurface },
          ]}
        >
          <AccessibleText
            variant="h2"
            weight="800"
            color={colors.onEveningContainer}
          >
            {t('quick30sTitle')}
          </AccessibleText>
          <AccessibleText
            variant="bodyRegular"
            color={colors.onEveningContainer}
            style={{ opacity: 0.85, marginTop: 2 }}
          >
            {t('quick30sDesc')}
          </AccessibleText>

          {selectedPrompt ? (
            <View
              style={[
                styles.scriptBox,
                { backgroundColor: colors.eveningContainer },
              ]}
            >
              <AccessibleText
                variant="bodyLarge"
                weight="800"
                color={colors.onEveningContainer}
              >
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
                    ? 'Đã gửi vào hộp thư • Bấm để thu thêm'
                    : 'Sent to mailbox • Tap to record another'
                  : isVi
                  ? 'Hộp thư thoại bất đồng bộ 30 giây'
                  : '30-second async voice mailbox'
              }
              icon="mic"
              variant="evening"
              size="hero"
              onPress={handleStartRecording}
            />
          ) : (
            <BigButton
              title={t('quick30sSendBtn')}
              subtitle={`${t('recordingTimeLeft')}: ${durationLeft}s`}
              icon="send"
              variant="success"
              size="hero"
              onPress={handleSendBedtimeVoice}
            />
          )}
        </View>

        {/* CARD 4: Weekly Recap Newsletter */}
        <View
          style={[
            styles.stackBottom,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="insights" size={22} color={colors.primary} style={{ marginRight: 8 }} />
            <AccessibleText variant="h2" weight="800" style={{ flex: 1 }}>
              {t('weeklyRecapTitle')}
            </AccessibleText>
          </View>
          <AccessibleText
            variant="bodyRegular"
            color={colors.textSecondary}
            style={{ marginTop: 4, marginBottom: 12 }}
          >
            {t('weeklyRecapSubtitle')}
          </AccessibleText>

          {completedRhythmsCount >= 2 ? (
            <>
              <View style={styles.weekDaysRow}>
                {[
                  { d: isVi ? 'T2' : 'M', icon: 'sentiment-very-satisfied' as const, c: '#F59E0B' },
                  { d: isVi ? 'T3' : 'T', icon: 'wb-cloudy' as const, c: '#0284C7' },
                  { d: isVi ? 'T4' : 'W', icon: 'sentiment-very-satisfied' as const, c: '#F59E0B' },
                  { d: isVi ? 'T5' : 'T', icon: 'favorite' as const, c: '#EC4899' },
                  { d: isVi ? 'T6' : 'F', icon: 'sentiment-very-satisfied' as const, c: '#F59E0B' },
                  { d: isVi ? 'T7' : 'S', icon: 'wb-cloudy' as const, c: '#0284C7' },
                  { d: isVi ? 'CN' : 'S', icon: 'sentiment-very-satisfied' as const, c: '#F59E0B' },
                ].map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dayPill,
                      { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                  >
                    <MaterialIcons name={day.icon} size={20} color={day.c} />
                    <AccessibleText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {day.d}
                    </AccessibleText>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.summaryBox,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                <AccessibleText variant="bodyRegular" weight="700">
                  {t('weeklyMilestone1')}
                </AccessibleText>
                <AccessibleText variant="bodyRegular" weight="700" style={{ marginTop: 6 }}>
                  {t('weeklyRecurringTopics')}
                </AccessibleText>
              </View>
            </>
          ) : (
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <AccessibleText variant="bodyRegular" color={colors.textSecondary}>
                {isVi
                  ? 'Bản tin tổng kết tuần sẽ tự động tổng hợp từ cơ sở dữ liệu sau khi gia đình hoàn thành các nhịp kết nối.'
                  : 'Your Weekly Recap will automatically generate from the database after your family completes daily check-ins.'}
              </AccessibleText>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 38,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    height: 40,
    minWidth: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupedStack: {
    gap: 6,
  },
  stackTop: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 20,
  },
  stackMiddle: {
    borderRadius: 14,
    padding: 20,
  },
  stackBottom: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    padding: 20,
  },
  rhythmRow: {
    gap: 8,
  },
  rhythmPill: {
    borderRadius: 20,
    padding: 14,
  },
  inlineIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  keywordChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  summaryBox: {
    borderRadius: 22,
    padding: 16,
  },
  scriptBox: {
    borderRadius: 20,
    padding: 14,
    marginTop: 10,
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
  },
});
