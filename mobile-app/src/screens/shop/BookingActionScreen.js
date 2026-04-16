import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

const STATUS_COLORS = { Booked: Colors.primary, Completed: Colors.green, Cancelled: Colors.slateGray };
const STATUS_OPTIONS = ['Booked', 'Completed', 'Cancelled'];

export default function BookingActionScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`/booking/${bookingId}`)
      .then(res => setBooking(res.data?.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.put(`/booking/${bookingId}`, { status });
      setBooking(b => ({ ...b, status }));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const confirmStatusChange = (status) => {
    Alert.alert(`Mark as ${status}`, `Are you sure you want to mark this booking as "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(status) },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: Colors.mutedText }}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = String(booking.status || 'Booked');
  const statusColor = STATUS_COLORS[status] || Colors.primary;
  const customerName = booking.customer?.name || booking.customer_name || 'Guest';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.mutedText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Action</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusColor}20` }]}>
            <MaterialIcons
              name={status === 'Completed' ? 'task-alt' : status === 'Cancelled' ? 'cancel' : 'event-available'}
              size={28}
              color={statusColor}
            />
          </View>
          <View>
            <Text style={styles.refText}>#{booking.booking_reference || `BK${String(booking.id).padStart(5, '0')}`}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitials}>
              {customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerSub}>Customer</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <Text style={styles.cardSectionLabel}>Appointment Details</Text>
          {[
            { label: 'Date', value: booking.show_date || booking.date },
            { label: 'Time', value: booking.start_time ? `${booking.start_time}${booking.end_time ? ` – ${booking.end_time}` : ''}` : 'TBD' },
            { label: 'Total', value: `AED ${Number(booking.charges || 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Services */}
        {booking.services?.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.cardSectionLabel}>Services</Text>
            {booking.services.map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{s.title || s.name}</Text>
                <Text style={styles.servicePrice}>AED {parseFloat(s.price || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardSectionLabel}>Update Status</Text>
          <View style={styles.actionButtons}>
            {STATUS_OPTIONS.filter(s => s !== status).map(s => {
              const color = STATUS_COLORS[s] || Colors.primary;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.actionBtn, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}
                  onPress={() => confirmStatusChange(s)}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={color} />
                  ) : (
                    <Text style={[styles.actionBtnText, { color }]}>
                      {s === 'Completed' ? 'Mark Complete' : s === 'Cancelled' ? 'Cancel Booking' : 'Restore Booking'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  center: { flex: 1, backgroundColor: Colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, backgroundColor: Colors.cardDark, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  backText: { color: Colors.mutedText, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14,
  },
  statusIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  refText: { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  customerAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.navyAccent, alignItems: 'center', justifyContent: 'center',
  },
  customerInitials: { color: Colors.lightBlue, fontWeight: '800', fontSize: 16 },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.white },
  customerSub: { fontSize: 12, color: Colors.mutedText, marginTop: 2 },
  detailCard: {
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  cardSectionLabel: { fontSize: 11, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  detailLabel: { color: Colors.mutedText, fontSize: 13 },
  detailValue: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  serviceName: { color: Colors.textSecondary, fontSize: 13 },
  servicePrice: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  actionsCard: {
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  actionButtons: { gap: 10 },
  actionBtn: { height: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
