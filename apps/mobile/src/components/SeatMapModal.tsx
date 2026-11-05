import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { api } from '../api';

interface SeatMapModalProps {
  visible: boolean;
  flightId: string;
  cabinClass: string;
  requiredSeatsCount: number;
  sessionId: string;
  initialSelectedSeats?: string[];
  onClose: () => void;
  onConfirm: (seats: string[], seatDetails: { seatNumber: string; cabinClass: string }[]) => void;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  visible,
  flightId,
  cabinClass,
  requiredSeatsCount,
  sessionId,
  initialSelectedSeats = [],
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(true);
  const [seatData, setSeatData] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>(initialSelectedSeats);
  const [holdTtlSeconds, setHoldTtlSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (visible && flightId) {
      loadSeats();
    }
  }, [visible, flightId]);

  // Countdown timer
  useEffect(() => {
    if (holdTtlSeconds === null || holdTtlSeconds <= 0) return;
    const interval = setInterval(() => {
      setHoldTtlSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [holdTtlSeconds]);

  const loadSeats = async () => {
    setLoading(true);
    try {
      const data = await api.getFlightSeats(flightId);
      setSeatData(data);
    } catch (e: any) {
      console.warn('Load seats error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seat: any) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'HELD' && seat.heldBySessionId !== sessionId) return;

    let newSelected: string[];
    if (selected.includes(seat.seatNumber)) {
      newSelected = selected.filter((s) => s !== seat.seatNumber);
    } else {
      if (selected.length >= requiredSeatsCount) {
        newSelected = [...selected.slice(1), seat.seatNumber];
      } else {
        newSelected = [...selected, seat.seatNumber];
      }
    }

    setSelected(newSelected);

    // Call server hold
    if (newSelected.length > 0) {
      api.holdSeats({ flightId, seatNumbers: newSelected, sessionId })
        .then((res) => {
          if (res?.ttlSeconds) setHoldTtlSeconds(res.ttlSeconds);
        })
        .catch(() => {});
    }
  };

  const handleSave = () => {
    const allSeats: any[] = seatData?.seats || [];
    const details = selected.map((num) => {
      const found = allSeats.find((s: any) => s.seatNumber === num);
      return {
        seatNumber: num,
        cabinClass: (found?.cabinClass || 'ECONOMY') as string,
      };
    });
    onConfirm(selected, details);
    onClose();
  };

  const seatsList: any[] = seatData?.seats || [];
  const businessSeats = seatsList.filter((s) => s.cabinClass === 'BUSINESS');
  const economySeats = seatsList.filter((s) => s.cabinClass === 'ECONOMY');

  // Group economy by rows
  const economyRows: Record<number, any[]> = {};
  economySeats.forEach((s) => {
    if (!economyRows[s.row]) economyRows[s.row] = [];
    economyRows[s.row].push(s);
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.sheetTitle}>Sơ đồ chỗ ngồi</Text>
              <Text style={styles.sheetSubtitle}>
                Chọn {requiredSeatsCount} ghế cho hành khách
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.slate700} />
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatAvail]} />
              <Text style={styles.legendText}>Trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatSelected]} />
              <Text style={styles.legendText}>Đang chọn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatHeld]} />
              <Text style={styles.legendText}>Đang giữ</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatBooked]} />
              <Text style={styles.legendText}>Đã bán</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.navy} />
              <Text style={styles.loadingText}>Đang tải sơ đồ tàu bay...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.fuselage}>
              {/* Cockpit */}
              <View style={styles.cockpit}>
                <Ionicons name="navigate" size={16} color={COLORS.slate500} />
                <Text style={styles.cockpitText}>MŨI TÀU BAY</Text>
              </View>

              {/* Business Section */}
              {businessSeats.length > 0 && (
                <View style={styles.cabinSection}>
                  <Text style={styles.cabinLabel}>✨ KHOANG THƯƠNG GIA (BUSINESS)</Text>
                  <View style={styles.businessGrid}>
                    {businessSeats.map((s) => {
                      const isSel = selected.includes(s.seatNumber);
                      const isBooked = s.status === 'BOOKED';
                      const isHeld = s.status === 'HELD' && s.heldBySessionId !== sessionId;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          disabled={isBooked || isHeld}
                          onPress={() => handleSeatPress(s)}
                          style={[
                            styles.seat,
                            styles.bizSeat,
                            isSel && styles.seatSelected,
                            isHeld && styles.seatHeld,
                            isBooked && styles.seatBooked,
                          ]}
                        >
                          <Text style={[styles.seatNum, isSel && styles.whiteText]}>
                            {s.seatNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Economy Section */}
              <View style={styles.cabinSection}>
                <Text style={[styles.cabinLabel, { color: COLORS.navy }]}>
                  KHOANG PHỔ THÔNG (ECONOMY)
                </Text>
                {Object.keys(economyRows).map((rowKey) => {
                  const row = economyRows[Number(rowKey)];
                  const left = row.filter((s) => ['A', 'B', 'C'].includes(s.col));
                  const right = row.filter((s) => ['D', 'E', 'G'].includes(s.col));
                  return (
                    <View key={rowKey} style={styles.economyRow}>
                      <View style={styles.seatGroup}>
                        {left.map((s) => {
                          const isSel = selected.includes(s.seatNumber);
                          const isBooked = s.status === 'BOOKED';
                          const isHeld = s.status === 'HELD' && s.heldBySessionId !== sessionId;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              disabled={isBooked || isHeld}
                              onPress={() => handleSeatPress(s)}
                              style={[
                                styles.seat,
                                isSel && styles.seatSelected,
                                isHeld && styles.seatHeld,
                                isBooked && styles.seatBooked,
                              ]}
                            >
                              <Text style={[styles.seatNum, isSel && styles.whiteText]}>
                                {s.seatNumber}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.rowLabel}>{rowKey}</Text>

                      <View style={styles.seatGroup}>
                        {right.map((s) => {
                          const isSel = selected.includes(s.seatNumber);
                          const isBooked = s.status === 'BOOKED';
                          const isHeld = s.status === 'HELD' && s.heldBySessionId !== sessionId;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              disabled={isBooked || isHeld}
                              onPress={() => handleSeatPress(s)}
                              style={[
                                styles.seat,
                                isSel && styles.seatSelected,
                                isHeld && styles.seatHeld,
                                isBooked && styles.seatBooked,
                              ]}
                            >
                              <Text style={[styles.seatNum, isSel && styles.whiteText]}>
                                {s.seatNumber}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer Bar */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.selectedLabel}>Đã chọn ({selected.length}/{requiredSeatsCount}):</Text>
              <Text style={styles.selectedList}>
                {selected.length > 0 ? selected.join(', ') : 'Chưa chọn'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.confirmBtn, selected.length === 0 && styles.disabledBtn]}
              disabled={selected.length === 0}
            >
              <Text style={styles.confirmBtnText}>Xác nhận ghế</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: COLORS.slate50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 8,
  },
  fuselage: {
    padding: 16,
    alignItems: 'center',
  },
  cockpit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.slate200,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  cockpitText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate600,
    letterSpacing: 1,
  },
  cabinSection: {
    width: '100%',
    marginBottom: 24,
  },
  cabinLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.goldDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  economyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  rowLabel: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  seat: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizSeat: {
    width: 48,
    height: 48,
    borderColor: COLORS.gold,
  },
  seatAvail: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate300,
  },
  seatSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  seatHeld: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amber,
  },
  seatBooked: {
    backgroundColor: COLORS.slate200,
    borderColor: COLORS.slate300,
    opacity: 0.6,
  },
  seatNum: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  whiteText: {
    color: COLORS.white,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  selectedList: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  confirmBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  disabledBtn: {
    backgroundColor: COLORS.slate300,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});

