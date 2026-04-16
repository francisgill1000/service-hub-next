import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useCustomer } from '../../context/CustomerContext';
import { useNavigation } from '@react-navigation/native';

export default function CustomerProfileScreen() {
  const { customer, logoutCustomer } = useCustomer();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await logoutCustomer(); },
      },
    ]);
  };

  const initials = customer?.name
    ? customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Account</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={22} color={Colors.slateGray} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.customerName}>{customer?.name}</Text>
          <Text style={styles.customerEmail}>{customer?.email}</Text>
        </View>

        {/* Quick links */}
        <View style={styles.card}>
          {[
            { label: 'My Bookings', icon: 'calendar-today', onPress: () => navigation.navigate('Bookings') },
            { label: 'Favourites', icon: 'favorite', onPress: () => navigation.navigate('Favourites') },
            { label: 'Explore', icon: 'explore', onPress: () => navigation.navigate('Explore') },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i < arr.length - 1 && styles.menuRowBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.slateGray} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  logoutBtn: { padding: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(0,122,255,0.15)', borderWidth: 2, borderColor: 'rgba(0,122,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  customerName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  customerEmail: { fontSize: 14, color: Colors.mutedText },
  card: {
    backgroundColor: Colors.cardDark, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.white },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)',
  },
  signOutText: { color: Colors.red, fontSize: 15, fontWeight: '700' },
});
