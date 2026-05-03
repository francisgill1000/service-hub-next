import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useShop } from '../../context/ShopContext';

const STATUS_COLORS = {
  booked: Colors.primary,
  queued: Colors.orange,
  completed: Colors.green,
  cancelled: Colors.slateGray,
};

const STATUS_FILTERS = ['All', 'Queued', 'Booked', 'Completed', 'Cancelled'];

export default function ShopBookingsScreen() {
  const navigation = useNavigation();
  const { shop } = useShop();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/shop/bookings', { params: { shop_id: shop?.id } });
      setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBookings(); }, [shop?.id]));

  const filtered = bookings.filter(b => {
    const matchFilter = activeFilter === 'All' || String(b.status).toLowerCase() === activeFilter.toLowerCase();
    const matchSearch = !search || (b.customer?.name || b.customer_name || '').toLowerCase().includes(search.toLowerCase()) || (b.booking_reference || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const renderItem = ({ item }) => {
    const status = String(item.status || 'Booked');
    const color = STATUS_COLORS[status.toLowerCase()] || Colors.primary;
    const customerName = item.customer?.name || item.customer_name || 'Guest';
    const services = item.services?.map(s => s.title || s.name).join(', ') || 'Service';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingAction', { bookingId: item.id })}
        activeOpacity={0.85}
      >
        <View style={[styles.dateBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.dateDay, { color }]}>
            {item.date ? new Date(`${item.date}T00:00:00`).getDate() : '--'}
          </Text>
          <Text style={[styles.dateMonth, { color }]}>
            {item.date ? new Date(`${item.date}T00:00:00`).toLocaleString('en-US', { month: 'short' }) : '---'}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${color}18` }]}>
              <Text style={[styles.statusText, { color }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.servicesText} numberOfLines={1}>{services}</Text>
          {item.staff?.name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MaterialIcons name="person" size={11} color={Colors.lightBlue} />
              <Text style={{ color: Colors.lightBlue, fontSize: 11, fontWeight: '600' }}>{item.staff.name}</Text>
            </View>
          ) : item.staff_id == null && status.toLowerCase() === 'queued' ? (
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: `${Colors.orange}33` }}>
                <Text style={{ color: Colors.orange, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>Waiting — no staff</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.bottomRow}>
            {!!item.start_time && (
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={Colors.mutedText} />
                <Text style={styles.timeText}>{item.start_time}</Text>
              </View>
            )}
            <Text style={styles.priceText}>AED {item.charges || 0}</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.slateGray} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.countBadge}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={Colors.mutedText} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or reference..."
          placeholderTextColor={Colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="event-note" size={48} color={Colors.slateGray} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  countBadge: { backgroundColor: Colors.navyAccent, color: Colors.mutedText, fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, height: 46, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.slateGray, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10,
  },
  dateBadge: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 18, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 14, fontWeight: '700', color: Colors.white },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  servicesText: { fontSize: 12, color: Colors.mutedText, marginTop: 3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: Colors.mutedText },
  priceText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyText: { color: Colors.slateGray, fontSize: 14, fontWeight: '600' },
});
