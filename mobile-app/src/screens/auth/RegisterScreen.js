import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    category_id: 1,
    lat: null,
    lon: null,
    location: '',
    address: '',
    phone: '',
    website: '',
    is_verified: true,
    logo: null,
    hero_image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdShop, setCreatedShop] = useState(null);
  const [gpsScanning, setGpsScanning] = useState(false);
  const [gpsAddress, setGpsAddress] = useState(null);

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const startGpsScan = async () => {
    setGpsScanning(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to detect your position.');
        setGpsScanning(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      try {
        const res = await api.get('/location', { params: { lat: latitude.toFixed(6), lon: longitude.toFixed(6) } });
        const address = res.data?.address || '';
        setGpsAddress(address);
        setForm(f => ({ ...f, lat: parseFloat(res.data.lat), lon: parseFloat(res.data.lon), location: address }));
      } catch {
        // Fallback: use coords directly without address
        setGpsAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setForm(f => ({ ...f, lat: latitude, lon: longitude }));
      }
    } catch {
      setError('Failed to get your location. Please try again.');
    } finally {
      setGpsScanning(false);
    }
  };

  const pickImage = async (key, aspect) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const base64 = `data:image/jpeg;base64,${asset.base64}`;
      handleChange(key, base64);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Business name is required.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/shops', form);
      const shop = res.data?.shop || res.data?.data || res.data;
      setCreatedShop(shop);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setCreatedShop(null);
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.brandName}>Rezzy</Text>
          <Text style={styles.poweredBy}>powered by Eloquent</Text>
          <Text style={styles.title}>Register Your Business</Text>
          <Text style={styles.subtitle}>Tell us about your business to get started.</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* General Information */}
          <Text style={styles.sectionLabel}>General Information</Text>

          <View style={styles.inputRow}>
            <MaterialIcons name="storefront" size={20} color={Colors.mutedText} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              placeholderTextColor={Colors.mutedText}
              value={form.name}
              onChangeText={(v) => { handleChange('name', v); setError(''); }}
              autoCapitalize="words"
            />
          </View>

          {/* Identity & Brand */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Identity & Brand</Text>

          {/* Logo Picker */}
          <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage('logo', [1, 1])}>
            {form.logo ? (
              <Image source={{ uri: form.logo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialIcons name="camera-alt" size={28} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.uploaderLabel}>Business Logo</Text>

          {/* Hero Image Picker */}
          <View style={styles.heroSection}>
            <View style={styles.heroLabelRow}>
              <Text style={styles.uploaderLabel}>Cover Banner</Text>
              <Text style={styles.heroHint}>Recommended: 16:9</Text>
            </View>
            <TouchableOpacity style={styles.heroPicker} onPress={() => pickImage('hero_image', [16, 9])}>
              {form.hero_image ? (
                <Image source={{ uri: form.hero_image }} style={styles.heroPreview} />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <MaterialIcons name="image" size={36} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.heroPlaceholderText}>Select Cover Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Text style={styles.primaryBtnText}>Complete Registration</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
                </>
            }
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By registering, you agree to our Terms and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={!!createdShop} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="check-circle" size={48} color={Colors.green} />
            </View>
            <Text style={styles.modalTitle}>Welcome!</Text>
            <Text style={styles.modalSubtitle}>Your business profile is ready. Save your credentials below.</Text>

            <View style={styles.credBox}>
              <Text style={styles.credLabel}>Business Code</Text>
              <Text style={styles.credValue}>{createdShop?.shop_code}</Text>
            </View>
            <View style={styles.credBox}>
              <Text style={styles.credLabel}>PIN</Text>
              <Text style={styles.credValue}>{createdShop?.pin}</Text>
            </View>

            <Text style={styles.modalNote}>Screenshot or write these down — you need them to log in.</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleModalClose}>
              <Text style={styles.primaryBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  scroll: { padding: 24, paddingBottom: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText: { color: Colors.mutedText, fontSize: 14 },
  brandName: { fontSize: 11, color: Colors.mutedText, textAlign: 'center', letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  poweredBy: { fontSize: 9, color: Colors.mutedText, textAlign: 'center', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  sectionLabel: {
    fontSize: 10, color: Colors.primary, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    height: 56, paddingHorizontal: 16, marginBottom: 16,
  },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  // Logo
  logoPicker: { alignSelf: 'center', marginBottom: 8 },
  logoPreview: { width: 120, height: 120, borderRadius: 24, backgroundColor: Colors.cardDark },
  logoPlaceholder: {
    width: 120, height: 120, borderRadius: 24,
    backgroundColor: Colors.cardDark, borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(0,122,255,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  uploaderLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 24,
  },
  // Hero
  heroSection: { marginBottom: 24 },
  heroLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, paddingHorizontal: 4 },
  heroHint: { fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' },
  heroPicker: {
    height: 176, borderRadius: 20, overflow: 'hidden',
    backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  heroPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  heroPlaceholderText: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 2,
  },
  // Submit
  primaryBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  termsText: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center',
    marginTop: 24, lineHeight: 18, paddingHorizontal: 32,
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.darkCard, borderRadius: 24, padding: 24, width: '100%' },
  modalIcon: { alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', marginBottom: 24 },
  credBox: {
    backgroundColor: Colors.navyAccent, borderRadius: 12, padding: 16,
    marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  credLabel: { color: Colors.mutedText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  credValue: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  modalNote: { color: Colors.mutedText, fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
});
