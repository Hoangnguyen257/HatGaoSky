import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { api } from '../api';
import { useBooking } from '../context/BookingContext';

const AIRPORTS = [
  { code: 'SGN', city: 'Hồ Chí Minh', name: 'Tân Sơn Nhất' },
  { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài' },
  { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng' },
  { code: 'CXR', city: 'Nha Trang', name: 'Cam Ranh' },
  { code: 'PQC', city: 'Phú Quốc', name: 'Phú Quốc' },
  { code: 'DLI', city: 'Đà Lạt', name: 'Liên Khương' },
];

export const FlightSearchScreen = ({ navigation }: any) => {
  const [origin, setOrigin] = useState('SGN');
  const [destination, setDestination] = useState('HAN');
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const swapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    if (origin === destination) {
      Alert.alert('Lỗi', 'Điểm khởi hành và điểm đến không được trùng nhau');
      return;
    }
    navigation.navigate('FlightResults', {
      origin,
      destination,
      departureDate,
      passengers,
      cabinClass,
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero Card */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>Bay Cùng Hạt Gạo Sky</Text>
          <Text style={styles.heroSubtitle}>
            Giá vé gốc trực tiếp từ hãng hàng không • Không phí ẩn
          </Text>
        </View>

        {/* Search Box Card */}
        <View style={styles.searchCard}>
          {/* Trip Type Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setIsRoundTrip(false)}
              style={[styles.tabBtn, !isRoundTrip && styles.tabActive]}
            >
              <Text style={[styles.tabText, !isRoundTrip && styles.tabTextActive]}>Một chiều</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsRoundTrip(true)}
              style={[styles.tabBtn, isRoundTrip && styles.tabActive]}
            >
              <Text style={[styles.tabText, isRoundTrip && styles.tabTextActive]}>Khứ hồi</Text>
            </TouchableOpacity>
          </View>

          {/* Airport Route Selector */}
          <View style={styles.routeContainer}>
            {/* Origin */}
            <View style={styles.airportBox}>
              <Text style={styles.boxLabel}>KHỞI HÀNH</Text>
              <Text style={styles.boxCode}>{origin}</Text>
              <Text style={styles.boxCity}>
                {AIRPORTS.find((a) => a.code === origin)?.city || 'Hồ Chí Minh'}
              </Text>
            </View>

            {/* Swap Button */}
            <TouchableOpacity onPress={swapAirports} style={styles.swapBtn} activeOpacity={0.8}>
              <Ionicons name="swap-horizontal" size={20} color={COLORS.navy} />
            </TouchableOpacity>

            {/* Destination */}
            <View style={[styles.airportBox, { alignItems: 'flex-end' }]}>
              <Text style={styles.boxLabel}>ĐIỂM ĐẾN</Text>
              <Text style={styles.boxCode}>{destination}</Text>
              <Text style={styles.boxCity}>
                {AIRPORTS.find((a) => a.code === destination)?.city || 'Hà Nội'}
              </Text>
            </View>
          </View>

          {/* Quick Airport Selector Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {AIRPORTS.map((a) => (
              <TouchableOpacity
                key={a.code}
                onPress={() => {
                  if (origin === a.code) return;
                  setDestination(a.code);
                }}
                style={[styles.chip, destination === a.code && styles.chipActive]}
              >
                <Text style={[styles.chipText, destination === a.code && styles.chipTextActive]}>
                  {a.city} ({a.code})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date Selector */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.boxLabel}>NGÀY KHỞI HÀNH</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.cyan} />
                <TextInput
                  value={departureDate}
                  onChangeText={setDepartureDate}
                  placeholder="YYYY-MM-DD"
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          {/* Passengers & Class */}
          <View style={styles.optionsRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.boxLabel}>HÀNH KHÁCH</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  onPress={() => setPassengers(Math.max(1, passengers - 1))}
                  style={styles.counterBtn}
                >
                  <Ionicons name="remove" size={16} color={COLORS.slate700} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{passengers} người</Text>
                <TouchableOpacity
                  onPress={() => setPassengers(Math.min(9, passengers + 1))}
                  style={styles.counterBtn}
                >
                  <Ionicons name="add" size={16} color={COLORS.slate700} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.boxLabel}>HẠNG VÉ</Text>
              <View style={styles.cabinToggle}>
                <TouchableOpacity
                  onPress={() => setCabinClass('ECONOMY')}
                  style={[styles.cabinBtn, cabinClass === 'ECONOMY' && styles.cabinActive]}
                >
                  <Text style={[styles.cabinText, cabinClass === 'ECONOMY' && styles.whiteText]}>
                    Phổ thông
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCabinClass('BUSINESS')}
                  style={[styles.cabinBtn, cabinClass === 'BUSINESS' && styles.bizActive]}
                >
                  <Text style={[styles.cabinText, cabinClass === 'BUSINESS' && styles.whiteText]}>
                    Thương gia
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Search Action Button */}
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn} activeOpacity={0.85}>
            <Ionicons name="search" size={18} color={COLORS.white} />
            <Text style={styles.searchBtnText}>TÌM CHUYẾN BAY</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.emerald} />
            <Text style={styles.featureTitle}>Giá gốc trực tiếp</Text>
            <Text style={styles.featureDesc}>Không phí ẩn, không phụ phí</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color={COLORS.cyan} />
            <Text style={styles.featureTitle}>Giữ chỗ 15 phút</Text>
            <Text style={styles.featureDesc}>Giữ nguyên giá vé tức thì</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="star" size={20} color={COLORS.gold} />
            <Text style={styles.featureTitle}>Bông Sen Vàng</Text>
            <Text style={styles.featureDesc}>Tích lũy dặm bay mỗi vé</Text>
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
  heroBanner: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: COLORS.goldLight,
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: -25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  tabTextActive: {
    color: COLORS.navy,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  airportBox: {
    flex: 1,
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  boxCode: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.navy,
  },
  boxCity: {
    fontSize: 12,
    color: COLORS.slate600,
    fontWeight: '600',
    marginTop: 2,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  chipsRow: {
    marginVertical: 12,
  },
  chip: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.navy,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  fieldRow: {
    marginTop: 12,
  },
  fieldCol: {
    flex: 1,
  },
  inputWithIcon: {
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
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 6,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  cabinToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 3,
  },
  cabinBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  cabinActive: {
    backgroundColor: COLORS.navy,
  },
  bizActive: {
    backgroundColor: COLORS.goldDark,
  },
  cabinText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  whiteText: {
    color: COLORS.white,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.slate950,
    letterSpacing: 0.8,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  featureItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 6,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 9,
    color: COLORS.slate400,
    marginTop: 2,
    textAlign: 'center',
  },
});
