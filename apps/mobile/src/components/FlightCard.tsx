import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface FlightCardProps {
  flight: any;
  onSelect: (flight: any, cabinClass: string) => void;
  onDetail?: (flight: any) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect, onDetail }) => {
  const depTime = new Date(flight.departureTime);
  const arrTime = new Date(flight.arrivalTime);

  const formatHour = (d: Date) => {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}g ${m > 0 ? `${m}p` : ''}`;
  };

  const economyFare = flight.fares?.find((f: any) => f.cabinClass === 'ECONOMY');
  const businessFare = flight.fares?.find((f: any) => f.cabinClass === 'BUSINESS');

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.flightInfo}>
          <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
          <Text style={styles.aircraftModel}>• {flight.aircraft?.model || 'Airbus A321neo'}</Text>
        </View>
        <View style={styles.directBadge}>
          <Ionicons name="checkmark-circle" size={12} color={COLORS.emerald} />
          <Text style={styles.directText}>Bay thẳng</Text>
        </View>
      </View>

      {/* Route & Times Row */}
      <View style={styles.routeRow}>
        <View style={styles.point}>
          <Text style={styles.time}>{formatHour(depTime)}</Text>
          <Text style={styles.airportCode}>{flight.originAirport?.code || 'SGN'}</Text>
          <Text style={styles.cityName}>{flight.originAirport?.city || 'Hồ Chí Minh'}</Text>
        </View>

        <View style={styles.durationCol}>
          <Text style={styles.durationText}>{formatDuration(flight.durationMinutes || 135)}</Text>
          <View style={styles.flightPath}>
            <View style={styles.dot} />
            <View style={styles.dashLine} />
            <Ionicons name="airplane" size={16} color={COLORS.cyan} style={styles.planeIcon} />
            <View style={styles.dashLine} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={[styles.point, { alignItems: 'flex-end' }]}>
          <Text style={styles.time}>{formatHour(arrTime)}</Text>
          <Text style={styles.airportCode}>{flight.destinationAirport?.code || 'HAN'}</Text>
          <Text style={styles.cityName}>{flight.destinationAirport?.city || 'Hà Nội'}</Text>
        </View>
      </View>

      {/* Fares Options */}
      <View style={styles.faresContainer}>
        {/* Economy Fare Option */}
        <TouchableOpacity
          style={styles.fareOption}
          activeOpacity={0.8}
          onPress={() => onSelect(flight, 'ECONOMY')}
        >
          <View style={styles.fareHeader}>
            <Text style={styles.fareClass}>Phổ thông</Text>
            <Text style={styles.seatsLeft}>còn {economyFare?.availableSeats || 150} chỗ</Text>
          </View>
          <Text style={styles.farePrice}>
            {(economyFare?.basePrice || 1450000).toLocaleString('vi-VN')}{' '}
            <Text style={styles.currency}>VND</Text>
          </Text>
          <View style={styles.selectBtn}>
            <Text style={styles.selectBtnText}>Chọn vé</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {/* Business Fare Option */}
        <TouchableOpacity
          style={[styles.fareOption, styles.businessOption]}
          activeOpacity={0.8}
          onPress={() => onSelect(flight, 'BUSINESS')}
        >
          <View style={styles.fareHeader}>
            <Text style={[styles.fareClass, { color: COLORS.goldDark }]}>✨ Thương gia</Text>
            <Text style={styles.seatsLeft}>còn {businessFare?.availableSeats || 20} chỗ</Text>
          </View>
          <Text style={[styles.farePrice, { color: COLORS.goldDark }]}>
            {(businessFare?.basePrice || 4200000).toLocaleString('vi-VN')}{' '}
            <Text style={styles.currency}>VND</Text>
          </Text>
          <View style={[styles.selectBtn, { backgroundColor: COLORS.gold }]}>
            <Text style={styles.selectBtnText}>Chọn vé</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  flightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flightNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  aircraftModel: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  directText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emerald,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  point: {
    flex: 1,
  },
  time: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.slate900,
  },
  airportCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 2,
  },
  cityName: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 1,
  },
  durationCol: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    marginBottom: 4,
  },
  flightPath: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.cyan,
  },
  dashLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.slate300,
  },
  planeIcon: {
    marginHorizontal: 2,
  },
  faresContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  fareOption: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  businessOption: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fareClass: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  seatsLeft: {
    fontSize: 9,
    color: COLORS.slate400,
  },
  farePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.navy,
    marginBottom: 8,
  },
  currency: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.slate500,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  selectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});

