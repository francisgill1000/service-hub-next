import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH - 80;

// status: 'idle' | 'scanning' | 'approving' | 'success' | 'error'

const extractToken = (data) => {
  if (!data) return '';
  try {
    const url = new URL(data);
    const t = url.searchParams.get('token');
    if (t) return t;
  } catch {}
  // Try UUID match like web app
  const uuidMatch = String(data).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  if (uuidMatch?.[0]) return uuidMatch[0];
  return data.trim();
};

export default function ScanLoginScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [status, setStatus] = useState('scanning');
  const [message, setMessage] = useState('Point your camera at the QR code on the desktop login screen.');
  const [permission, requestPermission] = useCameraPermissions();

  const statusRef = useRef('scanning');
  const [cameraKey, setCameraKey] = useState(0);

  const approveToken = useCallback(async (token) => {
    if (!token || statusRef.current === 'approving' || statusRef.current === 'success') return;

    statusRef.current = 'approving';
    setStatus('approving');
    setMessage('Approving desktop login...');

    try {
      await api.post(`/shops/qr-login/approve/${token}`);
      statusRef.current = 'success';
      setStatus('success');
      setMessage('Desktop login approved! You can return to your desktop now.');
    } catch (err) {
      statusRef.current = 'error';
      setStatus('error');
      setMessage(err.response?.data?.message || 'Could not approve login. Please scan a fresh QR and try again.');
    }
  }, []);

  const handleBarCodeScanned = useCallback(({ data }) => {
    if (statusRef.current !== 'scanning') return;

    const token = extractToken(data);
    if (!token) return;

    approveToken(token);
  }, [approveToken]);

  const resetScanner = useCallback(() => {
    statusRef.current = 'scanning';
    setStatus('scanning');
    setCameraKey(k => k + 1);
    setMessage('Point your camera at the QR code on the desktop login screen.');
  }, []);

  const renderCamera = () => {
    if (!permission) {
      return (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.cameraPlaceholder}>
          <MaterialIcons name="no-photography" size={48} color={Colors.slateGray} />
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSubtitle}>Allow camera access to scan QR codes from desktop.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraOuter}>
        <View style={styles.cameraContainer}>
          <CameraView
            key={cameraKey}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={status === 'scanning' ? handleBarCodeScanned : undefined}
          />
        </View>
        {/* Scanner overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>

        {status === 'approving' && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator color={Colors.white} size="large" />
            <Text style={styles.scanningText}>Approving...</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.scanningOverlay}>
            <MaterialIcons name="check-circle" size={48} color={Colors.green} />
            <Text style={styles.scanningText}>Approved!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.mutedText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Login</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'camera' && styles.modeBtnActive]}
            onPress={() => { setMode('camera'); resetScanner(); }}
          >
            <MaterialIcons name="qr-code-scanner" size={16} color={mode === 'camera' ? '#002e69' : Colors.mutedText} />
            <Text style={[styles.modeBtnText, mode === 'camera' && styles.modeBtnTextActive]}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => setMode('manual')}
          >
            <MaterialIcons name="keyboard" size={16} color={mode === 'manual' ? '#002e69' : Colors.mutedText} />
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>Enter Token</Text>
          </TouchableOpacity>
        </View>

        {/* Status message */}
        <View style={[
          styles.messageBox,
          status === 'success' && styles.messageBoxSuccess,
          status === 'error' && styles.messageBoxError,
        ]}>
          <MaterialIcons
            name={status === 'success' ? 'check-circle' : status === 'error' ? 'error' : 'info'}
            size={18}
            color={status === 'success' ? Colors.green : status === 'error' ? '#ef4444' : Colors.mutedText}
          />
          <Text style={[
            styles.messageText,
            status === 'success' && styles.messageTextSuccess,
            status === 'error' && styles.messageTextError,
          ]}>{message}</Text>
        </View>

        {mode === 'camera' ? (
          <>
            {renderCamera()}

            {(status === 'error' || status === 'success') && (
              <TouchableOpacity style={styles.rescanBtn} onPress={resetScanner}>
                <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.rescanBtnText}>
                  {status === 'success' ? 'Scan Another' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>QR Token or URL</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="vpn-key" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Paste token or URL from desktop..."
                placeholderTextColor={Colors.mutedText}
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.approveBtn, (status === 'approving' || !manualToken.trim()) && styles.approveBtnDisabled]}
              onPress={() => approveToken(extractToken(manualToken))}
              disabled={status === 'approving' || !manualToken.trim()}
            >
              {status === 'approving' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color={Colors.white} />
                  <Text style={styles.approveBtnText}>Approve Login</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* How it works */}
        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>How it works</Text>
          {(mode === 'camera' ? [
            'Open Rezzy login on your desktop.',
            'Select "Scan QR" mode and generate a QR code.',
            'Point your phone camera at the QR code.',
            'The desktop session will be authenticated instantly.',
          ] : [
            'Open Rezzy login on your desktop.',
            'Select "Scan QR" mode and generate a token.',
            'Copy the token and paste it above.',
            'Tap Approve Login to authenticate the desktop.',
          ]).map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, backgroundColor: Colors.cardDark,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  scroll: { padding: 20, paddingBottom: 48 },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row', backgroundColor: Colors.cardDark,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 4, marginBottom: 20,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 42, borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: Colors.lightBlue },
  modeBtnText: { color: Colors.mutedText, fontWeight: '700', fontSize: 13 },
  modeBtnTextActive: { color: '#002e69' },

  // Status message
  messageBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  messageBoxSuccess: {
    backgroundColor: 'rgba(78,222,163,0.1)',
    borderColor: 'rgba(78,222,163,0.2)',
  },
  messageBoxError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  messageText: { color: Colors.mutedText, fontSize: 13, flex: 1 },
  messageTextSuccess: { color: Colors.green },
  messageTextError: { color: '#ef4444' },

  // Camera
  cameraOuter: {
    width: '100%', height: SCANNER_SIZE, borderRadius: 20,
    overflow: 'hidden', backgroundColor: '#000', marginBottom: 16,
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  camera: { flex: 1 },
  cameraPlaceholder: {
    width: '100%', aspectRatio: 1, borderRadius: 20,
    backgroundColor: Colors.cardDark, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, gap: 12, paddingHorizontal: 32,
  },
  permTitle: { color: Colors.white, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  permSubtitle: { color: Colors.mutedText, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  permBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  permBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Scanner overlay
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: 'row', height: SCANNER_SIZE * 0.6 },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  scanBox: {
    width: SCANNER_SIZE * 0.6, height: SCANNER_SIZE * 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: Colors.primary, borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  scanningText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginBottom: 16,
  },
  rescanBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  // Manual mode
  inputLabel: {
    fontSize: 10, color: Colors.mutedText, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, height: 56, paddingHorizontal: 16, marginBottom: 20,
  },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  approveBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32,
  },
  approveBtnDisabled: { opacity: 0.5 },
  approveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  // How to
  howTo: {
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 8,
  },
  howToTitle: { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  stepNum: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: 'rgba(0,122,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  stepText: { color: Colors.mutedText, fontSize: 13, flex: 1, lineHeight: 20 },
});
