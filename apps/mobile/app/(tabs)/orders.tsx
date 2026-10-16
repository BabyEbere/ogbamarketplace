import React from 'react';
import { StyleSheet, View, Text, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ForestGreen, DarkForest, AppFont } from '@/constants/Colors';

export default function OrdersScreen() {
  const orders = [
    {
      id: 'OGB-98124',
      date: 'Today, 10:15 AM',
      items: 'Fresh Farm Produce Basket (x1), Pure Egi Palm Oil 25L (x1)',
      total: '₦53,000',
      status: 'Rider In Transit',
      statusColor: '#D97706',
      vendor: "Mama Ngozi's Store & Egi Mill",
    },
    {
      id: 'OGB-97552',
      date: 'Yesterday',
      items: 'Pure White Cassava Garri (50kg Bag)',
      total: '₦32,000',
      status: 'Delivered',
      statusColor: ForestGreen,
      vendor: "Mama Ngozi's Store",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.orderDate}>{item.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${item.statusColor}18` }]}>
                <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.orderItems}>{item.items}</Text>
            <Text style={styles.vendorText}>Vendors: {item.vendor}</Text>

            <View style={styles.orderFooterRow}>
              <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>{item.total}</Text></Text>
              <TouchableOpacity style={styles.trackBtn}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                <Text style={styles.trackBtnText}>Track Rider</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: DarkForest,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  orderDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderItems: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  vendorText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 10,
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: ForestGreen,
  },
  trackBtn: {
    backgroundColor: ForestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
