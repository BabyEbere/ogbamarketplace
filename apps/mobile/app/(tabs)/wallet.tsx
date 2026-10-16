import React from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ForestGreen, DarkForest, LightGreen, AppFont } from '@/constants/Colors';

export default function WalletScreen() {
  const transactions = [
    { id: '1', title: 'Wallet Top-Up (Paystack)', date: 'Today, 8:30 AM', amount: '+₦15,000', type: 'credit' },
    { id: '2', title: 'Payment for Order #OGB-98124', date: 'Today, 10:15 AM', amount: '-₦2,500', type: 'debit' },
    { id: '3', title: 'Marketplace Referral Bonus', date: 'Oct 20, 2026', amount: '+₦1,000', type: 'credit' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₦12,500.00</Text>
          <Text style={styles.accountNumber}>Virtual Account: 8031234567 • Wema / Opay</Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
              <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Transfer / Pay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionHeading}>Transaction History</Text>

        <View style={styles.transactionsContainer}>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#ECFDF5' : '#FEE2E2' }]}>
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down-outline' : 'arrow-up-outline'}
                  size={16}
                  color={tx.type === 'credit' ? ForestGreen : '#DC2626'}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? ForestGreen : '#DC2626' }]}>
                {tx.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: ForestGreen,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceLabel: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  accountNumber: {
    color: '#A7F3D0',
    fontSize: 11,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnOutline: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  txDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
});
