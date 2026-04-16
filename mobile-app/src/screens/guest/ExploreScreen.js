import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation } from '@react-navigation/native';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimeout = React.useRef(null);

  const fetchShops = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const res = await api.get('/shops', { params: { page, per_page: 10, search: search || undefined } });
      const data = res.data;
      if (page === 1) setShops(data.data || []);
      else setShops(prev => [...prev, ...(data.data || [])]);
      setCurrentPage(data.current_page || page);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchShops(1); }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchShops(1, searchTerm), 500);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm]);

  const onRefresh = () => { setRefreshing(true); fetchShops(1, searchTerm); };
  const loadMore = () => { if (currentPage < totalPages && !loading) fetchShops(currentPage + 1, searchTerm); };
  const toggleFavourite = async (shopId) => { await api.post(`/shops/${shopId}/favourite`); fetchShops(currentPage, searchTerm); };

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={() => toggleFavourite(item.id)}>
              <Ionicons
                name={item.is_favourite ? 'heart' : 'heart-outline'}
                size={20}
                color={item.is_favourite ? Colors.primary : Colors.slateGray}
              />
            </TouchableOpacity>
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>Explore</Text>
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color={Colors.primary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services or businesses..."
          placeholderTextColor={Colors.mutedText}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {!!searchTerm && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <MaterialIcons name="close" size={18} color={Colors.mutedText} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={shops}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading && shops.length > 0 ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={48} color={Colors.slateGray} />
              <Text style={styles.emptyText}>No businesses found</Text>
            </View>
          ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    height: 52, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.cardDark, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  cardImage: { width: 88, height: 88, borderRadius: 12, backgroundColor: Colors.navyAccent },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  rating: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.white, marginTop: 2 },
  location: { fontSize: 11, color: Colors.slateGray, fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hours: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyText: { color: Colors.slateGray, fontSize: 15, fontWeight: '600' },
});
