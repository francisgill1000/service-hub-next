import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useShop } from '../../context/ShopContext';

export default function ProfileScreen() {
  const { shop, token, loginShop } = useShop();
  const [form, setForm] = useState({
    name: '',
    location: '',
    lat: '',
    lon: '',
    logo: null,
    hero_image: null,
  });
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name || '',
      location: shop.location || '',
      lat: shop.lat ?? '',
      lon: shop.lon ?? '',
      logo: null,
      hero_image: null,
    });
  }, [shop]);

  const hero = shop?.hero_image || shop?.cover_image || shop?.hero || null;
  const logo = shop?.logo || shop?.avatar || null;
  const qrTarget = shop?.id ? `https://eloquentservice.com/detail?id=${shop.id}` : '';

  const pickImage = async (field) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'logo' ? [1, 1] : [16, 9],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setForm(f => ({ ...f, [field]: `data:image/jpeg;base64,${res.assets[0].base64}` }));
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = Number(position.coords.latitude.toFixed(7));
      const longitude = Number(position.coords.longitude.toFixed(7));

      let readableLocation = '';
      try {
        const response = await api.get('/location', {
          params: { lat: latitude, lon: longitude },
        });
        if (response?.data?.address) {
          readableLocation = response.data.address;
        }
      } catch {
        // Reverse geocode failed — use coords only
      }

      setForm(f => ({
        ...f,
        lat: latitude,
        lon: longitude,
        location: readableLocation || f.location,
      }));
    } catch (err) {
      Alert.alert('Location Error', err?.message || 'Unable to fetch your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Business name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        location: form.location,
      };
      if (form.lat !== '') payload.lat = Number(form.lat);
      if (form.lon !== '') payload.lon = Number(form.lon);
      if (form.logo) payload.logo = form.logo;
      if (form.hero_image) payload.hero_image = form.hero_image;

      const res = await api.put(`/shops/${shop.id}`, payload);
      const updated = res.data?.shop || res.data?.data || res.data;
      if (updated?.id) {
        await loginShop(updated, token);
      }
      setForm(f => ({ ...f, logo: null, hero_image: null }));
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareQr = async () => {
    try {
      await Share.share({
        message: `Check out ${shop?.name || 'our shop'} on Rezzy: ${qrTarget}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your shop identity and public information.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero Image */}
          <TouchableOpacity style={styles.heroWrapper} onPress={() => pickImage('hero_image')}>
            {form.hero_image ? (
              <>
                <Image source={{ uri: form.hero_image }} style={styles.heroImage} />
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>Preview</Text>
                </View>
              </>
            ) : hero ? (
              <Image source={{ uri: hero }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.heroEmpty]}>
                <MaterialIcons name="add-photo-alternate" size={32} color={Colors.slateGray} />
                <Text style={styles.heroEmptyText}>Tap to add cover photo</Text>
              </View>
            )}
            <View style={styles.heroGradient} />
            <View style={styles.heroEditBtn}>
              <MaterialIcons name="camera-alt" size={16} color="#002e69" />
            </View>
          </TouchableOpacity>

          {/* Logo */}
          <TouchableOpacity style={styles.logoWrapper} onPress={() => pickImage('logo')}>
            {form.logo ? (
              <Image source={{ uri: form.logo }} style={styles.logoImage} />
            ) : logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoImage, styles.logoEmpty]}>
                <Text style={styles.logoEmptyText}>Logo</Text>
              </View>
            )}
            <View style={styles.logoEditBtn}>
              <MaterialIcons name="camera-alt" size={10} color={Colors.white} />
            </View>
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="storefront" size={20} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter business name"
                placeholderTextColor={Colors.mutedText}
                value={form.name}
                onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
              />
            </View>

            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="location-on" size={20} color={Colors.mutedText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Business address or area"
                placeholderTextColor={Colors.mutedText}
                value={form.location}
                onChangeText={(v) => setForm(f => ({ ...f, location: v }))}
              />
            </View>

            {/* Use Current Location */}
            <TouchableOpacity
              style={[styles.locationBtn, isLocating && styles.locationBtnDisabled]}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
            >
              <MaterialIcons name="my-location" size={18} color={Colors.lightBlue} />
              <Text style={styles.locationBtnText}>
                {isLocating ? 'Fetching location...' : 'Use Current Location'}
              </Text>
              {isLocating && <ActivityIndicator size="small" color={Colors.lightBlue} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>

            {/* Lat/Lon display */}
            {form.lat !== '' && form.lon !== '' && (
              <Text style={styles.coordsText}>
                Lat: {form.lat}, Lon: {form.lon}
              </Text>
            )}
          </View>

          {/* Credentials Section */}
          <View style={styles.credRow}>
            {/* Shop Code */}
            <View style={[styles.credCard, { flex: 1 }]}>
              <Text style={styles.credLabel}>Shop Code</Text>
              <View style={styles.credValueRow}>
                <Text style={styles.credValue}>{shop?.shop_code || '—'}</Text>
                <View style={styles.credIcon}>
                  <MaterialIcons name="tag" size={18} color={Colors.lightBlue} />
                </View>
              </View>
            </View>

            {/* Access PIN */}
            <View style={[styles.credCard, { flex: 1 }]}>
              <Text style={styles.credLabel}>Access PIN</Text>
              <View style={styles.credValueRow}>
                <Text style={styles.credValue}>{shop?.pin || '—'}</Text>
                <View style={styles.credIcon}>
                  <MaterialIcons name="pin" size={18} color={Colors.lightBlue} />
                </View>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          {qrTarget ? (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Shop QR Code</Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrTarget}
                  size={160}
                  color="#000"
                  backgroundColor="#fff"
                />
              </View>
              <Text style={styles.qrHint}>Customers can scan this to find your shop</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareQr}>
                <MaterialIcons name="share" size={16} color={Colors.lightBlue} />
                <Text style={styles.shareBtnText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <MaterialIcons name="save" size={18} color="#002e69" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: 13, color: Colors.slateGray, fontWeight: '600', marginTop: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  // Hero
  heroWrapper: { position: 'relative', marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  heroImage: { width: '100%', height: 170, backgroundColor: Colors.cardDark },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', borderRadius: 16, gap: 8 },
  heroEmptyText: { color: Colors.slateGray, fontSize: 12, fontWeight: '600' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.3)' },
  heroEditBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center',
  },
  previewBadge: {
    position: 'absolute', top: 10, left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  previewBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  // Logo
  logoWrapper: { position: 'relative', alignSelf: 'flex-start', marginLeft: 20, marginTop: -40, marginBottom: 20 },
  logoImage: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.cardDark, borderWidth: 3, borderColor: Colors.brandDark,
  },
  logoEmpty: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,122,255,0.15)',
  },
  logoEmptyText: { color: Colors.lightBlue, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  logoEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.brandDark,
  },

  // Error
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },

  // Section
  section: {
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.white, marginBottom: 16 },

  // Inputs
  inputLabel: { fontSize: 10, color: Colors.slateGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.brandDark, borderWidth: 1,
    borderColor: 'rgba(65,71,85,0.4)', borderRadius: 12,
    height: 50, paddingHorizontal: 14, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.white, fontSize: 14, fontWeight: '600' },

  // Location button
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkCard2, borderWidth: 1, borderColor: 'rgba(65,71,85,0.3)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
  },
  locationBtnDisabled: { opacity: 0.5 },
  locationBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  coordsText: { color: Colors.slateGray, fontSize: 11, fontWeight: '500', marginTop: 4, marginLeft: 2, marginBottom: 4 },

  // Credentials
  credRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  credCard: { backgroundColor: Colors.darkCard, borderRadius: 16, padding: 16 },
  credLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: Colors.slateGray, marginBottom: 10 },
  credValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  credValue: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '900', fontSize: 20, color: Colors.white, letterSpacing: 2 },
  credIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(173,198,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },

  // QR
  qrSection: {
    backgroundColor: Colors.darkCard, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16,
  },
  qrTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: Colors.slateGray, marginBottom: 16 },
  qrWrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  qrHint: { color: Colors.slateGray, fontSize: 12, fontWeight: '500', marginBottom: 12 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkCard2, borderWidth: 1, borderColor: 'rgba(65,71,85,0.3)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20,
  },
  shareBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },

  // Save
  saveBtn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.lightBlue,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#002e69', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
