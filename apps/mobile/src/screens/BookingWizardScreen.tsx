import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { SeatMapModal } from '../components/SeatMapModal';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export const BookingWizardScreen = ({ navigation }: any) => {
  const {
    outboundFlight,
    cabinClass,
    passengers,
    setPassengers,
    selectedSeats,
    setSeats,
    baggageWeight,
    setBaggageWeight,
    hasMeal,
    setHasMeal,
    hasInsurance,
    setHasInsurance,
    hasPriority,
    setHasPriority,
    baseFareTotal,
    taxesAndFees,
    servicesTotal,
    grandTotal,
    sessionId,
  } = useBooking();

  const { user } = useAuth();

  // Contact Info
  const [contactName, setContactName] = useState(user?.fullName || 'NGUYEN VAN AN');
  const [contactEmail, setContactEmail] = useState(user?.email || 'customer@vietsky.vn');
  const [contactPhone, setContactPhone] = useState(user?.phone || '0901234567');

  // Passenger form
  const [lastName, setLastName] = useState('NGUYEN VAN');
  const [firstName, setFirstName] = useState('AN');
  const [passportNumber, setPassportNumber] = useState('079201008899');
  const [dateOfBirth, setDateOfBirth] = useState('1995-05-15');

  // Modal
  const [seatModalVisible, setSeatModalVisible] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'EWALLET' | 'BANK_TRANSFER'>('CREDIT_CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!outboundFlight) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.centerText}>Chưa có chuyến bay nào được chọn.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backHomeBtn}>
          <Text style={styles.backHomeText}>Quay lại trang tìm kiếm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCheckout = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin liên hệ');
      return;
    }

    if (!lastName.trim() || !firstName.trim() || !passportNumber.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số CCCD/Hộ chiếu hành khách');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Prepare Services
      const servicesList: any[] = [];
      if (baggageWeight > 0) {
        servicesList.push({
          serviceType: 'BAGGAGE',
          serviceName: `Hành lý ký gửi ${baggageWeight}kg`,
          quantity: 1,
          unitPrice: baggageWeight === 10 ? 180000 : baggageWeight === 20 ? 320000 : 450000,
        });
      }
      if (hasMeal) {
        servicesList.push({
          serviceType: 'MEAL',
          serviceName: 'Suất ăn nóng chọn trước',
          quantity: passengers.length,
          unitPrice: 150000,
        });
      }
      if (hasInsurance) {
        servicesList.push({
          serviceType: 'INSURANCE',
          serviceName: 'Bảo hiểm chuyến bay toàn diện',
          quantity: passengers.length,
          unitPrice: 120000,
        });
      }
      if (hasPriority) {
        servicesList.push({
          serviceType: 'PRIORITY_BOARDING',
          serviceName: 'Ưu tiên lên tàu bay SkyPriority',
          quantity: passengers.length,
          unitPrice: 100000,
        });
      }

      // 2. Create Booking
      const bookingRes = await api.createBooking({
        outboundFlightId: outboundFlight.id,
        cabinClass,
        sessionId,
        contactEmail,
        contactPhone,
        contactName,
        passengers: [
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            passengerType: 'ADULT',
            dateOfBirth,
            passportNumber: passportNumber.trim(),
            nationality: 'VNM',
          },
        ],
        outboundSeats: selectedSeats.length > 0 ? selectedSeats : ['12A'],
        services: servicesList,
      });

      // 3. Process Checkout Payment
      const payRes = await api.checkout({
        pnr: bookingRes.pnr,
        method: paymentMethod,
        paymentType: 'FULL',
        amount: grandTotal,
      });

      setIsSubmitting(false);

      // Navigate to Confirmation
      navigation.navigate('BookingSuccess', {
        booking: bookingRes,
        payment: payRes,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Lỗi đặt vé', err.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Đặt vé máy bay" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selected Flight Summary */}
        <View style={styles.flightSummary}>
          <View style={styles.summaryTop}>
            <Text style={styles.flightNumber}>{outboundFlight.flightNumber}</Text>
            <View style={styles.classBadge}>
              <Text style={styles.classBadgeText}>
                {cabinClass === 'BUSINESS' ? '✨ Hạng Thương gia' : 'Hạng Phổ thông'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRoute}>
            <Text style={styles.routeCity}>{outboundFlight.originAirport?.city} ({outboundFlight.originAirport?.code})</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.slate400} />
            <Text style={styles.routeCity}>{outboundFlight.destinationAirport?.city} ({outboundFlight.destinationAirport?.code})</Text>
          </View>
        </View>

        {/* Section 1: Passenger Info */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color={COLORS.navy} />
            <Text style={styles.sectionTitle}>1. Thông tin hành khách</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Họ và tên đệm *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="NGUYEN VAN"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Tên *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="AN"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Số CCCD / Hộ chiếu *</Text>
              <TextInput
                style={styles.input}
                value={passportNumber}
                onChangeText={setPassportNumber}
                placeholder="079201008899"
              />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Seat Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={18} color={COLORS.navy} />
            <Text style={styles.sectionTitle}>2. Chỗ ngồi trên tàu bay</Text>
          </View>

          <View style={styles.seatPreviewRow}>
            <View>
              <Text style={styles.seatStatusLabel}>Ghế đã chọn:</Text>
              <Text style={styles.seatNumberDisplay}>
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn (Hệ thống xếp tự động)'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSeatModalVisible(true)}
              style={styles.chooseSeatBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="airplane-outline" size={16} color={COLORS.white} />
              <Text style={styles.chooseSeatText}>
                {selectedSeats.length > 0 ? 'Đổi ghế' : 'Chọn chỗ ngồi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Ancillary Services */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={18} color={COLORS.navy} />
            <Text style={styles.sectionTitle}>3. Dịch vụ bổ trợ</Text>
          </View>

          {/* Baggage */}
          <View style={styles.serviceItem}>
            <View style={styles.serviceInfo}>
              <Ionicons name="bag-handle" size={20} color={COLORS.navy} />
              <View>
                <Text style={styles.serviceName}>Hành lý ký gửi thêm</Text>
                <Text style={styles.serviceDesc}>Tiêu chuẩn: 20kg ký gửi + 7kg xách tay</Text>
              </View>
            </View>
            <View style={styles.baggagePills}>
              {[0, 10, 20, 30].map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => setBaggageWeight(w)}
                  style={[styles.baggagePill, baggageWeight === w && styles.baggagePillActive]}
                >
                  <Text style={[styles.baggagePillText, baggageWeight === w && styles.whiteText]}>
                    {w === 0 ? '0kg' : `+${w}kg`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meals */}
          <TouchableOpacity
            onPress={() => setHasMeal(!hasMeal)}
            style={styles.serviceCheckboxRow}
            activeOpacity={0.7}
          >
            <View style={styles.serviceCheckboxLeft}>
              <Ionicons
                name={hasMeal ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasMeal ? COLORS.navy : COLORS.slate400}
              />
              <View>
                <Text style={styles.serviceName}>Suất ăn nóng chọn trước</Text>
                <Text style={styles.serviceDesc}>Cơm bò sốt tiêu hoặc mỳ Ý hải sản</Text>
              </View>
            </View>
            <Text style={styles.servicePrice}>+150.000 đ</Text>
          </TouchableOpacity>

          {/* Insurance */}
          <TouchableOpacity
            onPress={() => setHasInsurance(!hasInsurance)}
            style={styles.serviceCheckboxRow}
            activeOpacity={0.7}
          >
            <View style={styles.serviceCheckboxLeft}>
              <Ionicons
                name={hasInsurance ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasInsurance ? COLORS.navy : COLORS.slate400}
              />
              <View>
                <Text style={styles.serviceName}>Bảo hiểm chuyến bay toàn diện</Text>
                <Text style={styles.serviceDesc}>Bồi thường hoãn/hủy chuyến và y tế</Text>
              </View>
            </View>
            <Text style={styles.servicePrice}>+120.000 đ</Text>
          </TouchableOpacity>

          {/* Priority */}
          <TouchableOpacity
            onPress={() => setHasPriority(!hasPriority)}
            style={styles.serviceCheckboxRow}
            activeOpacity={0.7}
          >
            <View style={styles.serviceCheckboxLeft}>
              <Ionicons
                name={hasPriority ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasPriority ? COLORS.navy : COLORS.slate400}
              />
              <View>
                <Text style={styles.serviceName}>SkyPriority: Ưu tiên lên tàu bay</Text>
                <Text style={styles.serviceDesc}>Lối đi riêng và ưu tiên nhận hành lý</Text>
              </View>
            </View>
            <Text style={styles.servicePrice}>+100.000 đ</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Payment Method */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={18} color={COLORS.navy} />
            <Text style={styles.sectionTitle}>4. Phương thức thanh toán</Text>
          </View>

          <View style={styles.payMethodsRow}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('CREDIT_CARD')}
              style={[styles.payMethodBtn, paymentMethod === 'CREDIT_CARD' && styles.payMethodActive]}
            >
              <Ionicons name="card-outline" size={22} color={paymentMethod === 'CREDIT_CARD' ? COLORS.navy : COLORS.slate500} />
              <Text style={[styles.payMethodText, paymentMethod === 'CREDIT_CARD' && styles.payMethodTextActive]}>
                Thẻ Visa/Master
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('EWALLET')}
              style={[styles.payMethodBtn, paymentMethod === 'EWALLET' && styles.payMethodActive]}
            >
              <Ionicons name="wallet-outline" size={22} color={paymentMethod === 'EWALLET' ? COLORS.navy : COLORS.slate500} />
              <Text style={[styles.payMethodText, paymentMethod === 'EWALLET' && styles.payMethodTextActive]}>
                Ví MoMo / VNPay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('BANK_TRANSFER')}
              style={[styles.payMethodBtn, paymentMethod === 'BANK_TRANSFER' && styles.payMethodActive]}
            >
              <Ionicons name="qr-code-outline" size={22} color={paymentMethod === 'BANK_TRANSFER' ? COLORS.navy : COLORS.slate500} />
              <Text style={[styles.payMethodText, paymentMethod === 'BANK_TRANSFER' && styles.payMethodTextActive]}>
                Chuyển khoản QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Breakdown Card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Chi tiết biểu giá</Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Giá vé cơ bản ({passengers.length} khách):</Text>
            <Text style={styles.priceLineValue}>{baseFareTotal.toLocaleString('vi-VN')} VND</Text>
          </View>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Thuế, phí sân bay & an ninh:</Text>
            <Text style={styles.priceLineValue}>{taxesAndFees.toLocaleString('vi-VN')} VND</Text>
          </View>
          {servicesTotal > 0 && (
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>Phí dịch vụ bổ trợ:</Text>
              <Text style={styles.priceLineValue}>+{servicesTotal.toLocaleString('vi-VN')} VND</Text>
            </View>
          )}
          <View style={[styles.priceLine, styles.totalLine]}>
            <Text style={styles.grandTotalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.grandTotalValue}>{grandTotal.toLocaleString('vi-VN')} VND</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={isSubmitting}
          style={styles.checkoutBtn}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.checkoutBtnText}>XÁC NHẬN & THANH TOÁN NGAY</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Seat Map Bottom Sheet Modal */}
      <SeatMapModal
        visible={seatModalVisible}
        flightId={outboundFlight.id}
        cabinClass={cabinClass}
        requiredSeatsCount={passengers.length}
        sessionId={sessionId}
        initialSelectedSeats={selectedSeats}
        onClose={() => setSeatModalVisible(false)}
        onConfirm={(seats, details) => setSeats(seats, details)}
      />
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    fontSize: 16,
    color: COLORS.slate600,
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backHomeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  flightSummary: {
    backgroundColor: COLORS.navy,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
  },
  classBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.goldLight,
  },
  summaryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  routeCity: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate200,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate900,
  },
  seatPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatStatusLabel: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  seatNumberDisplay: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.navy,
    marginTop: 2,
  },
  chooseSeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chooseSeatText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  serviceItem: {
    marginBottom: 14,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  serviceDesc: {
    fontSize: 10,
    color: COLORS.slate500,
    marginTop: 1,
  },
  baggagePills: {
    flexDirection: 'row',
    gap: 8,
  },
  baggagePill: {
    flex: 1,
    backgroundColor: COLORS.slate100,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  baggagePillActive: {
    backgroundColor: COLORS.navy,
  },
  baggagePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  whiteText: {
    color: COLORS.white,
  },
  serviceCheckboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  serviceCheckboxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },
  payMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payMethodBtn: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  payMethodActive: {
    borderColor: COLORS.navy,
    backgroundColor: '#f0f6ff',
  },
  payMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate600,
    textAlign: 'center',
  },
  payMethodTextActive: {
    color: COLORS.navy,
    fontWeight: '800',
  },
  priceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  priceCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 6,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLineLabel: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  priceLineValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  totalLine: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.slate900,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
