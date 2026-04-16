import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useShop } from '../../context/ShopContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

function TimeSelector({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timeSelectorWrapper}>
      <Text style={styles.timeSelectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeSelectorBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.timeSelectorValue}>{value || '--:--'}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={18} color={Colors.mutedText} />
      </TouchableOpacity>
      {open && (
        <View style={styles.timeDropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeOption, value === t && styles.timeOptionActive]}
                onPress={() => { onChange(t); setOpen(false); }}
              >
                <Text style={[styles.timeOptionText, value === t && styles.timeOptionTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function WorkingHoursScreen() {
  const { shop, token, loginShop } = useShop();
  const [hours, setHours] = useState(
    DAYS.map((day, i) => ({ day, day_of_week: i + 1, is_open: true, start_time: '09:00', end_time: '18:00' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = shop?.working_hours || [];
    if (data.length > 0) {
      setHours(DAYS.map((day, i) => {
        const dayNum = i + 1;
        const found = data.find(d =>
          d.day_of_week === dayNum ||
          d.day?.toLowerCase() === day.toLowerCase()
        );
        if (found) {
          return {
            day,
            day_of_week: dayNum,
            is_open: true,
            start_time: found.start_time || '09:00',
            end_time: found.end_time || '18:00',
          };
        }
        return { day, day_of_week: dayNum, is_open: false, start_time: '09:00', end_time: '18:00' };
      }));
    }
    setLoading(false);
  }, [shop]);

  const updateDay = (index, key, value) => {
    setHours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!shop?.id) return;
    setSaving(true);
    try {
      const working_hours = hours
        .filter(h => h.is_open)
        .map(h => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
          slot_duration: 30,
        }));

      const res = await api.put(`/shops/${shop.id}`, { working_hours });
      const updated = res.data?.shop || res.data?.data;
      if (updated && token) {
        await loginShop(updated, token);
      }
      Alert.alert('Success', 'Working hours updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save working hours.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Working Hours</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Set your open and close times for each day.</Text>
        {hours.map((h, i) => (
          <View key={h.day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayName, !h.is_open && styles.dayNameClosed]}>{h.day}</Text>
              <View style={styles.dayToggle}>
                <Text style={[styles.openLabel, { color: h.is_open ? Colors.green : Colors.slateGray }]}>
                  {h.is_open ? 'Open' : 'Closed'}
                </Text>
                <Switch
                  value={h.is_open}
                  onValueChange={(v) => updateDay(i, 'is_open', v)}
                  trackColor={{ true: Colors.green, false: Colors.borderDark }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
            {h.is_open && (
              <View style={styles.timePickers}>
                <TimeSelector
                  label="Opens"
                  value={h.start_time}
                  onChange={(v) => updateDay(i, 'start_time', v)}
                />
                <MaterialIcons name="arrow-forward" size={18} color={Colors.slateGray} style={{ marginTop: 28 }} />
                <TimeSelector
                  label="Closes"
                  value={h.end_time}
                  onChange={(v) => updateDay(i, 'end_time', v)}
                />
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Working Hours</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  center: { flex: 1, backgroundColor: Colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  subtitle: { color: Colors.mutedText, fontSize: 13, marginBottom: 20 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  dayCard: {
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: 15, fontWeight: '700', color: Colors.white },
  dayNameClosed: { color: Colors.slateGray },
  dayToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  openLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  timePickers: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  timeSelectorWrapper: { flex: 1 },
  timeSelectorLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  timeSelectorBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.navyAccent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timeSelectorValue: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  timeDropdown: {
    position: 'absolute', top: 68, left: 0, right: 0, zIndex: 999,
    backgroundColor: Colors.darkCard2, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
  },
  timeOption: { paddingHorizontal: 14, paddingVertical: 10 },
  timeOptionActive: { backgroundColor: Colors.primary },
  timeOptionText: { color: Colors.textSecondary, fontSize: 13 },
  timeOptionTextActive: { color: Colors.white, fontWeight: '700' },
  saveBtn: { height: 56, backgroundColor: Colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
