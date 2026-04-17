import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { storage } from '../../utils/storage';
import api from '../../utils/api';

export default function ForgotPinScreen({ navigation, route }) {
  const [shopCode, setShopCode] = useState(route?.params?.shopCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleReset = async () => {
    if (isSubmitting) return;
    if (!shopCode.trim()) {
      setError('Please enter your Business ID.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('shops/reset-pin', { shop_code: shopCode.trim() });
      if (res.data?.pin) {
        setResult({ shopCode: res.data.shop_code, pin: res.data.pin });
      } else {
        setError('Unable to reset PIN. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset PIN. Please check your Business ID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = async () => {
    if (result) {
      await storage.setItem('post_reset_login_prefill', JSON.stringify({
        shopCode: result.shopCode,
        pin: result.pin,
      }));
    }
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backHeader} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
            <Text style={styles.backHeaderText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <MaterialIcons name="shield" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.smallLabel}>Rezzy</Text>
          <Text style={styles.poweredBy}>powered by Eloquent</Text>

          {!result ? (
            <>
              <Text style={styles.title}>Forgot PIN?</Text>
              <Text style={styles.subtitle}>
                Enter your Business ID and we'll generate a new PIN for your shop.
              </Text>

              {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

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

              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                onPress={handleReset}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <ActivityIndicator color={Colors.white} />
                  : <>
                      <Text style={styles.primaryBtnText}>Reset PIN</Text>
                      <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
                    </>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>New PIN Generated</Text>
              <Text style={styles.subtitle}>Save this PIN somewhere safe. You'll need it to log in.</Text>

              <View style={styles.idBox}>
                <Text style={styles.idLabel}>Business ID</Text>
                <Text style={styles.idValue}>{result.shopCode}</Text>
              </View>

              <View style={styles.pinBox}>
                <Text style={styles.idLabel}>New PIN</Text>
                <View style={styles.pinRow}>
                  <MaterialIcons name="lock" size={18} color={Colors.primary} />
                  <Text style={styles.pinValue}>{result.pin}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={goToLogin}>
                <Text style={styles.primaryBtnText}>Continue to Login</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  scroll: { padding: 24, paddingBottom: 48 },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backHeaderText: { color: Colors.mutedText, fontSize: 14, fontWeight: '600' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
  },
  smallLabel: { fontSize: 11, color: Colors.mutedText, textAlign: 'center', letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  poweredBy: { fontSize: 9, color: Colors.mutedText, textAlign: 'center', fontWeight: '600', letterSpacing: 1, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', marginBottom: 28, lineHeight: 20, paddingHorizontal: 12 },
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
  primaryBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  idBox: {
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  idLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  idValue: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  pinBox: {
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.3)', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  pinValue: { color: Colors.white, fontWeight: '800', fontSize: 28, letterSpacing: 8 },
});
