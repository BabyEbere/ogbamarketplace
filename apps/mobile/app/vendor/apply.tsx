import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ForestGreen, DarkForest, LightGreen, AccentGold, AppFont } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { CacheStorage } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

const VENDOR_DRAFT_KEY = 'vendor_kyc_apply_draft';

const NIGERIAN_BANKS = [
  'OPay Digital Services',
  'Moniepoint Microfinance Bank',
  'PalmPay',
  'Access Bank',
  'GTBank (Guaranty Trust)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
];

const DEFAULT_CATEGORIES = [
  'Groceries & Farm Produce',
  'Palm Oil & Agro Mills',
  'Electronics, Solar & Gadgets',
  'Fashion, Fabrics & Native Wears',
  'Building Materials & Hardware',
  'Mama\'s Market (Daily Staples)',
];

export default function VendorApplyScreen() {
  const { user, submitVendorKyc, isLoggedIn } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [selectedArea, setSelectedArea] = useState('Omoku');
  const [communitiesList, setCommunitiesList] = useState<string[]>(['Omoku', 'Egi', 'Obrikom', 'Erema']);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load live communities & categories from DB
  useEffect(() => {
    async function loadDynamicOptions() {
      try {
        const { data: comms } = await supabase
          .from('communities')
          .select('name')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (comms && comms.length > 0) {
          const names = comms.map((c: any) => c.name);
          setCommunitiesList(names);
          setSelectedArea((prev) => (names.includes(prev) ? prev : names[0]));
        }

        const { data: cats } = await supabase
          .from('categories')
          .select('name')
          .order('display_order', { ascending: true });

        if (cats && cats.length > 0) {
          const catNames = cats.map((c: any) => c.name);
          setCategoriesList(catNames);
          setSelectedCategory((prev) => (catNames.includes(prev) ? prev : catNames[0]));
        }
      } catch (err) {
        console.warn('Could not load dynamic DB options in apply screen:', err);
      }
    }
    loadDynamicOptions();
  }, []);

  // Restore vendor application draft on screen mount
  useEffect(() => {
    async function loadSavedVendorDraft() {
      try {
        const draft = await CacheStorage.get<{
          businessName?: string;
          marketLocation?: string;
          selectedArea?: 'Omoku' | 'Egi' | 'Obrikom' | 'Erema';
          selectedCategory?: string;
          selectedBank?: string;
          accountNumber?: string;
          accountName?: string;
          idNumber?: string;
        }>(VENDOR_DRAFT_KEY);

        if (draft) {
          if (draft.businessName) setBusinessName(draft.businessName);
          if (draft.marketLocation) setMarketLocation(draft.marketLocation);
          if (draft.selectedArea) setSelectedArea(draft.selectedArea);
          if (draft.selectedCategory) setSelectedCategory(draft.selectedCategory);
          if (draft.selectedBank) setSelectedBank(draft.selectedBank);
          if (draft.accountNumber) setAccountNumber(draft.accountNumber);
          if (draft.accountName) setAccountName(draft.accountName);
          if (draft.idNumber) setIdNumber(draft.idNumber);
        }
      } catch {
        // Ignore cache errors
      }
    }
    loadSavedVendorDraft();
  }, []);

  // Save vendor application draft in background
  useEffect(() => {
    CacheStorage.set(VENDOR_DRAFT_KEY, {
      businessName,
      marketLocation,
      selectedArea,
      selectedCategory,
      selectedBank,
      accountNumber,
      accountName,
      idNumber,
    });
  }, [businessName, marketLocation, selectedArea, selectedCategory, selectedBank, accountNumber, accountName, idNumber]);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please sign in or create an account before applying for vendor verification.', [
        { text: 'Log In Now', onPress: () => router.push('/auth/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (!businessName.trim()) {
      setErrorMessage('Please enter your store or business name.');
      return;
    }

    if (!marketLocation.trim()) {
      setErrorMessage('Please enter your market location (e.g. Omoku Main Market, Line 2).');
      return;
    }

    if (accountNumber.trim().length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Nigerian NUBAN account number.');
      return;
    }

    if (!accountName.trim()) {
      setErrorMessage('Please enter the account name matching your bank account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitVendorKyc({
        businessName: businessName.trim(),
        marketLocation: marketLocation.trim(),
        area: selectedArea,
        bankName: selectedBank,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim(),
        category: selectedCategory,
      });

      if (result.success) {
        // Clear draft on successful activation
        await CacheStorage.remove(VENDOR_DRAFT_KEY);

        Alert.alert(
          '🎉 KYC Application Approved!',
          'Your merchant storefront has been activated. You can now add products and manage your store.',
          [
            {
              text: 'Open Vendor Portal',
              onPress: () => {
                router.replace('/vendor/dashboard');
              },
            },
          ]
        );
      } else {
        setErrorMessage(result.message || 'Failed to submit application. Please check details.');
      }
    } catch (err: any) {
      setErrorMessage('An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Verified Vendor (KYC)</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Trust Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="shield-checkmark" size={26} color={ForestGreen} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTitle}>Join Verified Ogba & Egi Merchants</Text>
              <Text style={styles.bannerSub}>
                List your items, receive verified orders from local buyers, and get automated payouts directly to your bank account.
              </Text>
            </View>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Card: Store Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>1. Store & Business Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business / Store Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Erema Palm Oil Mills & Agro"
                placeholderTextColor="#94A3B8"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Market Location & Shop Address *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Omoku Main Market, Line 4, Shop 22"
                placeholderTextColor="#94A3B8"
                value={marketLocation}
                onChangeText={setMarketLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Community Zone (From Database)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {communitiesList.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={[styles.chip, selectedArea === area && styles.chipActive]}
                      onPress={() => setSelectedArea(area)}
                    >
                      <Text style={[styles.chipText, selectedArea === area && styles.chipTextActive]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Merchandise Category (From Database)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {categoriesList.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Form Card: Bank Payout Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>2. Settlement Bank & Escrow Payouts</Text>
            <Text style={styles.sectionHint}>
              Funds from buyer orders are paid directly into this bank account upon delivery verification.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {NIGERIAN_BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.chip, selectedBank === b && styles.chipActive]}
                      onPress={() => setSelectedBank(b)}
                    >
                      <Text style={[styles.chipText, selectedBank === b && styles.chipTextActive]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>10-Digit NUBAN Account Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0123456789"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Name (As Registered with Bank) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Eberechi Wisdom"
                placeholderTextColor="#94A3B8"
                value={accountName}
                onChangeText={setAccountName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Form Card: ID Proof */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>3. Identity Verification (KYC)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NIN, Voter's Card, or Market Pass Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 11-digit NIN or Voter ID"
                placeholderTextColor="#94A3B8"
                value={idNumber}
                onChangeText={setIdNumber}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit KYC & Activate Store</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 16,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ForestGreen,
    fontFamily: AppFont,
  },
  bannerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
    fontFamily: AppFont,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    fontFamily: AppFont,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    fontFamily: AppFont,
  },
  sectionHint: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 14,
    fontFamily: AppFont,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    fontFamily: AppFont,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: AppFont,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: LightGreen,
    borderColor: ForestGreen,
  },
  chipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    fontFamily: AppFont,
  },
  chipTextActive: {
    color: ForestGreen,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: ForestGreen,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: ForestGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: AppFont,
  },
});
