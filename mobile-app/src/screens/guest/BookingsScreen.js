import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import WhatsAppSupportButton from '../../components/WhatsAppSupportButton';

const STATUS_COLORS = {
  booked: Colors.primary,
  completed: Colors.green,
  cancelled: Colors.slateGray,
};

function BookingItem({ item, onPress }) {
  const status = String(item.status || 'Booked').toLowerCase();
  const color = STATUS_COLORS[status] || Colors.primary;
  const customerName = item.customer?.name || item.customer_name || 'Guest';
  const services = item.services?.map(s => s.title || s.name).join(', ') || 'Service';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.dateBadge, { backgroundColor: `${Colors.primary}20` }]}>
        <Text style={[styles.dateDay, { color: Colors.primary }]}>
          {item.date ? new Date(`${item.date}T00:00:00`).getDate() : '--'}
        </Text>
        <Text style={[styles.dateMonth, { color: Colors.primary }]}>
          {item.date ? new Date(`${item.date}T00:00:00`).toLocaleString('en-US', { month: 'short' }) : '---'}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.shop?.name || 'Shop'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.statusText, { color }]}>{item.status || 'Booked'}</Text>
          </View>
        </View>
        <Text style={styles.servicesText} numberOfLines={1}>{services}</Text>
        {!!item.start_time && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={Colors.mutedText} />
            <Text style={styles.timeText}>{item.start_time}</Text>
          </View>
        )}
        <Text style={styles.priceText}>AED {item.charges || 0}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={Colors.slateGray} />
    </TouchableOpacity>
  );
}

export default function BookingsScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBookings(); }, []));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <WhatsAppSupportButton />
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BookingItem item={item} onPress={() => navigation.navigate('BookingView', { bookingId: item.id })} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={56} color={Colors.slateGray} />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptySubtext}>Browse businesses and make your first booking.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.exploreBtnText}>Explore</Text>
              </TouchableOpacity>
            </View>
          ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  dateBadge: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.white, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  servicesText: { fontSize: 12, color: Colors.mutedText, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 11, color: Colors.mutedText },
  priceText: { fontSize: 14, fontWeight: '700', color: Colors.white, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  emptySubtext: { color: Colors.mutedText, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exploreBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: Colors.white, fontWeight: '700' },
});
