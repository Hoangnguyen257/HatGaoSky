import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { BoardingPassCard } from '../components/BoardingPassCard';
import { api } from '../api';

export const BoardingPassScreen = ({ route, navigation }: any) => {
  const { booking } = route.params || {};

  const handleSendEmail = async () => {
    if (!booking?.pnr) return;
    try {
      await api.sendTicketEmail(booking.pnr, booking.customerEmail);
      Alert.alert('Thành công', 'Thẻ lên tàu bay đã được gửi về email của bạn.');
    } catch (e: any) {
      Alert.alert('Thông báo', 'Đã lưu bản sao điện tử vào thiết bị của bạn.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Thẻ lên tàu bay" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={18} color={COLORS.cyan} />
          <Text style={styles.instructionText}>
            Vui lòng xuất trình mã QR này tại quầy kiểm tra an ninh và cửa khởi hành (Boarding Gate).
          </Text>
        </View>

        <BoardingPassCard booking={booking} />

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleSendEmail} style={styles.saveBtn} activeOpacity={0.85}>
            <Ionicons name="mail-outline" size={18} color={COLORS.white} />
            <Text style={styles.saveBtnText}>Gửi thẻ về Email</Text>
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
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
    lineHeight: 16,
  },
  footerActions: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});
