import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../../theme/colors';
import { useShop } from '../../context/ShopContext';
import { storage } from '../../utils/storage';
import api from '../../utils/api';

export default function LoginScreen({ navigation }) {
  const { loginShop } = useShop();
  const [shopCode, setShopCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState('code');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

  useEffect(() => {
    (async () => {
      // Check biometric support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const biometric = compatible && enrolled;
      setBiometricAvailable(biometric);

      // Post-reset prefill (from ForgotPinScreen) takes priority over remembered creds
      const prefill = await storage.getItem('post_reset_login_prefill');
      if (prefill) {
        try {
          const obj = JSON.parse(prefill);
          if (obj.shopCode) setShopCode(obj.shopCode);
          if (obj.pin) { setPin(obj.pin); setStep('pin'); }
        } catch {}
        await storage.removeItem('post_reset_login_prefill');
        return;
      }

      // Load saved credentials
      const remembered = await storage.getItem('remember_shop_login');
      if (remembered === 'true') {
        setRememberMe(true);
        const code = await storage.getItem('remember_shop_code') || '';
        const savedPin = await storage.getItem('remember_shop_pin') || '';
        if (biometric && savedPin) {
          // Don't pre-fill — require fingerprint to unlock
          setShopCode(code);
          setHasSavedCredentials(true);
          setStep('pin');
        } else {
          // No biometric — pre-fill as before
          setShopCode(code);
          setPin(savedPin);
          if (savedPin) setStep('pin');
        }
      }
    })();
  }, []);

  // Auto-prompt biometric when PIN step loads with saved credentials
  useEffect(() => {
    if (biometricAvailable && hasSavedCredentials && step === 'pin') {
      handleBiometricLogin();
    }
  }, [biometricAvailable, hasSavedCredentials, step]);

  const doLogin = async (code, userPin) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('shops/login', { shop_code: code, pin: userPin });
      if (res.data.token && res.data.shop) {
        const shouldSave = biometricAvailable || rememberMe;
        if (shouldSave) {
          await storage.setItem('remember_shop_login', 'true');
          await storage.setItem('remember_shop_code', code);
          await storage.setItem('remember_shop_pin', userPin);
        } else {
          await storage.removeItem('remember_shop_login');
          await storage.removeItem('remember_shop_code');
          await storage.removeItem('remember_shop_pin');
        }
        await loginShop(res.data.shop, res.data.token);
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Rezzy',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        const code = await storage.getItem('remember_shop_code');
        const savedPin = await storage.getItem('remember_shop_pin');
        if (code && savedPin) {
          await doLogin(code, savedPin);
        }
      }
    } catch {
      // User cancelled or biometric failed — they can use PIN instead
    }
  }, [rememberMe]);

  const handleContinue = () => {
    if (!shopCode.trim()) { setError('Please enter your business ID.'); return; }
    setError('');
    setStep('pin');
  };

  const handleLogin = () => doLogin(shopCode, pin);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.iconCircle}>
            <MaterialIcons name="vpn-key" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.smallLabel}>Rezzy</Text>
          <Text style={styles.poweredByLogin}>powered by Eloquent</Text>
          <Text style={styles.title}>
            {step === 'code' ? 'Enter your Business ID' : 'Enter your PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'code'
              ? 'Use your business code to continue.'
              : 'Verify your PIN to access the dashboard.'}
          </Text>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          {step === 'code' ? (
            <>
              <Text style={styles.inputLabel}>Business ID</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="vpn-key" size={20} color={Colors.mutedText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter business code"
                  placeholderTextColor={Colors.mutedText}
                  value={shopCode}
                  onChangeText={(v) => { setShopCode(v); setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('code'); setError(''); }}>
                <Ionicons name="chevron-back" size={14} color={Colors.mutedText} />
                <Text style={styles.backBtnText}>Change Business ID</Text>
              </TouchableOpacity>

              <View style={styles.shopIdBox}>
                <Text style={styles.shopIdLabel}>Current Business ID</Text>
                <Text style={styles.shopIdValue}>{shopCode}</Text>
              </View>

              <Text style={styles.inputLabel}>PIN</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="lock" size={20} color={Colors.mutedText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your PIN"
                  placeholderTextColor={Colors.mutedText}
                  value={pin}
                  onChangeText={(v) => { setPin(v); setError(''); }}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                />
                <TouchableOpacity onPress={() => setShowPin(v => !v)} style={styles.showHideBtn}>
                  <Text style={styles.showHideText}>{showPin ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPinBtn}
                onPress={() => navigation.navigate('ForgotPin', { shopCode })}
              >
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>

              {!biometricAvailable && (
                <View style={styles.rememberRow}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ true: Colors.primary, false: Colors.borderDark }}
                    thumbColor={Colors.white}
                  />
                  <Text style={styles.rememberText}>Remember ID & PIN</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Text style={styles.primaryBtnText}>Login</Text>
                      <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
                    </>
                }
              </TouchableOpacity>

              {biometricAvailable && hasSavedCredentials && (
                <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin}>
                  <MaterialIcons name="fingerprint" size={28} color={Colors.primary} />
                  <Text style={styles.biometricBtnText}>Login with Fingerprint</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.createAccount} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.createAccountText}>Don't have a business? Create Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  scroll: { padding: 24, paddingBottom: 48 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  smallLabel: { fontSize: 11, color: Colors.mutedText, textAlign: 'center', letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  poweredByLogin: { fontSize: 9, color: Colors.mutedText, textAlign: 'center', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  inputLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    height: 56, paddingHorizontal: 16, marginBottom: 20,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  showHideBtn: { padding: 4 },
  showHideText: { color: Colors.mutedText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  primaryBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtnText: { color: Colors.mutedText, fontSize: 13, fontWeight: '600' },
  shopIdBox: {
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  shopIdLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  shopIdValue: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  rememberText: { color: Colors.mutedText, fontSize: 13 },
  forgotPinBtn: { alignSelf: 'flex-end', marginBottom: 16, paddingVertical: 4 },
  forgotPinText: { color: Colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 20, paddingVertical: 16,
    backgroundColor: 'rgba(0,122,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    borderRadius: 16,
  },
  biometricBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  createAccount: { marginTop: 40, alignItems: 'center' },
  createAccountText: { color: Colors.mutedText, fontSize: 14, fontWeight: '600' },
});
