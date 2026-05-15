import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateDates(count = 31) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatLocalDate(d) {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ShopDetailScreen({ route, navigation }) {
  const { shopId } = route.params;
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeServices, setActiveServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const dates = generateDates(31);

  useEffect(() => {
    fetchShop();
  }, [selectedDate]);

  const fetchShop = async () => {
    try {
      const res = await api.get(`/shops/${shopId}`, { params: { date: formatLocalDate(selectedDate) } });
      const data = res.data.data || res.data;
      if (data && !Array.isArray(data.catalogs)) data.catalogs = [];
      setShop(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id) => {
    setActiveServices(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalPrice = activeServices.reduce((sum, id) => {
    const s = shop?.catalogs?.find(c => c.id === id);
    return sum + (s ? parseFloat(s.price) : 0);
  }, 0);

  const handleBooking = async () => {
    if (booking) return;
    setBooking(true);
    setErrorMessage(null);
    try {
      const res = await api.post(`/shops/${shop.id}/book`, {
        date: formatLocalDate(selectedDate),
        start_time: selectedTime,
        charges: totalPrice,
        services: activeServices.map(id => {
          const s = shop?.catalogs?.find(c => c.id === id);
          if (!s) return null;
          const { image, ...rest } = s;
          return rest;
        }).filter(Boolean),
      });
      const bookingId = res.data?.data?.id || res.data?.id;
      navigation.navigate('BookingView', { bookingId });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.white }}>Business not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: shop.hero_image || shop.logo }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={['top']} style={styles.heroTop}>
            <TouchableOpacity style={styles.backBtnHero} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heartBtnHero} onPress={() => api.post(`/shops/${shop.id}/favourite`)}>
              <Ionicons name="heart-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroInfo}>
            {shop.logo ? (
              <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
            ) : null}
            <View>
              <Text style={[styles.openText, { color: shop.is_open ? Colors.green : Colors.orange }]}>
                {shop.is_open ? 'Open Now' : 'Closed'}
              </Text>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopLocation}>{shop.location}</Text>
            </View>
          </View>
        </View>

        {/* Catalog */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Catalog</Text>
          {shop.catalogs?.length > 0 ? shop.catalogs.map(item => {
            const isActive = activeServices.includes(item.id);
            return (
              <View key={item.id} style={[styles.serviceCard, isActive && styles.serviceCardActive]}>
                <View style={styles.serviceImageBox}>
                  {item.image
                    ? <Image source={{ uri: item.image }} style={styles.serviceImage} />
                    : <MaterialIcons name="image" size={28} color={Colors.slateGray} />
                  }
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.title}</Text>
                  {!!item.description && <Text style={styles.serviceDesc}>{item.description}</Text>}
                  <Text style={styles.servicePrice}>AED {parseFloat(item.price).toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, isActive && styles.addBtnActive]}
                  onPress={() => toggleService(item.id)}
                >
                  <MaterialIcons name={isActive ? 'check' : 'add'} size={22} color={Colors.white} />
                </TouchableOpacity>
              </View>
            );
          }) : <Text style={styles.noContent}>No services available</Text>}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Appointment Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {dates.map(date => {
                const isActive = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={date.toDateString()}
                    style={[styles.dateBtn, isActive && styles.dateBtnActive, isToday && !isActive && styles.dateBtnToday]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateDayName, isActive && { color: Colors.white }]}>
                      {DAYS[date.getDay()]}
                    </Text>
                    <Text style={[styles.dateDayNum, isActive && { color: Colors.white }]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Slots */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Time Slot</Text>
            {shop.slots?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {shop.slots.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeBtn, selectedTime === time && styles.timeBtnActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeBtnText, selectedTime === time && { color: Colors.white }]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : <Text style={styles.noContent}>No slots available for this date</Text>}
          </View>
        </View>

        {/* Working Hours */}
        {shop.working_hours?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Working Hours</Text>
            <View style={styles.card}>
              {shop.working_hours.map((wh, i) => (
                <View key={i} style={[styles.hoursRow, i > 0 && styles.hoursRowBorder]}>
                  <Text style={styles.hoursDay}>{wh.day}</Text>
                  <Text style={styles.hoursTime}>
                    {wh.start_time} – {wh.end_time}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.stickyBottom}>
        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
        <View style={styles.ctaRow}>
          <View>
            <Text style={styles.ctaLabel}>{activeServices.length} Service{activeServices.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.ctaPrice}>AED {totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              (activeServices.length === 0 || !selectedTime || booking) && styles.ctaBtnDisabled,
            ]}
            onPress={handleBooking}
            disabled={activeServices.length === 0 || !selectedTime || booking}
          >
            {booking ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.ctaBtnText}>Continue Booking</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brandDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.brandDark, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.mutedText, fontSize: 14 },
  // Hero
  hero: { height: 260, position: 'relative', marginBottom: 0 },
  heroImage: { width: '100%', height: '100%', backgroundColor: Colors.navyAccent },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,27,0.6)' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtnHero: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heartBtnHero: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroInfo: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  shopLogo: { width: 60, height: 60, borderRadius: 16, borderWidth: 2, borderColor: Colors.white, backgroundColor: Colors.navyAccent },
  openText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  shopName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginTop: 2 },
  shopLocation: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  // Sections
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 12 },
  noContent: { color: Colors.mutedText, fontSize: 13, paddingVertical: 16, textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  cardLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  // Services
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, marginBottom: 10,
  },
  serviceCardActive: { borderColor: 'rgba(0,122,255,0.5)', backgroundColor: 'rgba(0,122,255,0.05)' },
  serviceImageBox: {
    width: 76, height: 76, borderRadius: 12,
    backgroundColor: Colors.navyAccent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  serviceImage: { width: 76, height: 76 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700', color: Colors.white },
  serviceDesc: { fontSize: 11, color: Colors.mutedText, marginTop: 2 },
  servicePrice: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.navyAccent, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  addBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  // Date picker
  dateBtn: {
    width: 64, paddingVertical: 12, borderRadius: 16, alignItems: 'center', marginRight: 8,
    backgroundColor: Colors.navyAccent, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  dateBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateBtnToday: { borderColor: Colors.primary },
  dateDayName: { fontSize: 11, fontWeight: '600', color: Colors.slateGray, marginBottom: 4 },
  dateDayNum: { fontSize: 18, fontWeight: '800', color: Colors.white },
  // Time slots
  timeBtn: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginRight: 8,
    backgroundColor: Colors.navyAccent, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  timeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.slateGray },
  // Working hours
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  hoursRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  hoursDay: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  hoursTime: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  // Sticky bottom
  stickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,15,24,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 10, marginBottom: 12,
  },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  ctaLabel: { fontSize: 10, color: Colors.mutedText, fontWeight: '700', textTransform: 'uppercase' },
  ctaPrice: { fontSize: 22, fontWeight: '800', color: Colors.white },
  ctaBtn: {
    flex: 1, height: 56, backgroundColor: Colors.primary, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnDisabled: { backgroundColor: Colors.slateGray },
  ctaBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
