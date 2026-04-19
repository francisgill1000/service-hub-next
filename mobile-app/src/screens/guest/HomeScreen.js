import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import WhatsAppSupportButton from '../../components/WhatsAppSupportButton';

function ShopCard({ item, onFavourite, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={item.logo ? { uri: item.logo } : null}
        style={styles.cardImage}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.openBadge, { color: item.is_open ? Colors.green : Colors.orange }]}>
            {item.is_open ? 'Open' : 'Closed'}
          </Text>
          <View style={styles.ratingRow}>
            <TouchableOpacity onPress={() => onFavourite(item.id)}>
              <Ionicons
                name={item.is_favourite ? 'heart' : 'heart-outline'}
                size={22}
                color={item.is_favourite ? Colors.primary : Colors.slateGray}
              />
            </TouchableOpacity>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.shopName}>{item.name}</Text>
        {!!item.shop_code && (
          <View style={styles.shopCodePill}>
            <MaterialIcons name="tag" size={11} color={Colors.primary} />
            <Text style={styles.shopCodeText}>{item.shop_code}</Text>
          </View>
        )}
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{item.location}</Text>
          {!!item.distance && <Text style={styles.distanceText}>{item.distance}</Text>}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.hoursText}>
            {item.today_working_hours?.start_time} - {item.today_working_hours?.end_time}
          </Text>
          <TouchableOpacity style={styles.bookBtn} onPress={onPress}>
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops(1, searchTerm);
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchShops(currentPage + 1, searchTerm);
    }
  };

  const toggleFavourite = async (shopId) => {
    await api.post(`/shops/${shopId}/favourite`);
    fetchShops(currentPage, searchTerm);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rezzy</Text>
          {/* <Text style={styles.poweredBy}>powered by Eloquent</Text> */}
        </View>
        <WhatsAppSupportButton />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={22} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.mutedText}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ShopCard
            item={item}
            onFavourite={toggleFavourite}
            onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading && shops.length > 0 ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={Colors.slateGray} />
              <Text style={styles.emptyText}>No results found{searchTerm ? ` for "${searchTerm}"` : ''}</Text>
            </View>
          ) : (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  poweredBy: { fontSize: 9, color: Colors.mutedText, fontWeight: '600', letterSpacing: 1, marginTop: 1 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardDark, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    height: 52, paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 15 },
  clearBtn: { marginRight: 6 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  card: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.cardDark,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  cardImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: Colors.navyAccent },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  openBadge: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  shopName: { fontSize: 17, fontWeight: '800', color: Colors.white, marginTop: 2 },
  shopCodePill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3,
    backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4,
  },
  shopCodeText: { color: Colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  locationText: { fontSize: 11, color: Colors.slateGray, fontWeight: '600' },
  distanceText: { fontSize: 11, color: Colors.slateGray, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hoursText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  bookBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  bookBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyText: { color: Colors.slateGray, fontSize: 15, fontWeight: '600' },
});
