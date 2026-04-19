import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Colors } from '../theme/colors';
import api from '../utils/api';

export default function VoiceInputButton({ onIntent, onError, size = 22 }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const permissionChecked = useRef(false);

  useEffect(() => {
    return () => {
      if (recorder?.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, [recorder]);

  const ensurePermission = async () => {
    if (permissionChecked.current) return true;
    const { granted } = await requestRecordingPermissionsAsync();
    permissionChecked.current = granted;
    if (!granted) {
      Alert.alert(
        'Microphone access needed',
        'Please enable microphone permission in Settings to use voice search.'
      );
    }
    return granted;
  };

  const startRecording = async () => {
    const granted = await ensurePermission();
    if (!granted) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      onError?.(err);
    }
  };

  const stopAndSend = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording produced');

      const form = new FormData();
      form.append('audio', {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      });

      const res = await api.post('/voice/intent', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onIntent?.(res.data);
    } catch (err) {
      onError?.(err);
      Alert.alert('Voice search failed', 'Please try again in a moment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isProcessing) return;
    if (isRecording) stopAndSend();
    else startRecording();
  };

  const active = isRecording || isProcessing;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice search'}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={isProcessing}
      style={[styles.btn, active && styles.btnActive]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isProcessing ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <MaterialIcons
          name={isRecording ? 'stop' : 'mic'}
          size={size}
          color={active ? Colors.white : Colors.primary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  btnActive: {
    backgroundColor: Colors.primary,
  },
});
