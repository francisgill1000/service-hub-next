import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH - 80;

export default function ScanLoginScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [token, setToken] = useState('');
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const extractToken = (data) => {
    // QR encodes a URL like: https://eloquentservice.com/login/qr?token=ABC123
    try {
      const url = new URL(data);
      const t = url.searchParams.get('token');
      if (t) return t;
    } catch {}
    // Fallback: treat raw data as token
    return data.trim();
  };

  const handleApprove = async (approveToken) => {
    const tok = approveToken || token.trim();
    if (!tok) { setError('Please enter or scan a QR token.'); return; }
    setApproving(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/shops/qr-login/approve`, { token: tok });
      setMessage('Login approved! The desktop session has been authenticated.');
      setToken('');
      setScanned(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve login. Token may be invalid or expired.');
      setScanned(false);
    } finally {
      setApproving(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned || approving) return;
    setScanned(true);
    const tok = extractToken(data);
    setToken(tok);
    handleApprove(tok);
  };

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
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        {/* Scanner overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanBox}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>

        {approving && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator color={Colors.white} size="large" />
            <Text style={styles.scanningText}>Approving...</Text>
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
            onPress={() => { setMode('camera'); setScanned(false); }}
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

        {/* Status messages */}
        {!!message && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle" size={20} color={Colors.green} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {mode === 'camera' ? (
          <>
            {renderCamera()}
            <Text style={styles.scanHint}>Point your camera at the QR code on the desktop login screen</Text>
            {scanned && !approving && (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => { setScanned(false); setError(''); }}>
                <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.rescanBtnText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>QR Token</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="vpn-key" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Paste token from desktop..."
                placeholderTextColor={Colors.mutedText}
                value={token}
                onChangeText={(v) => { setToken(v); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.approveBtn, (approving || !token.trim()) && styles.approveBtnDisabled]}
              onPress={() => handleApprove()}
              disabled={approving || !token.trim()}
            >
              {approving ? (
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

  // Status
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(78,222,163,0.1)', borderWidth: 1,
    borderColor: 'rgba(78,222,163,0.2)', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  successText: { color: Colors.green, fontSize: 13, flex: 1 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },

  // Camera
  cameraContainer: {
    width: '100%', aspectRatio: 1, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#000', marginBottom: 16, position: 'relative',
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

  scanHint: {
    color: Colors.mutedText, fontSize: 13, textAlign: 'center',
    fontWeight: '500', marginBottom: 12,
  },
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
