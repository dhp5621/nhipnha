import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  CREATIVE_ATTACHMENTS,
  type CreativeAttachment,
  type MoodType,
} from '@nhipnha/shared';
import { useRhythm } from '../context/RhythmContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissions';
import { mediaCaptureService } from '../services/mediaCapture';
import { EmotionSelector } from '../components/EmotionSelector';
import { AudioWaveform } from '../components/AudioWaveform';
import { BigButton } from '../components/BigButton';
import { AccessibleText } from '../components/AccessibleText';

interface AfternoonTouchScreenProps {
  onBack: () => void;
}

export const AfternoonTouchScreen: React.FC<AfternoonTouchScreenProps> = ({ onBack }) => {
  const { state, submitAfternoonTouch } = useRhythm();
  const { t, activeLanguage } = useLanguage();
  const { colors } = useTheme();
  const [selectedMood, setSelectedMood] = useState<MoodType>(state.afternoonMood || 'JOYFUL');
  const [selectedAttachment, setSelectedAttachment] = useState<CreativeAttachment>(
    state.afternoonAttachment || CREATIVE_ATTACHMENTS[0]
  );
  const [isRecording, setIsRecording] = useState(false);
  const [durationLeft, setDurationLeft] = useState(15);
  const [recordedVoice, setRecordedVoice] = useState<{
    url: string;
    duration: number;
    waveform: number[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const isVi = activeLanguage === 'vi';

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

  const handleStartRecording = async () => {
    const granted = await permissionService.requestPermission('microphone', isVi);
    if (!granted) return;

    await mediaCaptureService.startAudioRecording();
    setIsRecording(true);
    setDurationLeft(15);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const audioResult = await mediaCaptureService.stopAudioRecording(15 - durationLeft || 14);
    setRecordedVoice(audioResult);
  };

  const handleSelectAttachment = async (item: CreativeAttachment) => {
    if (item.type === 'PHOTO') {
      const granted = await permissionService.requestPermission('camera', isVi);
      if (!granted) return;
    }
    setSelectedAttachment(item);
  };

  const handleCaptureOrUploadPhoto = async (useCamera: boolean) => {
    const granted = await permissionService.requestPermission('camera', isVi);
    if (!granted) return;

    const photo = await mediaCaptureService.pickOrCapturePhoto(useCamera);
    if (!photo) return;

    const customPhotoAttachment: CreativeAttachment = {
      id: `photo_custom_${Date.now()}`,
      type: 'PHOTO',
      titleVi: useCamera ? 'Ảnh chụp trực tiếp từ máy ảnh' : `Ảnh tải lên: ${photo.name}`,
      titleEn: useCamera ? 'Captured camera photo' : `Uploaded photo: ${photo.name}`,
      emoji: 'photo-camera',
      dominantColor: photo.dominantColor,
      imageUrl: photo.dataUrl,
      cvSignalVi:
        'Ảnh thực tế từ gia đình — Khoảnh khắc sinh hoạt đời thường được chia sẻ trực tiếp từ quê nhà.',
      cvSignalEn:
        'Real family photo — Everyday moment shared directly from home.',
    };
    setSelectedAttachment(customPhotoAttachment);
  };

  const handleSaveAfternoonRhythm = async () => {
    setSaving(true);
    try {
      await submitAfternoonTouch(selectedMood, recordedVoice || undefined, selectedAttachment);
      Alert.alert(t('afternoonTitle'), t('offlineSavedMsg'));
      onBack();
    } catch {
      Alert.alert(t('afternoonTitle'), t('offlineSavedMsg'));
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backPill, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <MaterialIcons name="arrow-back" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
          <AccessibleText variant="label" weight="800">
            {t('back')}
          </AccessibleText>
        </TouchableOpacity>

        <View style={[styles.windowBadge, { backgroundColor: colors.afternoonContainer }]}>
          <AccessibleText variant="caption" color={colors.onAfternoonContainer} weight="800">
            17:00 – 18:30
          </AccessibleText>
        </View>
      </View>

      {/* Editorial Header */}
      <View style={styles.header}>
        <AccessibleText variant="display" weight="900">
          {t('afternoonTitle')}
        </AccessibleText>
        <AccessibleText variant="bodyLarge" color={colors.textSecondary} style={{ marginTop: 4 }}>
          {t('afternoonSubtitle')}
        </AccessibleText>
      </View>

      {/* M3 Expressive Grouped Asymmetric Stack */}
      <View style={styles.groupedStack}>
        {/* STEP 1: Mood */}
        <View
          style={[
            styles.stackTop,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {t('afternoonStep1')}
          </AccessibleText>

          <EmotionSelector
            selectedMood={selectedMood}
            onSelectMood={(mood) => setSelectedMood(mood)}
          />
        </View>

        {/* STEP 2: 15s Voice */}
        <View
          style={[
            styles.stackMiddle,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {t('afternoonStep2')}
          </AccessibleText>

          <AudioWaveform
            isRecording={isRecording}
            durationLeft={durationLeft}
            maxDuration={15}
            waveform={recordedVoice?.waveform}
          />

          {!isRecording ? (
            <BigButton
              title={recordedVoice ? t('afternoonRecordAgain') : t('afternoonRecordBtn')}
              subtitle={
                recordedVoice
                  ? isVi
                    ? `Đã thu âm (${recordedVoice.duration}s) • Bấm để thu lại`
                    : `Recorded (${recordedVoice.duration}s) • Tap to re-record`
                  : isVi
                  ? 'Kể chuyện vui ở lớp hoặc món ngon bà nấu'
                  : 'Share a story from class or dinner with grandma'
              }
              icon="mic"
              variant="afternoon"
              size="hero"
              onPress={handleStartRecording}
            />
          ) : (
            <BigButton
              title={t('afternoonStopBtn')}
              subtitle={`${t('recordingTimeLeft')}: ${durationLeft}s`}
              icon="stop"
              variant="primary"
              size="hero"
              onPress={handleStopRecording}
            />
          )}
        </View>

        {/* STEP 3: Photo Upload / Camera Capture / Doodle */}
        <View
          style={[
            styles.stackBottom,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <AccessibleText variant="h2" weight="800">
            {t('afternoonStep3')}
          </AccessibleText>

          {/* Direct Photo Capture & Upload Actions */}
          <View style={styles.photoUploadRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCaptureOrUploadPhoto(true)}
              style={[
                styles.uploadBtn,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <MaterialIcons name="add-a-photo" size={22} color={colors.onPrimaryContainer} />
              <AccessibleText
                variant="label"
                weight="800"
                color={colors.onPrimaryContainer}
                style={{ marginLeft: 8 }}
              >
                {isVi ? 'Chụp ảnh mới' : 'Take Photo'}
              </AccessibleText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCaptureOrUploadPhoto(false)}
              style={[
                styles.uploadBtn,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <MaterialIcons name="file-upload" size={22} color={colors.primary} />
              <AccessibleText
                variant="label"
                weight="800"
                color={colors.textDark}
                style={{ marginLeft: 8 }}
              >
                {isVi ? 'Tải ảnh từ máy' : 'Upload Photo'}
              </AccessibleText>
            </TouchableOpacity>
          </View>

          {/* Preview Uploaded/Captured Photo if present */}
          {selectedAttachment.imageUrl ? (
            <View
              style={[
                styles.uploadedPreviewCard,
                { backgroundColor: colors.afternoonContainer },
              ]}
            >
              <Image
                source={{ uri: selectedAttachment.imageUrl }}
                style={styles.uploadedImage}
                resizeMode="cover"
              />
              <View style={styles.uploadedMetaRow}>
                <MaterialIcons name="check-circle" size={18} color={colors.onAfternoonContainer} />
                <AccessibleText
                  variant="label"
                  weight="800"
                  color={colors.onAfternoonContainer}
                  style={{ marginLeft: 6, flex: 1 }}
                  numberOfLines={1}
                >
                  {isVi ? selectedAttachment.titleVi : selectedAttachment.titleEn}
                </AccessibleText>
              </View>
            </View>
          ) : null}

          <View style={styles.creativeGrid}>
            {CREATIVE_ATTACHMENTS.map((item) => {
              const isSelected = selectedAttachment.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectAttachment(item)}
                  style={[
                    styles.creativeCard,
                    {
                      backgroundColor: isSelected
                        ? colors.afternoonContainer
                        : colors.surfaceContainerHigh,
                      borderRadius: isSelected ? 30 : 20,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.creativeTopRow}>
                    <MaterialIcons
                      name={item.emoji as any}
                      size={28}
                      color={item.dominantColor}
                    />
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.dominantColor },
                      ]}
                    />
                  </View>

                  <AccessibleText
                    variant="bodyRegular"
                    weight="800"
                    color={isSelected ? colors.onAfternoonContainer : colors.textDark}
                    style={{ marginTop: 8 }}
                  >
                    {isVi ? item.titleVi : item.titleEn}
                  </AccessibleText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Submit */}
      <View style={{ marginTop: 14 }}>
        <BigButton
          title={t('afternoonSubmit')}
          subtitle={t('offlineSavedMsg')}
          icon="send"
          variant="success"
          size="hero"
          loading={saving}
          onPress={handleSaveAfternoonRhythm}
        />
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
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  windowBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  header: {
    marginBottom: 16,
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
  photoUploadRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  uploadedPreviewCard: {
    marginTop: 10,
    borderRadius: 24,
    padding: 10,
  },
  uploadedImage: {
    width: '100%',
    height: 170,
    borderRadius: 18,
  },
  uploadedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  creativeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  creativeCard: {
    width: '48.2%',
    padding: 14,
    marginBottom: 10,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  creativeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
});
