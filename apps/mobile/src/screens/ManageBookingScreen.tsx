import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { BoardingPassCard } from '../components/BoardingPassCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const ManageBookingScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isOperator = user?.role === 'STAFF' || user?.role === 'STAFF_MANAGER' || user?.role === 'ADMIN';
  const isGuest = !user;

  // States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Guest lookup state
  const [pnr, setPnr] = useState('VSK89A');
  const [email, setEmail] = useState('');
  const [guestBooking, setGuestBooking] = useState<any | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [showLookupForCustomer, setShowLookupForCustomer] = useState(false);

  // Operator search state
  const [operatorSearch, setOperatorSearch] = useState('');
  const [operatorModalBooking, setOperatorModalBooking] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [user?.role, user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isCustomer) {
        const list = await api.getMyBookings();
        setMyBookings(Array.isArray(list) ? list : []);
      } else if (isOperator) {
        const list = await api.getBookingRequests();
        setAllBookings(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      console.warn('Error loading bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Guest lookup handler
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
      setGuestBooking(data);
    } catch (err: any) {
      Alert.alert('Không tìm thấy vé', err.message || 'Mã PNR hoặc email không khớp');
      setGuestBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (targetBooking: any) => {
    if (!targetBooking?.pnr) return;
    setEmailSending(true);
    try {
      await api.sendTicketEmail(targetBooking.pnr, targetBooking.customerEmail || email);
      Alert.alert('Thành công', `Vé điện tử và thẻ lên tàu bay đã được gửi về email.`);
    } catch (err: any) {
      Alert.alert('Thông báo', 'Đã lưu bản sao vé điện tử trên thiết bị của bạn.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleCancelBooking = async (targetBooking: any) => {
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
              await api.cancelBooking(targetBooking.pnr, { reason: 'Khách yêu cầu hủy vé' });
              Alert.alert('Đã hủy vé', 'Yêu cầu hủy vé đã được thực hiện thành công.');
              loadData();
              if (selectedBooking) setSelectedBooking(null);
              if (guestBooking) setGuestBooking(null);
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể hủy vé');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (v: number) => (v || 0).toLocaleString('vi-VN') + ' đ';

  const formatDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const formatTime = (dStr: string) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    } catch {
      return dStr;
    }
  };

  // Filter operator bookings
  const filteredOperatorBookings = useMemo(() => {
    if (!operatorSearch.trim()) return allBookings;
    const q = operatorSearch.toLowerCase().trim();
    return allBookings.filter(
      (b) =>
        b.pnr?.toLowerCase().includes(q) ||
        b.customerName?.toLowerCase().includes(q) ||
        b.customerEmail?.toLowerCase().includes(q)
    );
  }, [allBookings, operatorSearch]);

  // ==========================================
  // VIEW 1: CUSTOMER VIEW (ĐÃ ĐĂNG NHẬP)
  // ==========================================
  if (isCustomer) {
    // Sub-view: Customer viewing full ticket details & boarding pass
    if (selectedBooking) {
      return (
        <View style={styles.container}>
          <Header
            title="Chi tiết vé máy bay"
            showBack
            onBack={() => setSelectedBooking(null)}
          />
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.ticketDetailBanner}>
              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => setSelectedBooking(null)}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.navy} />
                <Text style={styles.backToListText}>Danh sách vé của tôi</Text>
              </TouchableOpacity>
              <View style={styles.statusPillLarge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                <Text style={styles.statusPillLargeText}>
                  {selectedBooking.status === 'CONFIRMED' ? 'Đã xác nhận & Giữ chỗ' : selectedBooking.status}
                </Text>
              </View>
            </View>

            {/* Boarding Pass with QR code */}
            <BoardingPassCard booking={selectedBooking} />

            {/* Actions for this booking */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => handleSendEmail(selectedBooking)}
                disabled={emailSending}
                style={[styles.actionBtn, styles.emailBtn]}
                activeOpacity={0.8}
              >
                {emailSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="mail" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Gửi vé về Email</Text>
                  </>
                )}
              </TouchableOpacity>

              {selectedBooking.status === 'CONFIRMED' && (
                <TouchableOpacity
                  onPress={() => handleCancelBooking(selectedBooking)}
                  style={[styles.actionBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.rose} />
                  <Text style={[styles.actionBtnText, { color: COLORS.rose }]}>Hủy vé & Hoàn tiền</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      );
    }

    // Default Customer View: List of their own booked flights
    return (
      <View style={styles.container}>
        <Header title="Quản lý vé của tôi" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Welcome Banner */}
          <View style={styles.customerHeaderCard}>
            <View style={styles.customerHeaderRow}>
              <View>
                <Text style={styles.customerGreeting}>HỘI VIÊN VIETSKY</Text>
                <Text style={styles.customerName}>{user.fullName}</Text>
              </View>
              <View style={styles.bookingCountBadge}>
                <Ionicons name="ticket" size={14} color={COLORS.gold} />
                <Text style={styles.bookingCountText}>{myBookings.length} vé đã đặt</Text>
              </View>
            </View>
            <Text style={styles.customerHint}>
              Dưới đây là các chuyến bay do chính bạn đặt. Chạm vào vé để xem Thẻ lên tàu bay & mã QR.
            </Text>
          </View>

          {/* Bookings List */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.navy} />
              <Text style={styles.loadingText}>Đang tải vé của bạn...</Text>
            </View>
          ) : myBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="airplane-outline" size={40} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>Bạn chưa có chuyến bay nào</Text>
              <Text style={styles.emptySubtitle}>
                Các vé bạn đặt trên ứng dụng hoặc website sẽ tự động xuất hiện tại đây.
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => navigation.navigate('FlightSearchTab')}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.bookNowText}>Tìm kiếm & Đặt vé ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {myBookings.map((b) => {
                const ticket = b.tickets?.[0];
                const flt = ticket?.flight || b.outboundFlight || {};
                const passenger = b.passengers?.[0] || ticket?.passenger;
                const depTime = flt.departureTime || b.createdAt;

                return (
                  <View key={b.id || b.pnr} style={styles.bookingCard}>
                    {/* Top Row: Route & PNR */}
                    <View style={styles.cardHeader}>
                      <View style={styles.routeCol}>
                        <Text style={styles.routeAirports}>
                          {flt.originAirport?.code || 'SGN'} ➔ {flt.destinationAirport?.code || 'HAN'}
                        </Text>
                        <Text style={styles.routeCities}>
                          {flt.originAirport?.city || 'Hồ Chí Minh'} đến {flt.destinationAirport?.city || 'Hà Nội'}
                        </Text>
                      </View>
                      <View style={styles.pnrPill}>
                        <Text style={styles.pnrPillLabel}>PNR</Text>
                        <Text style={styles.pnrPillCode}>{b.pnr}</Text>
                      </View>
                    </View>

                    {/* Flight Info Grid */}
                    <View style={styles.cardInfoGrid}>
                      <View style={styles.cardInfoItem}>
                        <Text style={styles.cardInfoLabel}>CHUYẾN BAY</Text>
                        <Text style={styles.cardInfoVal}>{flt.flightNumber || 'VSK-102'}</Text>
                      </View>
                      <View style={styles.cardInfoItem}>
                        <Text style={styles.cardInfoLabel}>NGÀY BAY</Text>
                        <Text style={styles.cardInfoVal}>{formatDate(depTime)}</Text>
                      </View>
                      <View style={styles.cardInfoItem}>
                        <Text style={styles.cardInfoLabel}>GIỜ CẤT CÁNH</Text>
                        <Text style={[styles.cardInfoVal, { color: COLORS.cyan }]}>{formatTime(depTime)}</Text>
                      </View>
                    </View>

                    {/* Passenger & Seat */}
                    <View style={styles.passengerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.passengerLabel}>HÀNH KHÁCH</Text>
                        <Text style={styles.passengerName}>
                          {passenger ? `${passenger.lastName} ${passenger.firstName}`.toUpperCase() : b.customerName?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.passengerLabel}>GHẾ NGỒI</Text>
                        <Text style={styles.seatBadgeText}>
                          {ticket?.seat?.seatNumber || b.outboundSeats?.[0] || 'Tự động xếp'}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Action: View Boarding Pass Button */}
                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => setSelectedBooking(b)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#fff" />
                      <Text style={styles.viewDetailBtnText}>Xem Thẻ lên tàu bay & Mã QR</Text>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Optional: Look up another PNR link */}
          <View style={styles.otherLookupSection}>
            <TouchableOpacity
              onPress={() => setShowLookupForCustomer(!showLookupForCustomer)}
              style={styles.toggleLookupBtn}
            >
              <Ionicons
                name={showLookupForCustomer ? 'chevron-up-circle' : 'search-circle-outline'}
                size={18}
                color={COLORS.slate500}
              />
              <Text style={styles.toggleLookupText}>
                {showLookupForCustomer ? 'Ẩn ô tra cứu PNR khác' : 'Tra cứu vé khác bằng mã PNR'}
              </Text>
            </TouchableOpacity>

            {showLookupForCustomer && (
              <View style={styles.searchCardCompact}>
                <View style={styles.inputRow}>
                  <Ionicons name="pricetag-outline" size={16} color={COLORS.navy} />
                  <TextInput
                    style={styles.textInput}
                    value={pnr}
                    onChangeText={(t) => setPnr(t.toUpperCase())}
                    placeholder="Mã PNR (6 ký tự)"
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    onPress={() => handleLookup()}
                    style={styles.compactSearchBtn}
                    disabled={loading}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                {guestBooking && (
                  <View style={{ marginTop: 12 }}>
                    <BoardingPassCard booking={guestBooking} />
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: OPERATOR / MANAGER / ADMIN VIEW
  // ==========================================
  if (isOperator) {
    return (
      <View style={styles.container}>
        <Header title="Sổ Đặt Vé Toàn Hệ Thống" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Operator Banner */}
          <View style={styles.operatorHeaderCard}>
            <View style={styles.operatorHeaderRow}>
              <View>
                <Text style={styles.operatorSubtitle}>QUẢN LÝ ĐẶT CHỖ TỔNG QUAN</Text>
                <Text style={styles.operatorTitle}>Danh sách vé toàn hệ thống</Text>
              </View>
              <View style={styles.operatorCountPill}>
                <Text style={styles.operatorCountText}>{filteredOperatorBookings.length} vé</Text>
              </View>
            </View>

            {/* Note: Managers only see operational overview, no passenger private boarding pass */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.goldDark} />
              <Text style={styles.securityNoticeText}>
                Chế độ Quản lý: Xem tổng quan tài chính, hành khách & tình trạng vé. Không hiển thị thẻ lên máy bay bảo mật của khách.
              </Text>
            </View>

            {/* Search Filter */}
            <View style={styles.operatorSearchRow}>
              <Ionicons name="search" size={16} color={COLORS.slate400} />
              <TextInput
                style={styles.operatorSearchInput}
                value={operatorSearch}
                onChangeText={setOperatorSearch}
                placeholder="Tìm mã PNR, tên khách, email..."
              />
              {operatorSearch.length > 0 && (
                <TouchableOpacity onPress={() => setOperatorSearch('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.slate400} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bookings Table / Cards */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.navy} />
              <Text style={styles.loadingText}>Đang tải dữ liệu đặt vé...</Text>
            </View>
          ) : filteredOperatorBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.slate400} />
              <Text style={styles.emptyTitle}>Không có vé nào</Text>
            </View>
          ) : (
            <View style={styles.operatorList}>
              {filteredOperatorBookings.map((b) => {
                const ticket = b.tickets?.[0];
                const flt = ticket?.flight || {};
                const isConfirmed = b.status === 'CONFIRMED';
                const isCancelled = b.status === 'CANCELLED';

                return (
                  <View key={b.id || b.pnr} style={styles.operatorBookingCard}>
                    {/* Top Row */}
                    <View style={styles.opCardTop}>
                      <View style={styles.opPnrBox}>
                        <Text style={styles.opPnrText}>{b.pnr}</Text>
                        <View
                          style={[
                            styles.opStatusTag,
                            isConfirmed && { backgroundColor: '#dcfce7' },
                            isCancelled && { backgroundColor: '#fee2e2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.opStatusTagText,
                              isConfirmed && { color: COLORS.emerald },
                              isCancelled && { color: COLORS.rose },
                            ]}
                          >
                            {b.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.opAmountText}>{formatPrice(b.totalAmount)}</Text>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.opCustomerRow}>
                      <Ionicons name="person" size={14} color={COLORS.slate400} />
                      <Text style={styles.opCustomerName}>{b.customerName || 'Khách vãng lai'}</Text>
                      <Text style={styles.opCustomerEmail}>• {b.customerEmail}</Text>
                    </View>

                    {/* Route & Flight */}
                    <View style={styles.opFlightRow}>
                      <View style={styles.opFlightPill}>
                        <Ionicons name="airplane" size={12} color={COLORS.navy} />
                        <Text style={styles.opFlightCode}>{flt.flightNumber || 'VSK-102'}</Text>
                      </View>
                      <Text style={styles.opRouteText}>
                        {flt.originAirport?.code || 'SGN'} ➔ {flt.destAirport?.code || flt.destinationAirport?.code || 'HAN'}
                      </Text>
                      <Text style={styles.opDateText}>{formatDate(flt.departureTime || b.createdAt)}</Text>
                    </View>

                    {/* Operator Details Button (Summary Modal, NO Boarding Pass) */}
                    <TouchableOpacity
                      style={styles.opDetailBtn}
                      onPress={() => setOperatorModalBooking(b)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-outline" size={14} color={COLORS.navy} />
                      <Text style={styles.opDetailBtnText}>Xem tóm tắt điều hành</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Modal for Operator Booking Summary */}
          <Modal
            visible={!!operatorModalBooking}
            transparent
            animationType="fade"
            onRequestClose={() => setOperatorModalBooking(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalSubtitle}>CHI TIẾT ĐIỀU HÀNH</Text>
                    <Text style={styles.modalTitle}>Mã PNR: {operatorModalBooking?.pnr}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setOperatorModalBooking(null)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.slate400} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Khách hàng:</Text>
                    <Text style={styles.modalVal}>{operatorModalBooking?.customerName}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Email liên hệ:</Text>
                    <Text style={styles.modalVal}>{operatorModalBooking?.customerEmail}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Điện thoại:</Text>
                    <Text style={styles.modalVal}>{operatorModalBooking?.customerPhone || 'Chưa cung cấp'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Tổng thanh toán:</Text>
                    <Text style={[styles.modalVal, { color: COLORS.emerald, fontWeight: '800' }]}>
                      {formatPrice(operatorModalBooking?.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Trạng thái:</Text>
                    <Text style={styles.modalVal}>{operatorModalBooking?.status}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Ghế chỉ định:</Text>
                    <Text style={styles.modalVal}>
                      {operatorModalBooking?.tickets?.[0]?.seat?.seatNumber || 'Hệ thống tự động xếp'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalNotice}>
                  <Ionicons name="information-circle" size={14} color="#0369a1" />
                  <Text style={styles.modalNoticeText}>
                    Theo tiêu chuẩn IATA, thẻ lên máy bay bảo mật và mã QR kiểm tra an ninh chỉ xuất trình trực tiếp cho hành khách.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setOperatorModalBooking(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 3: GUEST VIEW (KHÁCH VÃNG LAI)
  // ==========================================
  return (
    <View style={styles.container}>
      <Header title="Tra cứu đặt chỗ" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search Card for Guests */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Tra cứu vé & Thẻ lên tàu bay</Text>
          <Text style={styles.searchSubtitle}>
            Nhập Mã đặt chỗ (PNR 6 ký tự) và địa chỉ Email đã dùng khi mua vé.
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
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
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

        {/* Results View for Guest */}
        {guestBooking && (
          <View style={styles.resultContainer}>
            <View style={styles.statusBanner}>
              <View style={styles.statusLeft}>
                <Ionicons
                  name={guestBooking.status === 'CONFIRMED' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={guestBooking.status === 'CONFIRMED' ? COLORS.emerald : COLORS.rose}
                />
                <Text style={styles.statusText}>
                  Trạng thái: {guestBooking.status === 'CONFIRMED' ? 'Đã xác nhận & Giữ chỗ' : guestBooking.status}
                </Text>
              </View>
              <Text style={styles.pnrBadgeText}>{guestBooking.pnr}</Text>
            </View>

            {/* Boarding Pass */}
            <BoardingPassCard booking={guestBooking} />

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => handleSendEmail(guestBooking)}
                disabled={emailSending}
                style={[styles.actionBtn, styles.emailBtn]}
                activeOpacity={0.8}
              >
                {emailSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="mail" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Gửi vé về Email</Text>
                  </>
                )}
              </TouchableOpacity>

              {guestBooking.status === 'CONFIRMED' && (
                <TouchableOpacity
                  onPress={() => handleCancelBooking(guestBooking)}
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

        {/* Guest Login Suggestion Banner */}
        <View style={styles.guestLoginPrompt}>
          <Ionicons name="person-circle-outline" size={32} color={COLORS.gold} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.guestPromptTitle}>Đăng nhập để tự động lưu vé</Text>
            <Text style={styles.guestPromptDesc}>
              Hội viên Lotus Club xem lại danh sách tất cả vé đã đặt mà không cần nhập lại mã PNR.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.guestLoginBtnText}>Đăng nhập</Text>
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
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.slate500,
  },

  // Customer Views
  customerHeaderCard: {
    backgroundColor: COLORS.navy,
    margin: 16,
    padding: 18,
    borderRadius: 20,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerGreeting: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  bookingCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bookingCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  customerHint: {
    fontSize: 11,
    color: COLORS.slate300,
    lineHeight: 16,
  },
  bookingsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  routeCol: {
    flex: 1,
  },
  routeAirports: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },
  routeCities: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
  pnrPill: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15,43,92,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pnrPillLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  pnrPillCode: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 0.5,
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardInfoItem: {
    flex: 1,
  },
  cardInfoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  cardInfoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate800,
    marginTop: 2,
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  passengerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  passengerName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 2,
  },
  seatBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.goldDark,
    marginTop: 2,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  viewDetailBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Ticket Detail Sub-view
  ticketDetailBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backToListText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  statusPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillLargeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emerald,
  },

  // Operator Views
  operatorHeaderCard: {
    backgroundColor: COLORS.navy,
    margin: 16,
    padding: 16,
    borderRadius: 20,
  },
  operatorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  operatorSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  operatorTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  operatorCountPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  operatorCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.15)',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  securityNoticeText: {
    fontSize: 10,
    color: '#fef3c7',
    flex: 1,
    lineHeight: 14,
  },
  operatorSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  operatorSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.navy,
    paddingVertical: 0,
  },
  operatorList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  operatorBookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  opCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opPnrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opPnrText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.navy,
  },
  opStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  opStatusTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.slate600,
  },
  opAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  opCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  opCustomerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  opCustomerEmail: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  opFlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  opFlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  opFlightCode: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
  },
  opRouteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  opDateText: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  opDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 10,
  },
  opDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
  },
  modalSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.goldDark,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
    marginTop: 2,
  },
  modalBody: {
    gap: 10,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  modalVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalNoticeText: {
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 15,
    flex: 1,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Guest Search Card
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestLoginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guestPromptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },
  guestPromptDesc: {
    fontSize: 10,
    color: COLORS.slate500,
    marginTop: 2,
    lineHeight: 14,
  },
  guestLoginBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  guestLoginBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
  },

  // Other Lookup for Customer
  otherLookupSection: {
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  toggleLookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  toggleLookupText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  searchCardCompact: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  compactSearchBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  // Empty state
  emptyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
