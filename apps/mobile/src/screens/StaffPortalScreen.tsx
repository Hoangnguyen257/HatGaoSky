import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, SHADOWS } from '../constants/theme';

export const StaffPortalScreen = ({ navigation }: any) => {
  const { user, isStaff, isManager, isAdmin, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'flights' | 'stats'>('requests');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashboard, setDashboard] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);

  // Action modal
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const isOperator = isStaff || isManager || isAdmin;

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes, fltRes] = await Promise.allSettled([
        api.getDashboard('MONTH'),
        api.getBookingRequests(),
        api.getAllFlights(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setDashboard(statsRes.value.data);
      } else {
        // Fallback demo stats
        setDashboard({
          totalRevenue: 1254800000,
          totalBookings: 842,
          totalPassengers: 1420,
          flightCount: 28,
        });
      }

      if (reqsRes.status === 'fulfilled' && reqsRes.value) {
        const val: any = reqsRes.value;
        const list = Array.isArray(val) ? val : val.data || [];
        setRequests(list);
      } else {
        // Fallback demo requests
        setRequests([
          {
            id: 'REQ-101',
            type: 'REFUND',
            pnr: 'VSK778',
            customerName: 'Nguyễn Văn Minh',
            amount: 2450000,
            status: 'PENDING',
            reason: 'Đổi lịch công tác khẩn cấp',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'REQ-102',
            type: 'CABIN_UPGRADE',
            pnr: 'VSK912',
            customerName: 'Trần Thị Mai',
            amount: 1200000,
            status: 'PENDING',
            reason: 'Nâng hạng Thương Gia bằng Lotus Miles',
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      if (fltRes.status === 'fulfilled' && fltRes.value) {
        const val: any = fltRes.value;
        const list = Array.isArray(val) ? val : val.data || [];
        setFlights(list);
      } else {
        // Fallback demo flights
        setFlights([
          {
            id: 'FL-01',
            flightNumber: 'HG-102',
            originCode: 'SGN',
            originName: 'TP. Hồ Chí Minh',
            destCode: 'HAN',
            destName: 'Hà Nội',
            departureTime: new Date(Date.now() + 3600000 * 3).toISOString(),
            status: 'SCHEDULED',
            seatsAvailable: 34,
            aircraft: 'Airbus A321neo',
          },
          {
            id: 'FL-02',
            flightNumber: 'HG-205',
            originCode: 'HAN',
            originName: 'Hà Nội',
            destCode: 'DAD',
            destName: 'Đà Nẵng',
            departureTime: new Date(Date.now() + 3600000 * 5).toISOString(),
            status: 'BOARDING',
            seatsAvailable: 12,
            aircraft: 'Boeing 787-9',
          },
          {
            id: 'FL-03',
            flightNumber: 'HG-310',
            originCode: 'SGN',
            originName: 'TP. Hồ Chí Minh',
            destCode: 'PQC',
            destName: 'Phú Quốc',
            departureTime: new Date(Date.now() + 3600000 * 8).toISOString(),
            status: 'SCHEDULED',
            seatsAvailable: 48,
            aircraft: 'Airbus A321neo',
          },
        ]);
      }
    } catch (e) {
      console.log('Error loading staff data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAction = async () => {
    if (!selectedReq || !actionType) return;
    try {
      setActionSubmitting(true);
      const targetStatus = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const res = await api.updateBookingStatus(selectedReq.id, targetStatus, reason || 'Duyệt bởi điều hành');
      if (res.success) {
        Alert.alert('Thành công', `Đã ${actionType === 'APPROVE' ? 'phê duyệt' : 'từ chối'} yêu cầu ${selectedReq.id}`);
        setRequests((prev) =>
          prev.map((r) => (r.id === selectedReq.id ? { ...r, status: targetStatus } : r))
        );
      } else {
        // Offline demo update
        setRequests((prev) =>
          prev.map((r) => (r.id === selectedReq.id ? { ...r, status: targetStatus } : r))
        );
        Alert.alert('Thành công (Demo)', `Đã cập nhật trạng thái yêu cầu sang ${targetStatus}`);
      }
    } catch (err: any) {
      // Offline fallback
      const targetStatus = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedReq.id ? { ...r, status: targetStatus } : r))
      );
      Alert.alert('Thành công (Demo)', `Đã cập nhật trạng thái yêu cầu`);
    } finally {
      setActionSubmitting(false);
      setSelectedReq(null);
      setActionType(null);
      setReason('');
    }
  };

  const formatPrice = (v: number) => (v || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.headerSubtitle}>TRUNG TÂM ĐIỀU HÀNH BAY</Text>
            </View>
            <Text style={styles.headerTitle}>VietSky Operations</Text>
          </View>
          <View style={styles.roleTag}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
            <Text style={styles.roleTagText}>{user?.role || 'STAFF'}</Text>
          </View>
        </View>

        {/* Demo Fast Role Switcher */}
        <View style={styles.quickSwitchBox}>
          <Text style={styles.quickSwitchLabel}>Chuyển quyền nhanh (Demo):</Text>
          <View style={styles.quickSwitchRow}>
            {(['STAFF', 'STAFF_MANAGER', 'ADMIN', 'CUSTOMER'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.quickSwitchBtn,
                  user?.role === r && styles.quickSwitchBtnActive,
                ]}
                onPress={() => switchRole(r)}
              >
                <Text
                  style={[
                    styles.quickSwitchBtnText,
                    user?.role === r && styles.quickSwitchBtnTextActive,
                  ]}
                >
                  {r === 'STAFF_MANAGER' ? 'MANAGER' : r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* KPI Highlights Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>DOANH THU THÁNG</Text>
          <Text style={styles.kpiValue} numberOfLines={1}>
            {dashboard ? formatPrice(dashboard.totalRevenue) : '---'}
          </Text>
          <Text style={styles.kpiSub}>▲ 14.8% so tháng trước</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TỔNG ĐẶT CHỖ</Text>
          <Text style={styles.kpiValue}>{dashboard?.totalBookings || '842'}</Text>
          <Text style={styles.kpiSub}>98.2% đúng giờ</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Ionicons
            name="hourglass-outline"
            size={18}
            color={activeTab === 'requests' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Yêu cầu ({requests.filter((r) => r.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'flights' && styles.tabItemActive]}
          onPress={() => setActiveTab('flights')}
        >
          <Ionicons
            name="airplane-outline"
            size={18}
            color={activeTab === 'flights' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'flights' && styles.tabTextActive]}>
            Chuyến bay ({flights.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="bar-chart-outline"
            size={18}
            color={activeTab === 'stats' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Hiệu suất
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu điều hành...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'requests' && (
            <View>
              <Text style={styles.sectionTitle}>Yêu cầu chờ xử lý (Hoàn / Đổi / Nâng hạng)</Text>
              {requests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
                  <Text style={styles.emptyTitle}>Tất cả yêu cầu đã được xử lý</Text>
                </View>
              ) : (
                requests.map((item) => (
                  <View key={item.id} style={styles.requestCard}>
                    <View style={styles.reqHeader}>
                      <View style={styles.reqTypeBadge}>
                        <Text style={styles.reqTypeText}>
                          {item.type === 'REFUND' ? 'HOÀN VÉ' : 'NÂNG HẠNG'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.reqStatusBadge,
                          item.status === 'APPROVED' && { backgroundColor: '#dcfce7' },
                          item.status === 'REJECTED' && { backgroundColor: '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reqStatusText,
                            item.status === 'APPROVED' && { color: COLORS.success },
                            item.status === 'REJECTED' && { color: COLORS.error },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reqBody}>
                      <Text style={styles.reqCustomer}>{item.customerName}</Text>
                      <Text style={styles.reqDetail}>
                        Mã đặt chỗ (PNR): <Text style={{ fontWeight: '700' }}>{item.pnr}</Text>
                      </Text>
                      <Text style={styles.reqDetail}>Lý do: {item.reason}</Text>
                      <Text style={styles.reqAmount}>
                        Giá trị: <Text style={{ color: COLORS.secondary }}>{formatPrice(item.amount)}</Text>
                      </Text>
                    </View>

                    {item.status === 'PENDING' && (
                      <View style={styles.reqActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => {
                            setSelectedReq(item);
                            setActionType('REJECT');
                          }}
                        >
                          <Ionicons name="close" size={16} color={COLORS.error} />
                          <Text style={styles.rejectBtnText}>Từ chối</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => {
                            setSelectedReq(item);
                            setActionType('APPROVE');
                          }}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.approveBtnText}>Phê duyệt</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'flights' && (
            <View>
              <Text style={styles.sectionTitle}>Lịch trình chuyến bay trực tiếp</Text>
              {flights.map((flt) => (
                <View key={flt.id} style={styles.flightItem}>
                  <View style={styles.flightHeader}>
                    <View style={styles.fltCodeBox}>
                      <Ionicons name="airplane" size={16} color={COLORS.primary} />
                      <Text style={styles.flightCode}>{flt.flightNumber}</Text>
                    </View>
                    <View
                      style={[
                        styles.fltStatusBadge,
                        flt.status === 'BOARDING' && { backgroundColor: '#fef3c7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.fltStatusText,
                          flt.status === 'BOARDING' && { color: '#b45309' },
                        ]}
                      >
                        {flt.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.flightRouteRow}>
                    <View>
                      <Text style={styles.fltAirport}>{flt.originCode}</Text>
                      <Text style={styles.fltCity}>{flt.originName}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.gray} />
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.fltAirport}>{flt.destCode}</Text>
                      <Text style={styles.fltCity}>{flt.destName}</Text>
                    </View>
                  </View>

                  <View style={styles.flightFooter}>
                    <Text style={styles.fltAircraft}>
                      <Ionicons name="hardware-chip-outline" size={12} /> {flt.aircraft}
                    </Text>
                    <Text style={styles.fltSeats}>
                      Còn lại: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{flt.seatsAvailable} ghế</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'stats' && (
            <View>
              <Text style={styles.sectionTitle}>Báo cáo năng lực vận hành</Text>
              <View style={styles.metricCard}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>Tỷ lệ đúng giờ (OTP):</Text>
                  <Text style={styles.metricValue}>96.4%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '96.4%' }]} />
                </View>

                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>Hệ số lấp đầy ghế (Load Factor):</Text>
                  <Text style={styles.metricValue}>88.2%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '88.2%', backgroundColor: COLORS.secondary }]} />
                </View>

                <View style={[styles.metricRow, { marginTop: 16 }]}>
                  <Text style={styles.metricName}>Chỉ số hài lòng khách hàng (CSAT):</Text>
                  <Text style={styles.metricValue}>4.8 / 5.0 ★</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '96%', backgroundColor: '#10b981' }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <Modal visible={!!selectedReq} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'APPROVE' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
            </Text>
            <Text style={styles.modalPrompt}>
              Yêu cầu: <Text style={{ fontWeight: '700' }}>{selectedReq?.id}</Text> ({selectedReq?.customerName})
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập ghi chú hoặc lý do phê duyệt / từ chối..."
              placeholderTextColor={COLORS.gray}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedReq(null)}
                disabled={actionSubmitting}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  actionType === 'REJECT' && { backgroundColor: COLORS.error },
                ]}
                onPress={handleAction}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {actionType === 'APPROVE' ? 'Duyệt ngay' : 'Từ chối'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  headerSubtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickSwitchBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  quickSwitchLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 6,
  },
  quickSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  quickSwitchBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  quickSwitchBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  quickSwitchBtnTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    ...SHADOWS.small,
  },
  kpiLabel: {
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reqTypeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reqTypeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  reqStatusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reqStatusText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  reqBody: {
    gap: 3,
    marginBottom: 12,
  },
  reqCustomer: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  reqDetail: {
    fontSize: 12,
    color: COLORS.gray,
  },
  reqAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  reqActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  rejectBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 12,
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  flightItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fltCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flightCode: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  fltStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fltStatusText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  flightRouteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 4,
  },
  fltAirport: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  fltCity: {
    fontSize: 11,
    color: COLORS.gray,
  },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fltAircraft: {
    fontSize: 11,
    color: COLORS.gray,
  },
  fltSeats: {
    fontSize: 11,
    color: COLORS.text,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  modalPrompt: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
