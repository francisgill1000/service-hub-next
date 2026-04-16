import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // Added useIsFocused
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH - 40;

const extractToken = (data) => {
  if (!data) return '';
  try {
    const url = new URL(data);
    const t = url.searchParams.get('token');
    if (t) return t;
  } catch {}
  const uuidMatch = String(data).match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  return uuidMatch?.[0] || data.trim();
};

export default function ScanLoginScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Crucial for camera preview stability
  const [mode, setMode] = useState('camera');
  const [manualToken, setManualToken] = useState('');
  const [status, setStatus] = useState('scanning');
  const [message, setMessage] = useState('Point your camera at the QR code.');
  const [permission, requestPermission] = useCameraPermissions();
  const statusRef = useRef('scanning');

  const approveToken = useCallback(async (token) => {
    if (!token || statusRef.current === 'approving') return;
    statusRef.current = 'approving';
    setStatus('approving');
    try {
      await api.post(`/shops/qr-login/approve/${token}`);
      statusRef.current = 'success';
      setStatus('success');
      setMessage('Desktop login approved!');
    } catch (err) {
      statusRef.current = 'error';
      setStatus('error');
      setMessage(err.response?.data?.message || 'Approval failed.');
    }
  }, []);

  const handleBarCodeScanned = useCallback(({ data }) => {
    if (statusRef.current !== 'scanning') return;
    const token = extractToken(data);
    if (token) approveToken(token);
  }, [approveToken]);

  const resetScanner = useCallback(() => {
    statusRef.current = 'scanning';
    setStatus('scanning');
    setMessage('Point your camera at the QR code.');
  }, []);

  const renderCamera = () => {
    if (!permission) return <View style={styles.cameraPlaceholder}><ActivityIndicator color={Colors.primary} /></View>;
    if (!permission.granted) {
      return (
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Fix: Only render CameraView when the screen is focused
    if (!isFocused) return <View style={styles.cameraPlaceholder} />;

    return (
      <View style={styles.cameraOuter}>
        <CameraView
          style={styles.cameraPreview}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={status === 'scanning' ? handleBarCodeScanned : undefined}
        />
        
        {/* Overlay Layers */}
        <View style={styles.overlay} pointerEvents="none">
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

        {/* State Indicators */}
        {(status === 'approving' || status === 'success') && (
          <View style={styles.scanningOverlay}>
            {status === 'approving' ? <ActivityIndicator color="#fff" size="large" /> : <MaterialIcons name="check-circle" size={48} color={Colors.green} />}
            <Text style={styles.scanningText}>{status === 'approving' ? 'Approving...' : 'Approved!'}</Text>
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
        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'camera' && styles.modeBtnActive]} onPress={() => { setMode('camera'); resetScanner(); }}>
            <MaterialIcons name="qr-code-scanner" size={16} color={mode === 'camera' ? '#002e69' : Colors.mutedText} />
            <Text style={[styles.modeBtnText, mode === 'camera' && styles.modeBtnTextActive]}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]} onPress={() => setMode('manual')}>
            <MaterialIcons name="keyboard" size={16} color={mode === 'manual' ? '#002e69' : Colors.mutedText} />
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>Enter Token</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.messageBox, status === 'success' && styles.messageBoxSuccess, status === 'error' && styles.messageBoxError]}>
          <Text style={[styles.messageText, status === 'success' && styles.messageTextSuccess, status === 'error' && styles.messageTextError]}>{message}</Text>
        </View>

        {mode === 'camera' ? (
          <>
            {renderCamera()}
            {(status === 'error' || status === 'success') && (
              <TouchableOpacity style={styles.rescanBtn} onPress={resetScanner}>
                <Text style={styles.rescanBtnText}>{status === 'success' ? 'Scan Another' : 'Try Again'}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Paste token..."
              placeholderTextColor={Colors.mutedText}
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveToken(extractToken(manualToken))}>
              <Text style={styles.approveBtnText}>Approve Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 38, height: 38, backgroundColor: Colors.cardDark, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  scroll: { padding: 20 },
  modeToggle: { flexDirection: 'row', backgroundColor: Colors.cardDark, borderRadius: 14, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 10 },
  modeBtnActive: { backgroundColor: Colors.lightBlue },
  modeBtnText: { color: Colors.mutedText, fontWeight: '700' },
  modeBtnTextActive: { color: '#002e69' },
  messageBox: { padding: 14, borderRadius: 12, marginBottom: 16, backgroundColor: Colors.cardDark },
  messageBoxSuccess: { backgroundColor: 'rgba(78,222,163,0.1)' },
  messageText: { color: Colors.mutedText, fontSize: 13, textAlign: 'center' },
  cameraOuter: { width: '100%', height: SCANNER_SIZE, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  cameraPreview: { flex: 1, width: '100%', height: '100%' },
  cameraPlaceholder: { width: '100%', height: SCANNER_SIZE, backgroundColor: Colors.cardDark, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: 200 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanBox: { width: 200, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: Colors.primary, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  scanningText: { color: '#fff', marginTop: 10, fontWeight: '700' },
  input: { backgroundColor: Colors.cardDark, color: '#fff', padding: 16, borderRadius: 16, marginBottom: 16 },
  approveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  rescanBtn: { marginTop: 10, alignItems: 'center' },
  rescanBtnText: { color: Colors.primary, fontWeight: '700' },
});