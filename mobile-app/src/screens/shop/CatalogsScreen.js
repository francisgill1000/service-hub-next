import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const CARD_PADDING = 16;

export default function CatalogsScreen() {
  const navigation = useNavigation();
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchCatalogs = async () => {
    try {
      const res = await api.get('/shop/catalogs');
      setCatalogs(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchCatalogs(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete Service?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(id);
          try {
            await api.delete(`/shop/catalogs/${id}`);
            setCatalogs(prev => prev.filter(c => c.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete service.');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.cardImageBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImageEmpty}>
            <MaterialIcons name="image" size={28} color={Colors.border} />
            <Text style={styles.cardImageEmptyText}>No image</Text>
          </View>
        )}
        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>AED {parseFloat(item.price || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('CatalogEdit', { catalogId: item.id })}
        >
          <MaterialIcons name="edit" size={14} color={Colors.lightBlue} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          disabled={deleting === item.id}
        >
          <MaterialIcons
            name={deleting === item.id ? 'more-horiz' : 'delete'}
            size={14}
            color={Colors.red}
          />
          <Text style={styles.deleteBtnText}>{deleting === item.id ? '...' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Service Catalog</Text>
          <Text style={styles.headerSubtitle}>
            {catalogs.length > 0
              ? `${catalogs.length} service${catalogs.length !== 1 ? 's' : ''} listed`
              : 'Manage the services your business offers.'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CatalogEdit', { catalogId: null })}
        >
          <MaterialIcons name="add" size={16} color="#002e69" />
          <Text style={styles.addBtnText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.lightBlue} size="large" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : catalogs.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="category" size={36} color={Colors.slateGray} />
          </View>
          <Text style={styles.emptyTitle}>No Services Yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first service to start accepting bookings from customers.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => navigation.navigate('CatalogEdit', { catalogId: null })}
          >
            <MaterialIcons name="add" size={16} color="#002e69" />
            <Text style={styles.emptyAddBtnText}>Add First Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={catalogs}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCatalogs(); }}
              tintColor={Colors.lightBlue}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d141d' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: CARD_PADDING, paddingTop: 12, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: Colors.slateGray, fontWeight: '600', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.lightBlue, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  addBtnText: { color: '#002e69', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 },

  list: { paddingHorizontal: CARD_PADDING, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: Colors.darkCard, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(65,71,85,0.2)',
    marginBottom: 12, overflow: 'hidden',
  },
  cardImageBox: { width: '100%', height: 160, backgroundColor: Colors.darkCard2, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  cardImageEmptyText: { fontSize: 9, fontWeight: '700', color: Colors.border, textTransform: 'uppercase', letterSpacing: 1.5 },
  priceBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(13,20,29,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(65,71,85,0.3)',
  },
  priceBadgeText: { fontSize: 12, fontWeight: '900', color: Colors.lightBlue },

  cardBody: { padding: 12, flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.white },
  cardDesc: { fontSize: 11, color: Colors.slateGray, marginTop: 4, lineHeight: 16, fontWeight: '500' },

  cardActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, backgroundColor: 'rgba(173,198,255,0.1)', borderRadius: 10,
  },
  editBtnText: { color: Colors.lightBlue, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10,
  },
  deleteBtnText: { color: Colors.red, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.slateGray, fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: 'rgba(65,71,85,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.white },
  emptySubtext: { color: Colors.slateGray, fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.lightBlue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyAddBtnText: { color: '#002e69', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
});
