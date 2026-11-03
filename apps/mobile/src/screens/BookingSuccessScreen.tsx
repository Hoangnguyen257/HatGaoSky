import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { BoardingPassCard } from '../components/BoardingPassCard';
import { useBooking } from '../context/BookingContext';

export const BookingSuccessScreen = ({ route, navigation }: any) => {
  const { booking, payment } = route.params || {};
  const { resetBooking } = useBooking();

  const pnr = booking?.pnr || 'VSK89A';

  const handleFinish = () => {
    resetBooking();
    navigation.navigate('Home');
  };

  const handleViewBoardingPass = () => {
    navigation.navigate('BoardingPass', { booking });
  };

  return (
    <View style={styles.container}>
      <Header title="Xác nhận đặt vé" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-sharp" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Đặt vé thành công!</Text>
          <Text style={styles.subtitle}>
            Vé máy bay điện tử và thẻ lên tàu bay đã được xuất trên hệ thống.
          </Text>

          {/* PNR Box */}
          <View style={styles.pnrContainer}>
            <Text style={styles.pnrTitle}>MÃ ĐẶT CHỖ (PNR)</Text>
            <Text style={styles.pnrCode}>{pnr}</Text>
            <Text style={styles.pnrNote}>Quý khách vui lòng lưu lại mã này để làm thủ tục bay</Text>
          </View>
        </View>

        {/* Boarding Pass Preview */}
        <View style={styles.passWrapper}>
          <Text style={styles.sectionHeading}>THẺ LÊN TÀU BAY ĐIỆN TỬ</Text>
          <BoardingPassCard booking={booking} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleViewBoardingPass} style={styles.primaryBtn} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={18} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Xem Thẻ lên tàu bay chi tiết</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFinish} style={styles.secondaryBtn} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
          </TouchableOpacity>
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
  successHeader: {
    backgroundColor: COLORS.navy,
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.slate200,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  pnrContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pnrTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  pnrCode: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginVertical: 4,
  },
  pnrNote: {
    fontSize: 10,
    color: COLORS.slate300,
  },
  passWrapper: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate500,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate700,
  },
});
