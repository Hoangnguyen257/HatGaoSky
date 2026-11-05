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
import { BoardingPassCard } from '../components/BoardingPassCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const ManageBookingScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [pnr, setPnr] = useState('VSK89A');
  const [email, setEmail] = useState(user?.email || 'customer@vietsky.vn');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  const handleLookup = async (lookupPnr?: string, lookupEmail?: string) => {
    const targetPnr = (lookupPnr || pnr).trim().toUpperCase();
    const targetEmail = (lookupEmail || email).trim();

    if (!targetPnr) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã đặt chỗ (PNR 6 ký tự)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.lookupBooking({
        pnr: targetPnr,
        email: targetEmail || undefined,
      });
      setBooking(data);
    } catch (err: any) {
      Alert.alert('Không tìm thấy vé', err.message || 'Mã PNR hoặc email không khớp');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!booking?.pnr) return;
    setEmailSending(true);
    try {
      await api.sendTicketEmail(booking.pnr, email);
      Alert.alert('Thành công', `Vé điện tử và thẻ lên tàu bay đã được gửi về email ${email}`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi email lúc này');
    } finally {
      setEmailSending(false);
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Xác nhận hủy vé',
      'Theo quy định hàng không, phí hủy vé là 300.000 VND. Số tiền còn lại sẽ được hoàn tự động về phương thức thanh toán ban đầu. Bạn có chắc chắn muốn hủy?',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelBooking(booking.pnr, { reason: 'Thay đổi kế hoạch cá nhân' });
              Alert.alert('Đã hủy vé', 'Yêu cầu hủy vé đã được thực hiện thành công.');
              handleLookup();
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể hủy vé');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Quản lý đặt chỗ" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search Box */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Tra cứu vé & Thẻ lên tàu bay</Text>
          <Text style={styles.searchSubtitle}>
            Nhập Mã đặt chỗ (PNR) và địa chỉ Email đã dùng khi mua vé.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MÃ ĐẶT CHỖ (PNR) *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="pricetag-outline" size={18} color={COLORS.navy} />
              <TextInput
                style={styles.textInput}
                value={pnr}
                onChangeText={(t) => setPnr(t.toUpperCase())}
                placeholder="VD: VSK89A"
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL LIÊN HỆ *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleLookup()}
            disabled={loading}
            style={styles.searchBtn}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="search" size={18} color={COLORS.white} />
                <Text style={styles.searchBtnText}>TRA CỨU VÉ</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Sample Button */}
          <TouchableOpacity
            onPress={() => {
              setPnr('VSK89A');
              setEmail('customer@vietsky.vn');
              handleLookup('VSK89A', 'customer@vietsky.vn');
            }}
            style={styles.sampleBtn}
          >
            <Text style={styles.sampleBtnText}>🎯 Thử tra cứu vé mẫu (PNR: VSK89A)</Text>
          </TouchableOpacity>
        </View>

        {/* Results View */}
        {booking && (
          <View style={styles.resultContainer}>
            <View style={styles.statusBanner}>
              <View style={styles.statusLeft}>
                <Ionicons
                  name={booking.status === 'CONFIRMED' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={booking.status === 'CONFIRMED' ? COLORS.emerald : COLORS.rose}
                />
                <Text style={styles.statusText}>
                  Trạng thái: {booking.status === 'CONFIRMED' ? 'Đã xác nhận & Giữ chỗ' : booking.status}
                </Text>
              </View>
              <Text style={styles.pnrBadgeText}>{booking.pnr}</Text>
            </View>

            {/* Boarding Pass */}
            <BoardingPassCard booking={booking} />

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleSendEmail}
                disabled={emailSending}
                style={[styles.actionBtn, styles.emailBtn]}
                activeOpacity={0.8}
              >
                {emailSending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="mail" size={16} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>Gửi vé về Email</Text>
                  </>
                )}
              </TouchableOpacity>

              {booking.status === 'CONFIRMED' && (
                <TouchableOpacity
                  onPress={handleCancelBooking}
                  style={[styles.actionBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.rose} />
                  <Text style={[styles.actionBtnText, { color: COLORS.rose }]}>Hủy vé & Hoàn tiền</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  searchSubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 4,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate400,
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
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  sampleBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  sampleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.cyan,
  },
  resultContainer: {
    marginTop: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  pnrBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.navy,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emailBtn: {
    backgroundColor: COLORS.navy,
  },
  cancelBtn: {
    backgroundColor: COLORS.roseLight,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

