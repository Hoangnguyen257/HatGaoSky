import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { FlightCard } from '../components/FlightCard';
import { api } from '../api';
import { useBooking } from '../context/BookingContext';

export const FlightResultsScreen = ({ route, navigation }: any) => {
  const { origin, destination, departureDate, passengers, cabinClass } = route.params;
  const { setOutboundFlight } = useBooking();

  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeOfDay, setTimeOfDay] = useState<string>(''); // '', 'MORNING', 'AFTERNOON', 'EVENING'
  const [sortBy, setSortBy] = useState<string>('PRICE_ASC');

  useEffect(() => {
    loadFlights();
  }, [origin, destination, departureDate, passengers, cabinClass]);

  const loadFlights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchFlights({
        origin,
        destination,
        departureDate,
        passengers,
        cabinClass,
      });
      setFlights(data?.outboundFlights || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tìm chuyến bay');
    } finally {
      setLoading(false);
    }
  };

  // Vietnam local hour helper
  const getFlightHour = (departureTime: string) => {
    try {
      const d = new Date(departureTime);
      const vnHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: 'numeric',
        hour12: false,
      }).format(d);
      const h = parseInt(vnHourStr, 10);
      return h === 24 ? 0 : h;
    } catch {
      return new Date(departureTime).getHours();
    }
  };

  // Instant reactive client-side filter & sort
  const displayedFlights = useMemo(() => {
    let list = [...flights];

    if (timeOfDay) {
      list = list.filter((f) => {
        const h = getFlightHour(f.departureTime);
        if (timeOfDay === 'MORNING') return h < 12;
        if (timeOfDay === 'AFTERNOON') return h >= 12 && h < 18;
        if (timeOfDay === 'EVENING') return h >= 18;
        return true;
      });
    }

    if (sortBy === 'PRICE_ASC') {
      list.sort((a, b) => {
        const pA = Math.min(...(a.fares?.map((fa: any) => fa.basePrice) || [0]));
        const pB = Math.min(...(b.fares?.map((fa: any) => fa.basePrice) || [0]));
        return pA - pB;
      });
    } else if (sortBy === 'PRICE_DESC') {
      list.sort((a, b) => {
        const pA = Math.min(...(a.fares?.map((fa: any) => fa.basePrice) || [0]));
        const pB = Math.min(...(b.fares?.map((fa: any) => fa.basePrice) || [0]));
        return pB - pA;
      });
    } else if (sortBy === 'DEPARTURE_ASC') {
      list.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    }

    return list;
  }, [flights, timeOfDay, sortBy]);

  const handleSelectFare = (flight: any, chosenCabin: string) => {
    setOutboundFlight(flight, chosenCabin);
    navigation.navigate('BookingWizard');
  };

  return (
    <View style={styles.container}>
      <Header
        title={`${origin} ➔ ${destination}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{departureDate}</Text>
          </View>
        }
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setTimeOfDay('')}
            style={[styles.filterChip, timeOfDay === '' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, timeOfDay === '' && styles.filterChipTextActive]}>
              Tất cả giờ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTimeOfDay('MORNING')}
            style={[styles.filterChip, timeOfDay === 'MORNING' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, timeOfDay === 'MORNING' && styles.filterChipTextActive]}>
              🌅 Sáng (00:00 - 11:59)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTimeOfDay('AFTERNOON')}
            style={[styles.filterChip, timeOfDay === 'AFTERNOON' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, timeOfDay === 'AFTERNOON' && styles.filterChipTextActive]}>
              ☀️ Chiều (12:00 - 17:59)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTimeOfDay('EVENING')}
            style={[styles.filterChip, timeOfDay === 'EVENING' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, timeOfDay === 'EVENING' && styles.filterChipTextActive]}>
              🌙 Tối (18:00 - 23:59)
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sort Toggle */}
        <View style={styles.sortRow}>
          <Text style={styles.countText}>Tìm thấy {displayedFlights.length} chuyến bay</Text>
          <TouchableOpacity
            onPress={() => setSortBy(sortBy === 'PRICE_ASC' ? 'PRICE_DESC' : 'PRICE_ASC')}
            style={styles.sortBtn}
          >
            <Ionicons name="swap-vertical" size={14} color={COLORS.navy} />
            <Text style={styles.sortBtnText}>
              {sortBy === 'PRICE_ASC' ? 'Giá: Thấp ➔ Cao' : 'Giá: Cao ➔ Thấp'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text style={styles.loadingText}>Đang tìm chuyến bay giá tốt nhất...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle" size={48} color={COLORS.rose} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadFlights} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Thử lại ngay</Text>
          </TouchableOpacity>
        </View>
      ) : displayedFlights.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="airplane-outline" size={56} color={COLORS.slate300} />
          <Text style={styles.noFlightsTitle}>Không có chuyến bay phù hợp</Text>
          <Text style={styles.noFlightsDesc}>
            Không tìm thấy chuyến bay nào trong khung giờ bạn đã lọc. Vui lòng bấm "Tất cả giờ" để xem lịch bay đầy đủ.
          </Text>
          <TouchableOpacity onPress={() => setTimeOfDay('')} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Xem tất cả chuyến bay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedFlights}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FlightCard flight={item} onSelect={handleSelectFare} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  filterBar: {
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterChipActive: {
    backgroundColor: COLORS.navy,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.slate500,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.rose,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  noFlightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 14,
  },
  noFlightsDesc: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 30,
  },
});

