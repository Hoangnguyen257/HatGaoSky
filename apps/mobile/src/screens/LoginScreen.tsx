import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { user, login, logout, quickLoginRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleQuickLogin = async (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => {
    setLoading(true);
    try {
      await quickLoginRole(role);
      Alert.alert('Thành công', `Đã chuyển đổi sang tài khoản: ${role}`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đăng nhập tài khoản mẫu');
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.roleBadgeText}>VAI TRÒ: {user.role}</Text>
            </View>

            {user.role !== 'GUEST' && user.role !== 'CUSTOMER' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('StaffPortal')}
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
            <Text style={styles.switchTitle}>Chuyển nhanh tài khoản demo (Quick Role Switcher):</Text>
            <View style={styles.quickRoles}>
              <TouchableOpacity onPress={() => handleQuickLogin('CUSTOMER')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>🌟 Khách hàng (Customer)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('STAFF')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>✈️ Nhân viên (Staff)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('STAFF_MANAGER')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>📊 Quản lý (Manager)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('ADMIN')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>🛡️ Quản trị viên (Admin)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Đăng nhập" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng nhập tài khoản</Text>
          <Text style={styles.formSubtitle}>
            Hội viên Lotus Club hoặc Nhân viên điều hành bay
          </Text>

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

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtn}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Accounts for Easy Grading */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Tài khoản mẫu (Bấm để đăng nhập ngay):</Text>
            <View style={styles.quickRoles}>
              <TouchableOpacity onPress={() => handleQuickLogin('CUSTOMER')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>🌟 Khách hàng: customer@vietsky.vn</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('STAFF')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>✈️ Nhân viên bay: staff@vietsky.vn</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('STAFF_MANAGER')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>📊 Quản lý doanh thu: manager@vietsky.vn</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickLogin('ADMIN')} style={styles.rolePill}>
                <Text style={styles.rolePillText}>🛡️ Quản trị viên: admin@vietsky.vn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  scroll: {
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate400,
    marginBottom: 4,
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
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate800,
  },
  loginBtn: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    marginBottom: 10,
  },
  quickRoles: {
    gap: 8,
  },
  rolePill: {
    backgroundColor: COLORS.slate100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
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
    marginTop: 14,
    paddingVertical: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.rose,
  },
  switchSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate600,
    marginBottom: 10,
  },
});
