import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import api from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useShop } from '../../context/ShopContext';

export default function StaffScreen() {
  const navigation = useNavigation();
  const { shop } = useShop();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchStaff = async () => {
    if (!shop?.id) return;
    try {
      const res = await api.get(`/shops/${shop.id}/staff`);
      setStaff(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, [shop?.id]));

  const addStaff = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/shops/${shop.id}/staff`, { name: newName.trim() });
      setStaff(prev => [...prev, data.data]);
      setNewName('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add staff.');
    } finally {
      setAdding(false);
    }
  };

  const editStaff = (member) => {
    Alert.prompt?.(
      'Edit name',
      `Update name for ${member.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (val) => {
            if (!val?.trim() || val.trim() === member.name) return;
            setBusyId(member.id);
            try {
              const { data } = await api.put(`/shops/${shop.id}/staff/${member.id}`, { name: val.trim() });
              setStaff(prev => prev.map(s => s.id === member.id ? data.data : s));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not save.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
      'plain-text',
      member.name
    );
    // Android fallback: use a simple alert if prompt isn't supported
    if (!Alert.prompt) {
      Alert.alert('Edit not supported', 'Please use the web app to rename staff.');
    }
  };

  const toggleActive = async (member) => {
    setBusyId(member.id);
    try {
      const { data } = await api.put(`/shops/${shop.id}/staff/${member.id}`, {
        is_active: !member.is_active,
      });
      setStaff(prev => prev.map(s => s.id === member.id ? data.data : s));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update.');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }) => {
    const initial = (item.name || '?').charAt(0).toUpperCase();
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: item.is_active ? `${Colors.green}22` : `${Colors.slateGray}33` }]}>
            <Text style={[styles.statusPillText, { color: item.is_active ? Colors.green : Colors.slateGray }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: Colors.navyAccent }]}
            onPress={() => editStaff(item)}
            disabled={busyId === item.id}
          >
            <MaterialIcons name="edit" size={16} color={Colors.lightBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: item.is_active ? `${Colors.slateGray}22` : `${Colors.green}22` },
            ]}
            onPress={() => toggleActive(item)}
            disabled={busyId === item.id}
          >
            {busyId === item.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialIcons
                name={item.is_active ? 'toggle-off' : 'toggle-on'}
                size={20}
                color={item.is_active ? Colors.slateGray : Colors.green}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.mutedText} />
        </TouchableOpacity>
        <Text style={styles.title}>Staff</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Add form */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New staff name"
          placeholderTextColor={Colors.slateGray}
          value={newName}
          onChangeText={setNewName}
          editable={!adding}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!newName.trim() || adding) && { opacity: 0.5 }]}
          onPress={addStaff}
          disabled={!newName.trim() || adding}
        >
          {adding ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <MaterialIcons name="add" size={22} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchStaff(); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="people-outline" size={42} color={Colors.border} />
              <Text style={styles.emptyText}>No staff yet.</Text>
              <Text style={styles.emptySub}>Add the people who handle bookings above.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.brandDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, backgroundColor: Colors.cardDark, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white },
  addRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  input: {
    flex: 1, height: 44, backgroundColor: Colors.cardDark, borderRadius: 12,
    paddingHorizontal: 14, color: Colors.white, fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  addBtn: {
    width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardDark, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.navyAccent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.lightBlue, fontWeight: '800', fontSize: 16 },
  cardBody: { flex: 1, gap: 4 },
  name: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { color: Colors.mutedText, fontSize: 14, fontWeight: '600', marginTop: 6 },
  emptySub: { color: Colors.slateGray, fontSize: 12 },
});
