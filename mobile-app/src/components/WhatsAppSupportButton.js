import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { openWhatsAppSupport } from '../utils/support';

export default function WhatsAppSupportButton({ size = 22 }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Contact support on WhatsApp"
      activeOpacity={0.8}
      onPress={() => openWhatsAppSupport()}
      style={styles.btn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome name="whatsapp" size={size} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
