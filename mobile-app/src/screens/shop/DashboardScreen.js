import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useShop } from '../../context/ShopContext';
import { useNavigation } from '@react-navigation/native';

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <View style={styles.statCardTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const d = new Date(`1970-01-01T${t}`);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return timeStr; }
}

function formatDayMonth(dateStr) {
  if (!dateStr) return { day: '--', month: '---' };
  const d = new Date(`${dateStr}T00:00:00`);
  return { day: d.getDate(), month: d.toLocaleString('en-US', { month: 'short' }) };
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { shop, logoutShop } = useShop();
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/shop/bookings', { params: { shop_id: shop?.id } });
      const data = res.data || {};
      const list = Array.isArray(data.data) ? data.data : [];
      const rev = list.reduce((s, b) => s + Number(b?.charges || 0), 0);
      setBookings(list);
      setTotalBookings(data.total_bookings ?? list.length);
      setTotalRevenue(data.total_revenue ?? rev);
    } catch {
      setBookings([]);
      setTotalBookings(0);
      setTotalRevenue(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (shop?.id) fetchData(); }, [shop?.id]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const tomorrowISO = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  const dateOf = (b) => String(b?.date || b?.booking_date || '').slice(0, 10);
  const todayBookings = bookings.filter(b => dateOf(b) === todayISO);
  const tomorrowBookings = bookings
    .filter(b => {
      const s = String(b.status).toLowerCase();
      return dateOf(b) === tomorrowISO && (s === 'booked' || s === 'queued');
    })
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  const tomorrowPending = tomorrowBookings.filter(b => !b.reminder_sent_at && b.customer_whatsapp).length;
  const completedCount = bookings.filter(b => String(b.status).toLowerCase() === 'completed').length;

  const upcomingBookings = bookings
    .filter(b => b.date >= todayISO && String(b.status).toLowerCase() !== 'cancelled')
    .sort((a, b) => {
      if (a.date === b.date) return (a.start_time || '').localeCompare(b.start_time || '');
      return a.date.localeCompare(b.date);
    })
    .slice(0, 5);

  const recentActivity = [...bookings]
    .sort((a, b) => ((b.updated_at || b.created_at || b.date || '') > (a.updated_at || a.created_at || a.date || '') ? 1 : -1))
    .slice(0, 5);

  const handleLogout = async () => {
    await logoutShop();
    // AppNavigator automatically switches to Guest stack when shop becomes null
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{shop?.is_open ? '● Open Now' : '● Closed'}</Text>
          <Text style={styles.headerTitle}>{shop?.name || 'Dashboard'}</Text>
          {/* <Text style={styles.poweredBy}>Rezzy — powered by Eloquent</Text> */}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={22} color={Colors.slateGray} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <StatCard
            label="Total Bookings"
            value={totalBookings !== null ? String(totalBookings) : '—'}
            icon="calendar-today"
            color={Colors.lightBlue}
          />
          <StatCard
            label="Total Revenue"
            value={totalRevenue !== null ? `AED ${Number(totalRevenue).toLocaleString()}` : '—'}
            icon="payments"
            color={Colors.green}
          />
        </View>
        <View style={[styles.kpiRow, { marginTop: 10 }]}>
          <StatCard label="Today" value={String(todayBookings.length)} icon="today" color={Colors.lightBlue} />
          <StatCard label="Completed" value={String(completedCount)} icon="task-alt" color={Colors.green} />
        </View>

        {/* Tomorrow's Reminders card */}
        <TouchableOpacity
          style={[styles.qrCard, { backgroundColor: `${Colors.orange}11`, borderColor: `${Colors.orange}33` }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <View style={[styles.qrIcon, { backgroundColor: `${Colors.orange}22` }]}>
            <MaterialIcons name="notifications-active" size={22} color={Colors.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.qrTitle}>
              Tomorrow's Reminders · {tomorrowBookings.length}
            </Text>
            <Text style={styles.qrSubtitle}>
              {tomorrowPending > 0
                ? `${tomorrowPending} still need a reminder`
                : tomorrowBookings.length > 0
                  ? 'All reminded · tap to manage'
                  : 'Nothing tomorrow — enjoy the day off'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.slateGray} />
        </TouchableOpacity>

        {/* Scan QR Login shortcut */}
        <TouchableOpacity style={styles.qrCard} onPress={() => navigation.navigate('ScanLogin')}>
          <View style={styles.qrIcon}>
            <MaterialIcons name="qr-code-scanner" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.qrTitle}>Scan QR Login</Text>
            <Text style={styles.qrSubtitle}>Approve desktop login from this app</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.slateGray} />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActions}>
          {[
            { label: 'All Bookings', sub: 'View & manage', icon: 'event-note', nav: 'ShopBookings', color: Colors.lightBlue },
            { label: 'Reminders', sub: "Tomorrow's WhatsApp nudges", icon: 'notifications-active', nav: 'Reminders', color: Colors.orange },
            { label: 'Staff', sub: 'Add & toggle staff', icon: 'people', nav: 'Staff', color: Colors.lightBlue },
            { label: 'Services', sub: 'Add or edit', icon: 'category', nav: 'Services', color: Colors.green },
            { label: 'Working Hours', sub: 'Set open & close', icon: 'schedule', nav: 'Hours', color: Colors.orange },
            { label: 'Business Profile', sub: 'Edit info & images', icon: 'storefront', nav: 'Profile', color: Colors.slateGray },
          ].map(item => (
            <TouchableOpacity
              key={item.nav}
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate(item.nav)}
            >
              <View style={[styles.qaIcon, { backgroundColor: `${item.color}18` }]}>
                <MaterialIcons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.qaLabel}>{item.label}</Text>
                <Text style={styles.qaSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={Colors.slateGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ShopBookings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
        ) : upcomingBookings.length > 0 ? (
          upcomingBookings.map(b => {
            const customerName = b.customer?.name || b.customer_name || 'Guest';
            const services = b.services?.map(s => s.title || s.name).join(', ') || 'Service';
            const { day, month } = formatDayMonth(b.date);
            const time = b.start_time ? formatTime(b.start_time) : (b.show_date || 'TBD');
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('BookingAction', { bookingId: b.id })}
              >
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxMonth}>{month}</Text>
                  <Text style={styles.dateBoxDay}>{day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingCustomer}>{customerName}</Text>
                  <Text style={styles.bookingService} numberOfLines={1}>{services}</Text>
                  <View style={styles.bookingTimeRow}>
                    <Ionicons name="time-outline" size={12} color={Colors.mutedText} />
                    <Text style={styles.bookingTime}>{time}</Text>
                  </View>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amountText}>AED {b.charges || 0}</Text>
                  <MaterialIcons name="chevron-right" size={18} color={Colors.slateGray} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyBookings}>
            <Text style={styles.emptyText}>No upcoming bookings</Text>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {recentActivity.length > 0 ? recentActivity.map(b => {
          const name = b.customer?.name || b.customer_name || 'Guest';
          const status = String(b.status || 'Booked');
          const color = { Completed: Colors.green, Cancelled: Colors.slateGray, Booked: Colors.lightBlue }[status] || Colors.lightBlue;
          const icon = { Completed: 'task-alt', Cancelled: 'cancel', Booked: 'event-available' }[status] || 'event-available';
          return (
            <TouchableOpacity
              key={b.id}
              style={styles.activityRow}
              onPress={() => navigation.navigate('BookingAction', { bookingId: b.id })}
            >
              <View style={[styles.actIcon, { backgroundColor: `${color}18` }]}>
                <MaterialIcons name={icon} size={16} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actName}>{name}</Text>
                <Text style={styles.actStatus}>{status} · {b.show_date || b.date || '—'}</Text>
              </View>
              <Text style={styles.actAmount}>AED {b.charges || 0}</Text>
            </TouchableOpacity>
          );
        }) : (
          <View style={styles.emptyBookings}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerSub: { fontSize: 11, color: Colors.slateGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginTop: 2 },
  poweredBy: { fontSize: 9, color: Colors.slateGray, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  logoutBtn: { padding: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: `${Colors.border}33`,
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 10, color: Colors.slateGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.white },
  qrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: `${Colors.border}33`, marginTop: 16,
  },
  qrIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(0,122,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  qrTitle: { fontSize: 14, fontWeight: '700', color: Colors.white },
  qrSubtitle: { fontSize: 11, color: Colors.slateGray, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.white },
  seeAll: { fontSize: 12, fontWeight: '700', color: Colors.lightBlue, textTransform: 'uppercase', letterSpacing: 1 },
  quickActions: {
    backgroundColor: Colors.darkCard, borderRadius: 14,
    borderWidth: 1, borderColor: `${Colors.border}33`, overflow: 'hidden',
  },
  quickActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: `${Colors.border}22`,
  },
  qaIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 13, fontWeight: '700', color: Colors.white },
  qaSub: { fontSize: 11, color: Colors.slateGray, marginTop: 1 },
  bookingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.darkCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: `${Colors.border}33`, marginBottom: 8,
  },
  dateBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  dateBoxMonth: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  dateBoxDay: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  bookingCustomer: { fontSize: 14, fontWeight: '700', color: Colors.white },
  bookingService: { fontSize: 12, color: Colors.mutedText, marginTop: 2 },
  bookingTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bookingTime: { fontSize: 11, color: Colors.mutedText },
  amountBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  emptyBookings: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: Colors.slateGray, fontSize: 13, fontWeight: '600' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: `${Colors.border}22` },
  actIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  actStatus: { fontSize: 11, color: Colors.slateGray, marginTop: 2 },
  actAmount: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
});
