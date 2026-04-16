import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function FavouritesScreen() {
  const navigation = useNavigation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shops', { params: { favourites: 1, per_page: 50 } });
      const all = res.data?.data || res.data || [];
      setShops(all.filter(s => s.is_favourite));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchFavourites(); }, []));

  const removeFavourite = async (shopId) => {
    await api.post(`/shops/${shopId}/favourite`);
    fetchFavourites();
  };

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
          <TouchableOpacity onPress={() => removeFavourite(item.id)}>
            <Ionicons name="heart" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>{item.location}{item.distance ? `  ·  ${item.distance}` : ''}</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Favourites</Text>
        {shops.length > 0 && <Text style={styles.count}>{shops.length}</Text>}
      </View>
      <FlatList
        data={shops}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFavourites(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color={Colors.slateGray} />
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptySubtext}>Tap the heart icon on a business to save it here.</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  count: {
    backgroundColor: Colors.primary, color: Colors.white,
    fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.cardDark,
    borderRadius: 16, padding: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  cardImage: { width: 88, height: 88, borderRadius: 12, backgroundColor: Colors.navyAccent },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.white, marginTop: 2 },
  location: { fontSize: 11, color: Colors.slateGray, fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hours: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  emptySubtext: { color: Colors.mutedText, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exploreBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: Colors.white, fontWeight: '700' },
});
