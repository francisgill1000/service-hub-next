import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

const STATUS_COLORS = {
  booked: Colors.primary,
  completed: Colors.green,
  cancelled: Colors.slateGray,
};

export default function BookingViewScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/booking/${bookingId}`)
      .then(res => setBooking(res.data?.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
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
  const statusColor = STATUS_COLORS[status.toLowerCase()] || Colors.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={Colors.mutedText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success banner */}
        <View style={styles.successBanner}>
          <View style={[styles.successIcon, { backgroundColor: `${statusColor}20` }]}>
            <MaterialIcons
              name={status.toLowerCase() === 'cancelled' ? 'cancel' : 'check-circle'}
              size={40}
              color={statusColor}
            />
          </View>
          <Text style={styles.successTitle}>
            {status.toLowerCase() === 'booked' ? 'Booking Confirmed!' : status}
          </Text>
          <Text style={styles.successRef}>#{booking.booking_reference || `BK${String(booking.id).padStart(5, '0')}`}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{booking.shop?.name || 'Shop'}</Text>
          {!!booking.shop?.location && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={14} color={Colors.mutedText} />
              <Text style={styles.infoText}>{booking.shop.location}</Text>
            </View>
          )}
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Appointment Details</Text>
          {[
            { label: 'Customer', value: booking.customer?.name || booking.customer_name || 'Guest' },
            { label: 'Date', value: booking.show_date || booking.date },
            { label: 'Time', value: booking.start_time ? `${booking.start_time}${booking.end_time ? ` – ${booking.end_time}` : ''}` : 'TBD' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Services */}
        {booking.services?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>Services Booked</Text>
            {booking.services.map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <Text style={styles.serviceRowName}>{s.title || s.name}</Text>
                <Text style={styles.serviceRowPrice}>AED {parseFloat(s.price || 0).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>AED {Number(booking.charges || 0).toFixed(2)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('GuestTabs')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  center: { flex: 1, backgroundColor: Colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  backText: { color: Colors.mutedText, fontSize: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, paddingVertical: 8 },
  scroll: { padding: 16, paddingBottom: 40 },
  successBanner: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  successIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  successRef: { fontSize: 14, color: Colors.mutedText, fontWeight: '600' },
  statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  statusPillText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 8 },
  cardSectionLabel: { fontSize: 11, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { color: Colors.mutedText, fontSize: 13 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  detailLabel: { color: Colors.mutedText, fontSize: 13 },
  detailValue: { color: Colors.white, fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  serviceRowName: { color: Colors.textSecondary, fontSize: 13 },
  serviceRowPrice: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  totalLabel: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  totalValue: { color: Colors.primary, fontWeight: '800', fontSize: 17 },
  homeBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  homeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
