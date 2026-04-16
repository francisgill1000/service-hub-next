import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useCustomer } from '../../context/CustomerContext';
import { storage } from '../../utils/storage';

export default function CustomerLoginScreen({ navigation }) {
  const { loginCustomer } = useCustomer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
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

      // Load saved credentials
      const remembered = await storage.getItem('remember_customer_login');
      if (remembered === 'true') {
        setRememberMe(true);
        const savedEmail = await storage.getItem('remember_customer_email') || '';
        const savedPassword = await storage.getItem('remember_customer_password') || '';
        if (biometric && savedEmail && savedPassword) {
          // Don't pre-fill — require fingerprint to unlock
          setHasSavedCredentials(true);
        } else {
          // No biometric — pre-fill as before
          setEmail(savedEmail);
          setPassword(savedPassword);
        }
      }
    })();
  }, []);

  // Auto-prompt biometric when saved credentials are available
  useEffect(() => {
    if (biometricAvailable && hasSavedCredentials) {
      handleBiometricLogin();
    }
  }, [biometricAvailable, hasSavedCredentials]);

  const doLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/login', { email: loginEmail.trim(), password: loginPassword });
      if (res.data?.token && res.data?.user) {
        const shouldSave = biometricAvailable || rememberMe;
        if (shouldSave) {
          await storage.setItem('remember_customer_login', 'true');
          await storage.setItem('remember_customer_email', loginEmail.trim());
          await storage.setItem('remember_customer_password', loginPassword);
        } else {
          await storage.removeItem('remember_customer_login');
          await storage.removeItem('remember_customer_email');
          await storage.removeItem('remember_customer_password');
        }
        await loginCustomer(res.data.user, res.data.token);
        navigation.goBack();
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Rezzy',
        cancelLabel: 'Use Password',
        disableDeviceFallback: true,
      });
      if (result.success) {
        const savedEmail = await storage.getItem('remember_customer_email');
        const savedPassword = await storage.getItem('remember_customer_password');
        if (savedEmail && savedPassword) {
          await doLogin(savedEmail, savedPassword);
        }
      }
    } catch {
      // User cancelled or biometric failed — they can use password instead
    }
  }, [rememberMe]);

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    await doLogin(email, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <MaterialIcons name="person" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.brandName}>Rezzy</Text>
          <Text style={styles.poweredBy}>powered by Eloquent</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to view your bookings and favourites.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="email" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.mutedText}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Your password"
              placeholderTextColor={Colors.mutedText}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {!biometricAvailable && (
            <View style={styles.rememberRow}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ true: Colors.primary, false: Colors.borderDark }}
                thumbColor={Colors.white}
              />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Text style={styles.primaryBtnText}>Sign In</Text>
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

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('CustomerRegister')}>
            <Text style={styles.registerLinkText}>Don't have an account? <Text style={{ color: Colors.primary }}>Register</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  scroll: { padding: 24, paddingBottom: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 32 },
  backText: { color: Colors.mutedText, fontSize: 14 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
  },
  brandName: { fontSize: 11, color: Colors.mutedText, textAlign: 'center', letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  poweredBy: { fontSize: 9, color: Colors.mutedText, textAlign: 'center', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  inputLabel: {
    fontSize: 10, color: Colors.mutedText, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    height: 56, paddingHorizontal: 16, marginBottom: 20,
  },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  showHide: { color: Colors.mutedText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  rememberText: { color: Colors.mutedText, fontSize: 13 },
  primaryBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 20, paddingVertical: 16,
    backgroundColor: 'rgba(0,122,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    borderRadius: 16,
  },
  biometricBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerLinkText: { color: Colors.mutedText, fontSize: 14 },
});
