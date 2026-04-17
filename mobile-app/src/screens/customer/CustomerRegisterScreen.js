import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useCustomer } from '../../context/CustomerContext';

export default function CustomerRegisterScreen({ navigation }) {
  const { loginCustomer } = useCustomer();
  const [form, setForm] = useState({ name: '', phone: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.phone.trim()) { setError('Mobile number is required.'); return; }
    if (!form.password) { setError('Password is required.'); return; }
    if (form.password.length < 5) { setError('Password must be at least 5 characters.'); return; }
    if (form.password !== form.password_confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/register', form);
      if (res.data?.token && res.data?.user) {
        await loginCustomer(res.data.user, res.data.token);
        navigation.goBack();
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <MaterialIcons name="person-add" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.brandName}>Rezzy</Text>
          <Text style={styles.poweredBy}>powered by Eloquent</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to track your bookings and manage favourites.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {[
            { key: 'name', label: 'Full Name', placeholder: 'John Smith', icon: 'person' },
            { key: 'phone', label: 'Mobile Number', placeholder: 'e.g. 0501234567', icon: 'phone', keyboardType: 'phone-pad' },
          ].map(field => (
            <View key={field.key}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name={field.icon} size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.mutedText}
                  value={form[field.key]}
                  onChangeText={(v) => { set(field.key, v); setError(''); }}
                  keyboardType={field.keyboardType}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min 5 characters"
              placeholderTextColor={Colors.mutedText}
              value={form.password}
              onChangeText={(v) => { set('password', v); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock-outline" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Repeat password"
              placeholderTextColor={Colors.mutedText}
              value={form.password_confirmation}
              onChangeText={(v) => { set('password_confirmation', v); setError(''); }}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.primary }}>Sign In</Text></Text>
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
  primaryBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { color: Colors.mutedText, fontSize: 14 },
});
