import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

export default function CatalogEditScreen({ route, navigation }) {
  const { catalogId } = route.params;
  const isNew = !catalogId;

  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      api.get(`/shop/catalogs/${catalogId}`)
        .then(res => {
          const d = res.data?.data || res.data;
          setForm({
            title: d.title || d.name || '',
            description: d.description || '',
            price: String(d.price || ''),
          });
          if (d.image) setImagePreview(d.image);
        })
        .catch(() => Alert.alert('Error', 'Failed to load service.'))
        .finally(() => setLoading(false));
    }
  }, [catalogId]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const base64 = `data:image/jpeg;base64,${res.assets[0].base64}`;
      setImageBase64(base64);
      setImagePreview(base64);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please enter a service title.'); return; }
    if (!form.description.trim()) { setError('Please enter a service description.'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError('Please enter a valid price.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price,
      };
      if (imageBase64) payload.image = imageBase64;

      if (isNew) {
        await api.post('/shop/catalogs', payload);
      } else {
        await api.put(`/shop/catalogs/${catalogId}`, payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.lightBlue} size="large" />
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'Add Service' : 'Edit Service'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Image Upload */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imagePreview ? (
              <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.imagePlaceholderIcon}>
                  <MaterialIcons name="image" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.imagePlaceholderTitle}>Upload Service Image</Text>
                <Text style={styles.imagePlaceholderHint}>PNG, JPG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Service Title */}
          <Text style={styles.inputLabel}>Service Title</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Full House Plumbing Check"
              placeholderTextColor={Colors.mutedText}
              value={form.title}
              onChangeText={(v) => { setForm(f => ({ ...f, title: v })); setError(''); }}
              editable={!saving}
            />
          </View>

          {/* Description */}
          <Text style={styles.inputLabel}>Description</Text>
          <View style={[styles.inputRow, styles.inputRowMulti]}>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Describe what's included in this service..."
              placeholderTextColor={Colors.mutedText}
              value={form.description}
              onChangeText={(v) => { setForm(f => ({ ...f, description: v })); setError(''); }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* Price */}
          <Text style={styles.inputLabel}>Price (AED)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>AED</Text>
            <TextInput
              style={[styles.input, { fontWeight: '600' }]}
              placeholder="0.00"
              placeholderTextColor={Colors.mutedText}
              value={form.price}
              onChangeText={(v) => { setForm(f => ({ ...f, price: v })); setError(''); }}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>

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
                <Text style={styles.saveBtnText}>{isNew ? 'Save Catalog' : 'Update Service'}</Text>
                <MaterialIcons name="check-circle" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B121B' },
  center: { flex: 1, backgroundColor: '#0B121B', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.slateGray, fontSize: 13, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  scroll: { padding: 20, paddingBottom: 48 },

  // Image
  imagePicker: {
    width: '100%', aspectRatio: 1, borderRadius: 20,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden', marginBottom: 28,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  imagePlaceholderIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,122,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholderTitle: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  imagePlaceholderHint: { color: Colors.slateGray, fontSize: 12 },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 20,
  },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },

  // Inputs
  inputLabel: { fontSize: 13, color: Colors.slateGray, fontWeight: '500', marginBottom: 8, marginLeft: 2 },
  inputRow: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    height: 48, paddingHorizontal: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center',
  },
  inputRowMulti: { height: 120, alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  inputMulti: { height: 96, textAlignVertical: 'top' },
  currency: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginRight: 10 },

  // Save
  saveBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
