import React, { useState, useEffect, useRef } from 'react';
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
import { ForestGreen, DarkForest, LightGreen, AppFont } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { sendOtpSms, verifyOtpCode } from '@/lib/otp';
import { CacheStorage } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

const DRAFT_KEY = 'auth_registration_draft_v2';

export default function LoginScreen() {
  const { loginWithIdentifier, registerWithDetails, isLoggedIn } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Sign In State (Phone or Email)
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Registration State: Name, Email, Phone, Community, Address
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // DB Communities State (Loaded 100% from database)
  const [dbCommunities, setDbCommunities] = useState<string[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // OTP State
  const [otpInput, setOtpInput] = useState('');
  const [gatewayCode, setGatewayCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpInputRef = useRef<TextInput>(null);

  // If already logged in, navigate back
  useEffect(() => {
    if (isLoggedIn) {
      router.back();
    }
  }, [isLoggedIn]);

  // Load Communities from Supabase DB on mount
  useEffect(() => {
    async function fetchDbCommunities() {
      try {
        setLoadingCommunities(true);
        const { data, error } = await supabase
          .from('communities')
          .select('name')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const names = data.map((c: { name: string }) => c.name);
          setDbCommunities(names);
          if (!selectedCommunity) {
            setSelectedCommunity(names[0]);
          }
        }
      } catch (e) {
        console.warn('Could not fetch communities from DB:', e);
      } finally {
        setLoadingCommunities(false);
      }
    }
    fetchDbCommunities();
  }, []);

  // Load saved draft on mount so user can continue registration where they stopped
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        const savedDraft = await CacheStorage.get<{
          loginIdentifier?: string;
          fullName?: string;
          email?: string;
          phoneNumber?: string;
          selectedCommunity?: string;
          deliveryAddress?: string;
          isRegisterMode?: boolean;
          step?: 'form' | 'otp';
        }>(DRAFT_KEY);

        if (savedDraft) {
          if (savedDraft.loginIdentifier) setLoginIdentifier(savedDraft.loginIdentifier);
          if (savedDraft.fullName) setFullName(savedDraft.fullName);
          if (savedDraft.email) setEmail(savedDraft.email);
          if (savedDraft.phoneNumber) setPhoneNumber(savedDraft.phoneNumber);
          if (savedDraft.selectedCommunity) setSelectedCommunity(savedDraft.selectedCommunity);
          if (savedDraft.deliveryAddress) setDeliveryAddress(savedDraft.deliveryAddress);
          if (typeof savedDraft.isRegisterMode === 'boolean') setIsRegisterMode(savedDraft.isRegisterMode);
          if (savedDraft.step) setStep(savedDraft.step);
        }
      } catch {
        // Ignore cache errors
      }
    }
    loadSavedDraft();
  }, []);

  // Save draft whenever user types
  useEffect(() => {
    CacheStorage.set(DRAFT_KEY, {
      loginIdentifier,
      fullName,
      email,
      phoneNumber,
      selectedCommunity,
      deliveryAddress,
      isRegisterMode,
      step,
    });
  }, [loginIdentifier, fullName, email, phoneNumber, selectedCommunity, deliveryAddress, isRegisterMode, step]);

  // Resend OTP Countdown
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    setGatewayCode(null);

    if (!isRegisterMode) {
      // Sign In validation
      const cleaned = loginIdentifier.trim();
      if (!cleaned) {
        setErrorMessage('Please enter your phone number or email address.');
        return;
      }
      if (!cleaned.includes('@') && cleaned.replace(/[^0-9]/g, '').length < 10) {
        setErrorMessage('Please enter a valid phone number or email address.');
        return;
      }
    } else {
      // Registration validation: name, email, phone, community, address
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanedPhone.length < 10) {
        setErrorMessage('Please enter a valid 11-digit phone number.');
        return;
      }
      if (!selectedCommunity) {
        setErrorMessage('Please select your community / town.');
        return;
      }
      if (!deliveryAddress.trim()) {
        setErrorMessage('Please enter your delivery street address.');
        return;
      }
    }

    const targetPhone = isRegisterMode ? phoneNumber : loginIdentifier.includes('@') ? '' : loginIdentifier;
    const targetEmail = isRegisterMode ? email : loginIdentifier.includes('@') ? loginIdentifier : '';

    setIsLoading(true);
    try {
      const result = await sendOtpSms({
        phoneNumber: targetPhone || undefined,
        email: targetEmail || undefined,
        name: isRegisterMode ? fullName : undefined,
      });

      if (result.success) {
        if (result.isGatewayPending && result.otpCode) {
          setGatewayCode(result.otpCode);
        }
        setStep('otp');
        setResendTimer(45);
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 300);
      } else {
        setErrorMessage(result.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to gateway. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpInput).trim();
    setErrorMessage(null);

    if (code.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    const verificationIdentifier = isRegisterMode
      ? (email.trim().toLowerCase() || phoneNumber)
      : loginIdentifier;

    setIsLoading(true);
    try {
      const isValid = verifyOtpCode(verificationIdentifier, code);

      if (!isValid) {
        setErrorMessage('Invalid or expired code. Please enter the code sent or request a new one.');
        setIsLoading(false);
        return;
      }

      // Clear draft on successful authentication
      await CacheStorage.remove(DRAFT_KEY);

      if (!isRegisterMode) {
        // Sign in with email or phone
        const res = await loginWithIdentifier(loginIdentifier);
        if (res.success) {
          Alert.alert(
            'Welcome Back to OGBA MARKET PLACE',
            'You are now logged in securely.',
            [{ text: 'Continue', onPress: () => router.back() }]
          );
        } else {
          setErrorMessage(res.message || 'Login failed. Please check your credentials.');
        }
      } else {
        // Register new user: name, email, phone, community, address
        const res = await registerWithDetails({
          fullName,
          email,
          phoneNumber,
          community: selectedCommunity,
          deliveryAddress,
        });

        if (res.success) {
          Alert.alert(
            'Account Created Successfully!',
            `Welcome to OGBA MARKET PLACE, ${fullName}! Your account has been saved securely to the database.`,
            [{ text: 'Start Shopping', onPress: () => router.back() }]
          );
        } else {
          setErrorMessage(res.message || 'Could not complete registration.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'otp' ? 'Code Verification' : isRegisterMode ? 'Register New Account' : 'Sign In'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Brand Intro Card */}
          <View style={styles.brandCard}>
            <View style={styles.logoBadge}>
              <Ionicons name="shield-checkmark" size={28} color={ForestGreen} />
            </View>
            <Text style={styles.brandTitle}>OGBA MARKET PLACE</Text>
            <Text style={styles.brandSub}>
              Direct community commerce across Omoku, Egi, Obrikom & Erema. Powered by Paystack escrow protection.
            </Text>
          </View>

          {/* Mode Switcher */}
          {step === 'form' && (
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, !isRegisterMode && styles.modeTabActive]}
                onPress={() => {
                  setIsRegisterMode(false);
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.modeTabText, !isRegisterMode && styles.modeTabTextActive]}>
                  Sign In (Email or Phone)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, isRegisterMode && styles.modeTabActive]}
                onPress={() => {
                  setIsRegisterMode(true);
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.modeTabText, isRegisterMode && styles.modeTabTextActive]}>
                  New Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Step 1: Form Screen */}
          {step === 'form' ? (
            <View style={styles.formCard}>
              {!isRegisterMode ? (
                /* SIGN IN: Email or Phone */
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number or Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-circle-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 0803 123 4567 or user@mail.com"
                      placeholderTextColor="#94A3B8"
                      value={loginIdentifier}
                      onChangeText={setLoginIdentifier}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    Sign in with either your registered phone number or email address.
                  </Text>
                </View>
              ) : (
                /* REGISTRATION: Name, Email, Phone, Community, Address */
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Chukwuemeka Ogba"
                        placeholderTextColor="#94A3B8"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. chukwuemeka@gmail.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number (Receives SMS OTP)</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.countryCode}>+234</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="0803 123 4567"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        maxLength={14}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.inputLabel}>Community / Town (From Database)</Text>
                      {loadingCommunities && <ActivityIndicator size="small" color={ForestGreen} />}
                    </View>
                    
                    {dbCommunities.length > 0 ? (
                      <View style={styles.areaChipsRow}>
                        {dbCommunities.map((area) => (
                          <TouchableOpacity
                            key={area}
                            style={[styles.areaChip, selectedCommunity === area && styles.areaChipActive]}
                            onPress={() => setSelectedCommunity(area)}
                          >
                            <Text style={[styles.areaChipText, selectedCommunity === area && styles.areaChipTextActive]}>
                              {area}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.inputWrapper}>
                        <Ionicons name="location-outline" size={18} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. Omoku, Egi, Obrikom"
                          placeholderTextColor="#94A3B8"
                          value={selectedCommunity}
                          onChangeText={setSelectedCommunity}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Delivery Street Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="home-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. No. 14 Ahia Ogba Road, near Total"
                        placeholderTextColor="#94A3B8"
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {isRegisterMode ? 'Continue & Verify Phone' : 'Send Verification Code'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2: OTP Verification Screen */
            <View style={styles.formCard}>
              <View style={styles.otpHeaderBox}>
                <View style={styles.smsIconCircle}>
                  <Ionicons name="mail-open-outline" size={24} color={ForestGreen} />
                </View>
                <Text style={styles.otpNoticeTitle}>Enter 6-Digit Verification Code</Text>
                <Text style={styles.otpNoticeSub}>
                  Sent to <Text style={{ fontWeight: '700', color: '#111827' }}>
                    {isRegisterMode ? email : (loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}`)}
                  </Text>
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, textAlign: 'center', fontFamily: AppFont }}>
                  Please check your inbox (and Spam/Junk folder)
                </Text>
              </View>

              {gatewayCode && (
                <TouchableOpacity
                  style={styles.pendingGatewayBox}
                  onPress={() => {
                    setOtpInput(gatewayCode);
                    handleVerifyOtp(gatewayCode);
                  }}
                >
                  <Ionicons name="information-circle" size={16} color="#B45309" />
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.pendingGatewayTitle}>Development Verification Code</Text>
                    <Text style={styles.pendingGatewaySub}>
                      Your test code is <Text style={{ fontWeight: '900', color: '#92400E' }}>{gatewayCode}</Text> (Tap to auto-fill)
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.inputGroup}>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpBigInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={otpInput}
                  onChangeText={(val) => {
                    setOtpInput(val);
                    if (val.length === 6) {
                      handleVerifyOtp(val);
                    }
                  }}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
                onPress={() => handleVerifyOtp()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {isRegisterMode ? 'Complete Registration' : 'Verify & Sign In'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.otpResendRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in <Text style={{ fontWeight: '700' }}>{resendTimer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                    <Text style={styles.resendBtnText}>Resend Code</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setStep('form');
                    setOtpInput('');
                    setErrorMessage(null);
                  }}
                >
                  <Text style={styles.changePhoneText}>Back to Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Trust Footer */}
          <View style={styles.trustFooter}>
            <Ionicons name="lock-closed-outline" size={14} color="#059669" />
            <Text style={styles.trustFooterText}>
              Your information is encrypted and protected with Paystack Escrow.
            </Text>
          </View>
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
  closeBtn: {
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
    paddingBottom: 32,
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: ForestGreen,
    fontFamily: AppFont,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    fontFamily: AppFont,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: AppFont,
  },
  modeTabTextActive: {
    color: ForestGreen,
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    fontFamily: AppFont,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    fontFamily: AppFont,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: ForestGreen,
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    fontFamily: AppFont,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: AppFont,
  },
  inputHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontFamily: AppFont,
  },
  areaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  areaChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaChipActive: {
    backgroundColor: LightGreen,
    borderColor: ForestGreen,
  },
  areaChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    fontFamily: AppFont,
  },
  areaChipTextActive: {
    color: ForestGreen,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: ForestGreen,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: ForestGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  otpHeaderBox: {
    alignItems: 'center',
    marginBottom: 14,
  },
  smsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  otpNoticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: AppFont,
  },
  otpNoticeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: AppFont,
  },
  pendingGatewayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  pendingGatewayTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    fontFamily: AppFont,
  },
  pendingGatewaySub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
    fontFamily: AppFont,
  },
  otpBigInput: {
    borderWidth: 2,
    borderColor: ForestGreen,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 8,
    color: ForestGreen,
    fontFamily: AppFont,
  },
  otpResendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resendTimerText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: AppFont,
  },
  resendBtnText: {
    fontSize: 12,
    color: ForestGreen,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  changePhoneText: {
    fontSize: 11,
    color: '#64748B',
    textDecorationLine: 'underline',
    fontFamily: AppFont,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  trustFooterText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    fontFamily: AppFont,
  },
});
