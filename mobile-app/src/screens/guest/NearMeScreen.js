import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation } from '@react-navigation/native';

export default function NearMeScreen() {
  const navigation = useNavigation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNearbyShops = async () => {
    setLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable it in settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const res = await api.get('/shops/nearby', { params: { lat: latitude, lon: longitude, radius: 10 } });
      setShops(res.data?.data || res.data || []);
    } catch (err) {
      setLocationError('Unable to get your location. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNearbyShops(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchNearbyShops(); };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.logo }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={[styles.badge, { color: item.is_open ? Colors.green : Colors.orange }]}>
            {item.is_open ? 'Open' : 'Closed'}
          </Text>
          {!!item.distance_km && (
            <View style={styles.distanceBadge}>
              <MaterialIcons name="location-on" size={12} color={Colors.primary} />
              <Text style={styles.distanceText}>
                {typeof item.distance_km === 'number' ? item.distance_km.toFixed(1) : item.distance_km} km
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
        <View style={styles.footer}>
          <Text style={styles.hours}>
            {item.today_working_hours?.start_time} – {item.today_working_hours?.end_time}
          </Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
          >
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Near Me</Text>
        <TouchableOpacity onPress={fetchNearbyShops} disabled={loading}>
          <MaterialIcons name="my-location" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {locationError ? (
        <View style={styles.errorState}>
          <MaterialIcons name="location-off" size={56} color={Colors.slateGray} />
          <Text style={styles.errorTitle}>Location Unavailable</Text>
          <Text style={styles.errorSubtitle}>{locationError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNearbyShops}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            !loading && shops.length > 0 ? (
              <Text style={styles.resultCount}>{shops.length} business{shops.length !== 1 ? 'es' : ''} found nearby</Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Finding businesses near you...</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <MaterialIcons name="store" size={48} color={Colors.slateGray} />
                <Text style={styles.emptyText}>No businesses found nearby</Text>
                <Text style={styles.emptySubtext}>Try increasing the search radius</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  resultCount: { color: Colors.slateGray, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  card: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.cardDark,
    borderRadius: 16, padding: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  cardImage: { width: 88, height: 88, borderRadius: 12, backgroundColor: Colors.navyAccent },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  distanceText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '800', color: Colors.white, marginTop: 2 },
  location: { fontSize: 11, color: Colors.slateGray, fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hours: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  loadingState: { alignItems: 'center', paddingTop: 64, gap: 16 },
  loadingText: { color: Colors.mutedText, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyText: { color: Colors.slateGray, fontSize: 15, fontWeight: '600' },
  emptySubtext: { color: Colors.navyMuted, fontSize: 13 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  errorSubtitle: { color: Colors.mutedText, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: Colors.white, fontWeight: '700' },
});
