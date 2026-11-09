import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { AirplaneTowAnimation } from '../components/AirplaneTowAnimation';
import { api } from '../api';

const { width } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
  const { user, login, logout, quickLoginRole } = useAuth();

  // Tab: 'LOGIN' or 'REGISTER'
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');

  // Animation states
  const isFocused = useIsFocused();
  const [isLanded, setIsLanded] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Animated values for the Ticket / Card
  const cardTranslateY = useRef(new Animated.Value(-160)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Run tow & ticket landing animation when screen comes into focus
  useEffect(() => {
    if (isFocused && !user) {
      startTowAnimation();
    }
  }, [isFocused, user]);

  const startTowAnimation = () => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
    }
    setIsLanded(false);
    cardTranslateY.setValue(-160);
    cardScale.setValue(0.85);
    cardRotate.setValue(0);
    flipAnim.setValue(0);

    // 1. Towing phase: card sways and descends with the plane
    const towAnim = Animated.parallel([
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(cardRotate, {
          toValue: -1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotate, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]);

    activeAnimRef.current = towAnim;
    towAnim.start(({ finished }) => {
      if (finished) {
        // 2. Touchdown phase: unfold ticket into login form
        setIsLanded(true);
        Animated.spring(flipAnim, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handleSkipAnimation = () => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
    }
    setIsLanded(true);
    cardTranslateY.setValue(0);
    cardScale.setValue(1);
    cardRotate.setValue(0);
    flipAnim.setValue(1);
  };

  const handleReplayAnimation = () => {
    setAnimKey((prev) => prev + 1);
    startTowAnimation();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Sai thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }
    if (regPassword !== regConfirmPass) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await api.register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        phone: regPhone.trim() || undefined,
      });
      Alert.alert('Thành công', 'Đăng ký tài khoản hội viên thành công! Vui lòng đăng nhập.');
      setEmail(regEmail.trim());
      setPassword(regPassword.trim());
      setAuthTab('LOGIN');
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err.message || 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    CUSTOMER: 'Khách Hàng',
    STAFF: 'Nhân Viên',
    STAFF_MANAGER: 'Quản Lý',
    ADMIN: 'Quản Trị Viên',
  };

  const handleQuickLogin = async (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => {
    setLoading(true);
    try {
      await quickLoginRole(role);
      // User state is now updated — no need to navigate manually,
      // the conditional render `if (user)` will show the profile view.
      Alert.alert(
        '✅ Chuyển tài khoản thành công',
        `Đang xem với vai trò: ${ROLE_LABELS[role] || role}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đăng nhập tài khoản mẫu');
    } finally {
      setLoading(false);
    }
  };

  // Profile View when logged in
  if (user) {
    return (
      <View style={styles.container}>
        <Header title="Tài khoản" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={36} color={COLORS.navy} />
            </View>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name={
                  user.role === 'ADMIN' ? 'shield-checkmark' :
                  user.role === 'STAFF_MANAGER' ? 'bar-chart' :
                  user.role === 'STAFF' ? 'briefcase' : 'star'
                }
                size={14}
                color={
                  user.role === 'ADMIN' ? '#ef4444' :
                  user.role === 'STAFF_MANAGER' ? COLORS.cyan :
                  user.role === 'STAFF' ? COLORS.emerald : COLORS.gold
                }
              />
              <Text style={[
                styles.roleBadgeText,
                user.role === 'ADMIN' && { color: '#ef4444' },
                user.role === 'STAFF_MANAGER' && { color: COLORS.cyan },
                user.role === 'STAFF' && { color: COLORS.emerald },
              ]}>
                {user.role === 'CUSTOMER' ? '⭐ Hội viên Khách hàng' :
                 user.role === 'STAFF' ? '✈️ Nhân viên Hạt Gạo Sky' :
                 user.role === 'STAFF_MANAGER' ? '📊 Quản lý Hạt Gạo Sky' :
                 user.role === 'ADMIN' ? '🛡️ Quản trị viên Hệ thống' :
                 `VAI TRÒ: ${user.role}`}
              </Text>
            </View>

            {user.role !== 'GUEST' && user.role !== 'CUSTOMER' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('StaffPortalTab')}
                style={styles.portalBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
                <Text style={styles.portalBtnText}>Mở Cổng Quản lý (Staff Portal)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.rose} />
              <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Switch Role Bar */}
          <View style={styles.switchSection}>
            <Text style={styles.switchTitle}>Chuyển nhanh tài khoản demo:</Text>
            <View style={styles.quickRoles}>
              <TouchableOpacity
                onPress={() => handleQuickLogin('CUSTOMER')}
                style={[styles.rolePill, user.role === 'CUSTOMER' && styles.rolePillActive]}
                disabled={loading}
              >
                <Text style={[styles.rolePillText, user.role === 'CUSTOMER' && styles.rolePillTextActive]}>
                  🌟 Khách hàng
                </Text>
                {user.role === 'CUSTOMER' && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLogin('STAFF')}
                style={[styles.rolePill, user.role === 'STAFF' && styles.rolePillActive]}
                disabled={loading}
              >
                <Text style={[styles.rolePillText, user.role === 'STAFF' && styles.rolePillTextActive]}>
                  ✈️ Nhân viên
                </Text>
                {user.role === 'STAFF' && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLogin('STAFF_MANAGER')}
                style={[styles.rolePill, user.role === 'STAFF_MANAGER' && styles.rolePillActive]}
                disabled={loading}
              >
                <Text style={[styles.rolePillText, user.role === 'STAFF_MANAGER' && styles.rolePillTextActive]}>
                  📊 Quản lý
                </Text>
                {user.role === 'STAFF_MANAGER' && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLogin('ADMIN')}
                style={[styles.rolePill, user.role === 'ADMIN' && styles.rolePillActive]}
                disabled={loading}
              >
                <Text style={[styles.rolePillText, user.role === 'ADMIN' && styles.rolePillTextActive]}>
                  🛡️ Quản trị
                </Text>
                {user.role === 'ADMIN' && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.gold} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Interpolated card rotation for the sway
  const spinDegree = cardRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  return (
    <View style={styles.container}>
      <Header
        title={authTab === 'LOGIN' ? 'Đăng nhập' : 'Đăng ký'}
        rightAction={
          isLanded ? (
            <TouchableOpacity
              onPress={handleReplayAnimation}
              style={styles.replayPill}
              activeOpacity={0.7}
            >
              <Ionicons name="airplane" size={14} color={COLORS.gold} />
              <Text style={styles.replayPillText}>Bay lại</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSkipAnimation}
              style={styles.skipPill}
              activeOpacity={0.7}
            >
              <Text style={styles.skipPillText}>Bỏ qua</Text>
              <Ionicons name="play-forward" size={12} color={COLORS.navy} />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Animated Convoy Area */}
        <View style={styles.animationStage} key={animKey}>
          {/* 1. Airplane Towing Animation overhead */}
          <AirplaneTowAnimation key={animKey} isLanded={isLanded} />

          {/* 2. The Flight Ticket / Login Card */}
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [
                  { translateY: cardTranslateY },
                  { scale: cardScale },
                  { rotate: spinDegree },
                ],
              },
            ]}
          >
            {/* ========================================================
                A. THE FLYING TICKET (Visible while in flight)
                ======================================================== */}
            {!isLanded ? (
              <View style={styles.ticketView}>
                {/* Golden notch & hanger rings for the cables */}
                <View style={styles.ticketHangers}>
                  <View style={styles.hangerRing}>
                    <View style={styles.hangerHole} />
                  </View>
                  <View style={styles.hangerRing}>
                    <View style={styles.hangerHole} />
                  </View>
                </View>

                {/* Ticket Header */}
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketLogoRow}>
                    <Ionicons name="airplane" size={16} color={COLORS.gold} />
                    <Text style={styles.ticketLogoText}>HẠT GẠO SKY</Text>
                  </View>
                  <View style={styles.ticketBadge}>
                    <Text style={styles.ticketBadgeText}>BOARDING PASS</Text>
                  </View>
                </View>

                {/* Ticket Route */}
                <View style={styles.ticketRouteRow}>
                  <View>
                    <Text style={styles.routeCity}>CHƯƠNG TRÌNH</Text>
                    <Text style={styles.routeCode}>HG-SKY</Text>
                  </View>
                  <View style={styles.routeIconWrapper}>
                    <Ionicons name="airplane" size={24} color={COLORS.gold} />
                    <Text style={styles.routeSubText}>BAY ĐẾN</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.routeCity}>TRẢI NGHIỆM</Text>
                    <Text style={styles.routeCode}>ĐĂNG NHẬP</Text>
                  </View>
                </View>

                {/* Perforated Tear Line */}
                <View style={styles.tearLineContainer}>
                  <View style={styles.notchLeft} />
                  <View style={styles.dashedLine} />
                  <View style={styles.notchRight} />
                </View>

                {/* Ticket Details */}
                <View style={styles.ticketDetailsRow}>
                  <View>
                    <Text style={styles.detailLabel}>HÀNH KHÁCH</Text>
                    <Text style={styles.detailValue}>QUÝ KHÁCH</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>CỔNG (GATE)</Text>
                    <Text style={styles.detailValue}>G-08</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.detailLabel}>GHẾ (SEAT)</Text>
                    <Text style={styles.detailValue}>01A (VIP)</Text>
                  </View>
                </View>

                {/* Barcode Mock */}
                <View style={styles.barcodeBox}>
                  <Ionicons name="barcode-outline" size={42} color={COLORS.slate700} />
                  <Text style={styles.barcodeText}>* HG-SKY-BOARDING-PASS-2026 *</Text>
                </View>
              </View>
            ) : (
              /* ========================================================
                  B. THE LOGIN / REGISTER FORM (Revealed upon landing)
                  ======================================================== */
              <View style={styles.formView}>
                {/* Card Header with Tab Switcher */}
                <View style={styles.tabSwitcher}>
                  <TouchableOpacity
                    onPress={() => setAuthTab('LOGIN')}
                    style={[styles.tabButton, authTab === 'LOGIN' && styles.tabButtonActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={16}
                      color={authTab === 'LOGIN' ? COLORS.white : COLORS.slate500}
                    />
                    <Text
                      style={[
                        styles.tabButtonText,
                        authTab === 'LOGIN' && styles.tabButtonTextActive,
                      ]}
                    >
                      Đăng nhập
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAuthTab('REGISTER')}
                    style={[styles.tabButton, authTab === 'REGISTER' && styles.tabButtonActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={16}
                      color={authTab === 'REGISTER' ? COLORS.white : COLORS.slate500}
                    />
                    <Text
                      style={[
                        styles.tabButtonText,
                        authTab === 'REGISTER' && styles.tabButtonTextActive,
                      ]}
                    >
                      Đăng ký mới
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Title & Subtitle */}
                <Text style={styles.formTitle}>
                  {authTab === 'LOGIN' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản Hội viên'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {authTab === 'LOGIN'
                    ? 'Đăng nhập để xem vé, tích dặm thưởng và nhận ưu đãi bay'
                    : 'Gia nhập Lotus Club ngay hôm nay để nhận 1.000 dặm khởi đầu'}
                </Text>

                {/* LOGIN TAB CONTENT */}
                {authTab === 'LOGIN' ? (
                  <View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL ĐĂNG NHẬP *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="customer@vietsky.vn"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>MẬT KHẨU *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={password}
                          onChangeText={setPassword}
                          placeholder="••••••••"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                      style={styles.submitBtn}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <View style={styles.btnRow}>
                          <Ionicons name="airplane" size={18} color={COLORS.white} />
                          <Text style={styles.submitBtnText}>ĐĂNG NHẬP NGAY</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Switch to Register link */}
                    <TouchableOpacity
                      onPress={() => setAuthTab('REGISTER')}
                      style={styles.switchAuthLink}
                    >
                      <Text style={styles.switchAuthText}>
                        Chưa có tài khoản?{' '}
                        <Text style={styles.switchAuthHighlight}>Đăng ký ngay</Text>
                      </Text>
                    </TouchableOpacity>

                    {/* Quick Demo Accounts for Grading / Testing */}
                    <View style={styles.demoSection}>
                      <Text style={styles.demoTitle}>Tài khoản mẫu (Bấm để đăng nhập ngay):</Text>
                      <View style={styles.quickRoles}>
                        <TouchableOpacity
                          onPress={() => handleQuickLogin('CUSTOMER')}
                          style={styles.rolePill}
                        >
                          <Text style={styles.rolePillText}>🌟 Khách hàng: customer@vietsky.vn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleQuickLogin('STAFF')}
                          style={styles.rolePill}
                        >
                          <Text style={styles.rolePillText}>✈️ Nhân viên bay: staff@vietsky.vn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleQuickLogin('STAFF_MANAGER')}
                          style={styles.rolePill}
                        >
                          <Text style={styles.rolePillText}>
                            📊 Quản lý doanh thu: manager@vietsky.vn
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleQuickLogin('ADMIN')}
                          style={styles.rolePill}
                        >
                          <Text style={styles.rolePillText}>🛡️ Quản trị viên: admin@vietsky.vn</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* REGISTER TAB CONTENT */
                  <View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>HỌ VÀ TÊN *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="person-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={regFullName}
                          onChangeText={setRegFullName}
                          placeholder="Nguyễn Văn An"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>EMAIL ĐĂNG KÝ *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={regEmail}
                          onChangeText={setRegEmail}
                          placeholder="nguyenvanan@gmail.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="call-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={regPhone}
                          onChangeText={setRegPhone}
                          placeholder="0912 345 678"
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>MẬT KHẨU *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={regPassword}
                          onChangeText={setRegPassword}
                          placeholder="Tối thiểu 6 ký tự"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU *</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.navy} />
                        <TextInput
                          style={styles.textInput}
                          value={regConfirmPass}
                          onChangeText={setRegConfirmPass}
                          placeholder="Nhập lại mật khẩu"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleRegister}
                      disabled={loading}
                      style={styles.submitBtn}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <View style={styles.btnRow}>
                          <Ionicons name="ribbon" size={18} color={COLORS.white} />
                          <Text style={styles.submitBtnText}>ĐĂNG KÝ HỘI VIÊN NGAY</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Switch back to Login */}
                    <TouchableOpacity
                      onPress={() => setAuthTab('LOGIN')}
                      style={styles.switchAuthLink}
                    >
                      <Text style={styles.switchAuthText}>
                        Đã có tài khoản?{' '}
                        <Text style={styles.switchAuthHighlight}>Đăng nhập ngay</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2445',
  },
  scroll: {
    paddingBottom: 40,
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  replayPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gold,
  },
  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  skipPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
  },
  animationStage: {
    marginTop: 80,
    alignItems: 'center',
    position: 'relative',
    minHeight: 520,
  },
  cardContainer: {
    width: width - 32,
    maxWidth: 420,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  // Ticket Style
  ticketView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    overflow: 'hidden',
  },
  ticketHangers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: -28,
    marginBottom: 6,
  },
  hangerRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.navy,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangerHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a192f',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  ticketLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketLogoText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 0.8,
  },
  ticketBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 1,
  },
  ticketRouteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  routeCity: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 0.5,
  },
  routeCode: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 1,
  },
  routeIconWrapper: {
    alignItems: 'center',
  },
  routeSubText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: 2,
  },
  tearLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: -20,
    overflow: 'hidden',
  },
  notchLeft: {
    width: 16,
    height: 32,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#0f2445',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  notchRight: {
    width: 16,
    height: 32,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#0f2445',
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate400,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 2,
  },
  barcodeBox: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  barcodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate400,
    letterSpacing: 2,
    marginTop: 2,
  },

  // Form Style
  formView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.navy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  tabButtonTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },
  formSubtitle: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 3,
    marginBottom: 18,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate500,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate800,
  },
  submitBtn: {
    backgroundColor: COLORS.navy,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 0.6,
  },
  switchAuthLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  switchAuthText: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  switchAuthHighlight: {
    fontWeight: '800',
    color: COLORS.goldDark,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    marginBottom: 10,
  },
  quickRoles: {
    gap: 6,
  },
  rolePill: {
    backgroundColor: COLORS.slate50,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolePillActive: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: COLORS.gold,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  rolePillTextActive: {
    color: COLORS.goldDark,
  },

  // Logged-in profile styles
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(15, 43, 92, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 0.8,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.rose,
  },
  switchSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate300,
    marginBottom: 10,
  },
});
