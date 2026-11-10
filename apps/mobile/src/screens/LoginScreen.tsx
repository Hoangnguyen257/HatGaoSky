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
    const roleColor =
      user.role === 'ADMIN' ? '#ef4444' :
      user.role === 'STAFF_MANAGER' ? COLORS.cyan :
      user.role === 'STAFF' ? COLORS.emerald : COLORS.gold;

    const roleName =
      user.role === 'CUSTOMER' ? 'Hội viên Khách hàng' :
      user.role === 'STAFF' ? 'Nhân viên Hạt Gạo Sky' :
      user.role === 'STAFF_MANAGER' ? 'Quản lý Hạt Gạo Sky' :
      user.role === 'ADMIN' ? 'Quản trị viên Hệ thống' : user.role;

    const roleIcon: any =
      user.role === 'ADMIN' ? 'shield-checkmark' :
      user.role === 'STAFF_MANAGER' ? 'bar-chart' :
      user.role === 'STAFF' ? 'briefcase' : 'star';

    return (
      <View style={styles.container}>
        <Header title="Tài khoản" />
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Profile Hero Card */}
          <View style={styles.profileHero}>
            <View style={styles.profileHeroBg}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={36} color={COLORS.navy} />
              </View>
              <Text style={styles.profileName}>{user.fullName}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}50`, borderWidth: 1 }]}>
                <Ionicons name={roleIcon} size={13} color={roleColor} />
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleName}</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              {user.role === 'CUSTOMER' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('LotusClubTab')}
                  style={[styles.portalBtn, { backgroundColor: COLORS.gold }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="star" size={18} color={COLORS.navy} />
                  <Text style={[styles.portalBtnText, { color: COLORS.navy }]}>Xem ưu đãi Hội viên Lotus Club</Text>
                </TouchableOpacity>
              )}

              {user.role === 'STAFF' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('StaffPortalTab')}
                  style={[styles.portalBtn, { backgroundColor: COLORS.emerald }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="airplane" size={18} color={COLORS.white} />
                  <Text style={styles.portalBtnText}>Vào Cổng Tác nghiệp bay</Text>
                </TouchableOpacity>
              )}

              {user.role === 'STAFF_MANAGER' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('StaffPortalTab')}
                  style={[styles.portalBtn, { backgroundColor: COLORS.cyan }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bar-chart" size={18} color={COLORS.white} />
                  <Text style={styles.portalBtnText}>Vào Bảng Điều hành & KPI</Text>
                </TouchableOpacity>
              )}

              {user.role === 'ADMIN' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('StaffPortalTab')}
                  style={[styles.portalBtn, { backgroundColor: COLORS.rose }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.white} />
                  <Text style={styles.portalBtnText}>Vào Trung tâm Quản trị Toàn quyền</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.rose} />
                <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Switch Role Bar */}
          <View style={styles.switchSection}>
            <View style={styles.switchTitleRow}>
              <Ionicons name="swap-horizontal" size={14} color={COLORS.slate400} />
              <Text style={styles.switchTitle}>Chuyển nhanh tài khoản demo</Text>
            </View>
            <View style={styles.quickRoles}>

              <TouchableOpacity
                onPress={() => handleQuickLogin('CUSTOMER')}
                style={[styles.rolePill, user.role === 'CUSTOMER' && styles.rolePillActive]}
                disabled={loading}
                activeOpacity={0.75}
              >
                <View style={styles.rolePillLeft}>
                  <View style={[styles.roleIcon, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.roleEmoji}>🌟</Text>
                  </View>
                  <View>
                    <Text style={[styles.rolePillText, user.role === 'CUSTOMER' && styles.rolePillTextActive]}>Khách hàng</Text>
                    <Text style={styles.rolePillSub}>customer@vietsky.vn</Text>
                  </View>
                </View>
                {user.role === 'CUSTOMER'
                  ? <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                  : <Ionicons name="chevron-forward" size={16} color={COLORS.slate300} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickLogin('STAFF')}
                style={[styles.rolePill, user.role === 'STAFF' && styles.rolePillActive]}
                disabled={loading}
                activeOpacity={0.75}
              >
                <View style={styles.rolePillLeft}>
                  <View style={[styles.roleIcon, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.roleEmoji}>✈️</Text>
                  </View>
                  <View>
                    <Text style={[styles.rolePillText, user.role === 'STAFF' && styles.rolePillTextActive]}>Nhân viên</Text>
                    <Text style={styles.rolePillSub}>staff@vietsky.vn</Text>
                  </View>
                </View>
                {user.role === 'STAFF'
                  ? <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                  : <Ionicons name="chevron-forward" size={16} color={COLORS.slate300} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickLogin('STAFF_MANAGER')}
                style={[styles.rolePill, user.role === 'STAFF_MANAGER' && styles.rolePillActive]}
                disabled={loading}
                activeOpacity={0.75}
              >
                <View style={styles.rolePillLeft}>
                  <View style={[styles.roleIcon, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={styles.roleEmoji}>📊</Text>
                  </View>
                  <View>
                    <Text style={[styles.rolePillText, user.role === 'STAFF_MANAGER' && styles.rolePillTextActive]}>Quản lý</Text>
                    <Text style={styles.rolePillSub}>manager@vietsky.vn</Text>
                  </View>
                </View>
                {user.role === 'STAFF_MANAGER'
                  ? <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                  : <Ionicons name="chevron-forward" size={16} color={COLORS.slate300} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickLogin('ADMIN')}
                style={[styles.rolePill, user.role === 'ADMIN' && styles.rolePillActive]}
                disabled={loading}
                activeOpacity={0.75}
              >
                <View style={styles.rolePillLeft}>
                  <View style={[styles.roleIcon, { backgroundColor: '#fee2e2' }]}>
                    <Text style={styles.roleEmoji}>🛡️</Text>
                  </View>
                  <View>
                    <Text style={[styles.rolePillText, user.role === 'ADMIN' && styles.rolePillTextActive]}>Quản trị viên</Text>
                    <Text style={styles.rolePillSub}>admin@vietsky.vn</Text>
                  </View>
                </View>
                {user.role === 'ADMIN'
                  ? <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                  : <Ionicons name="chevron-forward" size={16} color={COLORS.slate300} />}
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

                    {/* Quick Demo Accounts for Testing */}
                    <View style={styles.demoSection}>
                      <View style={styles.demoSectionHeader}>
                        <Ionicons name="sparkles" size={14} color={COLORS.gold} />
                        <Text style={styles.demoTitle}>CHỌN TÀI KHOẢN MẪU TRẢI NGHIỆM</Text>
                      </View>

                      {/* Customer Group */}
                      <Text style={styles.roleGroupHeading}>1. VAI TRÒ HÀNH KHÁCH / KHÁCH HÀNG</Text>
                      <TouchableOpacity
                        onPress={() => handleQuickLogin('CUSTOMER')}
                        style={styles.demoRoleCard}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <View style={[styles.demoRoleIcon, { backgroundColor: '#fef3c7' }]}>
                          <Text style={styles.roleEmoji}>🌟</Text>
                        </View>
                        <View style={styles.demoRoleInfo}>
                          <Text style={styles.demoRoleName}>Khách hàng Hội viên (Customer)</Text>
                          <Text style={styles.demoRoleDesc}>Đặt vé, tích lũy dặm bay Lotus, tra cứu vé cá nhân</Text>
                          <Text style={styles.demoRoleEmail}>customer@vietsky.vn</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={COLORS.gold} />
                      </TouchableOpacity>

                      {/* Airline Operations Group */}
                      <Text style={styles.roleGroupHeading}>2. VAI TRÒ NỘI BỘ VẬN HÀNH HÃNG BAY</Text>
                      <TouchableOpacity
                        onPress={() => handleQuickLogin('STAFF')}
                        style={styles.demoRoleCard}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <View style={[styles.demoRoleIcon, { backgroundColor: '#d1fae5' }]}>
                          <Text style={styles.roleEmoji}>✈️</Text>
                        </View>
                        <View style={styles.demoRoleInfo}>
                          <Text style={styles.demoRoleName}>Nhân viên Mặt đất (Ground Staff)</Text>
                          <Text style={styles.demoRoleDesc}>Theo dõi lịch bay, soát vé, quản lý cổng khởi hành</Text>
                          <Text style={styles.demoRoleEmail}>staff@vietsky.vn</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={COLORS.emerald} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleQuickLogin('STAFF_MANAGER')}
                        style={styles.demoRoleCard}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <View style={[styles.demoRoleIcon, { backgroundColor: '#e0f2fe' }]}>
                          <Text style={styles.roleEmoji}>📊</Text>
                        </View>
                        <View style={styles.demoRoleInfo}>
                          <Text style={styles.demoRoleName}>Trưởng phòng Điều hành (Manager)</Text>
                          <Text style={styles.demoRoleDesc}>Doanh thu tháng, KPI, duyệt hoàn tiền & đổi vé</Text>
                          <Text style={styles.demoRoleEmail}>manager@vietsky.vn</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={COLORS.cyan} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleQuickLogin('ADMIN')}
                        style={styles.demoRoleCard}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <View style={[styles.demoRoleIcon, { backgroundColor: '#fee2e2' }]}>
                          <Text style={styles.roleEmoji}>🛡️</Text>
                        </View>
                        <View style={styles.demoRoleInfo}>
                          <Text style={styles.demoRoleName}>Quản trị viên Hệ thống (Admin)</Text>
                          <Text style={styles.demoRoleDesc}>Toàn quyền quản trị hệ thống, dữ liệu bay và người dùng</Text>
                          <Text style={styles.demoRoleEmail}>admin@vietsky.vn</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={24} color={COLORS.rose} />
                      </TouchableOpacity>
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
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
  },
  demoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 0.5,
  },
  roleGroupHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate400,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  demoRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  demoRoleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoRoleInfo: {
    flex: 1,
  },
  demoRoleName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },
  demoRoleDesc: {
    fontSize: 10,
    color: COLORS.slate500,
    marginTop: 1,
    lineHeight: 14,
  },
  demoRoleEmail: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.goldDark,
    marginTop: 2,
  },
  quickRoles: {
    gap: 10,
  },
  rolePill: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rolePillActive: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  rolePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmoji: {
    fontSize: 18,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  rolePillTextActive: {
    color: COLORS.goldDark,
  },
  rolePillSub: {
    fontSize: 11,
    color: COLORS.slate400,
    marginTop: 1,
  },

  // Logged-in profile styles
  profileHero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.white,
  },
  profileHeroBg: {
    backgroundColor: COLORS.navy,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  profileActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
  },
  portalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.rose,
  },
  switchSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 32,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
