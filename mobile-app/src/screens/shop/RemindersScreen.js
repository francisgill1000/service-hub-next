import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { useShop } from '../../context/ShopContext';

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function tomorrowLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
}

function buildMessage(booking, shopName) {
  const time = booking.start_time ? booking.start_time.toString().slice(0, 5) : '';
  const customer = booking.customer_name || 'there';
  const services = booking.services?.length
    ? booking.services.map(s => s.title || s.name).join(', ')
    : null;
  const lines = [
    `Hi ${customer}!`,
    `Friendly reminder: your appointment at ${shopName || 'us'} is tomorrow at ${time || 'your booked time'}.`,
  ];
  if (services) lines.push(`Service: ${services}`);
  lines.push(`Booking ref: ${booking.booking_reference || ''}`);
  lines.push('See you then!');
  return lines.join('\n');
}

export default function RemindersScreen() {
  const { shop } = useShop();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const tomorrow = useMemo(() => tomorrowISO(), []);
  const label = useMemo(() => tomorrowLabel(), []);

  const fetchBookings = async () => {
    if (!shop?.id) return;
    try {
      const { data } = await api.get('/shop/bookings', { params: { shop_id: shop.id } });
      const all = data?.data || [];
      setBookings(
        all.filter(b => {
          const date = String(b.date || b.booking_date || '').slice(0, 10);
          const status = String(b.status || '').toLowerCase();
          return date === tomorrow && (status === 'booked' || status === 'queued');
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBookings(); }, [shop?.id]));

  const sendReminder = async (booking) => {
    if (!booking.customer_whatsapp) {
      Alert.alert('No phone number', "This customer doesn't have a phone number on file.");
      return;
    }
    setBusyId(booking.id);
    try {
      const num = String(booking.customer_whatsapp).replace(/\D/g, '');
      const msg = encodeURIComponent(buildMessage(booking, shop?.name));
      const smsBody = (typeof Platform !== 'undefined' && Platform.OS === 'ios')
        ? `sms:${num}&body=${msg}`
        : `sms:${num}?body=${msg}`;
      // Try WhatsApp first, fall back to SMS
      const whatsappUrl = `whatsapp://send?phone=${num}&text=${msg}`;
      const wa = await Linking.canOpenURL(whatsappUrl).catch(() => false);
      const target = wa ? whatsappUrl : smsBody;
      try { await Linking.openURL(target); } catch {}
      // Mark as reminded regardless
      await api.post(`/booking/${booking.id}/mark-reminder-sent`);
      setBookings(arr =>
        arr.map(b => (b.id === booking.id ? { ...b, reminder_sent_at: new Date().toISOString() } : b))
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not mark as reminded.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = bookings.filter(b => !b.reminder_sent_at && b.customer_whatsapp).length;
  const sentCount = bookings.filter(b => b.reminder_sent_at).length;

  const renderItem = ({ item }) => {
    const customerName = item.customer_name || item.customer?.name || 'Guest';
    const initials = customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const services = item.services?.map(s => s.title || s.name).join(', ') || '—';
    const time = item.start_time ? String(item.start_time).slice(0, 5) : '—';
    const reminded = !!item.reminder_sent_at;
    const noPhone = !item.customer_whatsapp;

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{customerName}</Text>
            <Text style={styles.ref}>{item.booking_reference}</Text>
          </View>
          <Text style={styles.services} numberOfLines={1}>{services}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={11} color={Colors.mutedText} />
              <Text style={styles.metaText}>{time}</Text>
            </View>
            {item.customer_whatsapp && (
              <View style={styles.metaItem}>
                <Ionicons name="chatbubble-outline" size={11} color={Colors.green} />
                <Text style={[styles.metaText, { color: Colors.green }]}>{item.customer_whatsapp}</Text>
              </View>
            )}
          </View>
        </View>
        {noPhone ? (
          <View style={[styles.actionPill, { backgroundColor: `${Colors.slateGray}33` }]}>
            <Text style={[styles.actionPillText, { color: Colors.slateGray }]}>No #</Text>
          </View>
        ) : reminded ? (
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: `${Colors.green}22`, borderColor: `${Colors.green}40`, borderWidth: 1 }]}
            onPress={() => sendReminder(item)}
            disabled={busyId === item.id}
          >
            <MaterialIcons name="check" size={14} color={Colors.green} />
            <Text style={[styles.actionPillText, { color: Colors.green }]}>Sent</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: '#25D366' }]}
            onPress={() => sendReminder(item)}
            disabled={busyId === item.id}
          >
            {busyId === item.id ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <MaterialIcons name="send" size={14} color={Colors.white} />
                <Text style={[styles.actionPillText, { color: Colors.white }]}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>Tomorrow · {label}</Text>
        </View>
      </View>

      {/* Counts */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: `${Colors.slateGray}22` }]}>
          <Text style={[styles.statValue, { color: Colors.textSecondary }]}>{bookings.length}</Text>
          <Text style={styles.statLabel}>bookings</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: `${Colors.orange}22` }]}>
          <Text style={[styles.statValue, { color: Colors.orange }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>to send</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: `${Colors.green}22` }]}>
          <Text style={[styles.statValue, { color: Colors.green }]}>{sentCount}</Text>
          <Text style={styles.statLabel}>sent</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={bookings.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="event-available" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No bookings tomorrow.</Text>
              <Text style={styles.emptySub}>Enjoy the day off.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 12, color: Colors.mutedText, marginTop: 2, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  statPill: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardDark, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.navyAccent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.lightBlue, fontWeight: '800', fontSize: 13 },
  cardBody: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: Colors.white, fontSize: 14, fontWeight: '700', flex: 1 },
  ref: { color: Colors.slateGray, fontSize: 9, fontWeight: '700' },
  services: { color: Colors.mutedText, fontSize: 11 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: Colors.mutedText, fontSize: 10, fontWeight: '600' },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, height: 30, borderRadius: 8,
  },
  actionPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { color: Colors.mutedText, fontSize: 14, fontWeight: '600', marginTop: 6 },
  emptySub: { color: Colors.slateGray, fontSize: 12 },
});
