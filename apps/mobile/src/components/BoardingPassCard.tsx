import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface BoardingPassCardProps {
  booking: any;
  passengerIndex?: number;
}

export const BoardingPassCard: React.FC<BoardingPassCardProps> = ({ booking, passengerIndex = 0 }) => {
  const pnr = booking?.pnr || 'VSK89A';
  const flight = booking?.outboundFlight || booking?.flight || {};
  const passenger = booking?.passengers?.[passengerIndex] || {
    firstName: 'AN',
    lastName: 'NGUYEN VAN',
  };
  const seat = booking?.tickets?.[passengerIndex]?.seat?.seatNumber ||
               booking?.outboundSeats?.[passengerIndex] ||
               '12A';
  const cabinClass = booking?.cabinClass || 'ECONOMY';

  const depTime = flight.departureTime ? new Date(flight.departureTime) : new Date();
  const boardingTime = new Date(depTime.getTime() - 40 * 60 * 1000); // 40 mins prior

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  };

  return (
    <View style={styles.card}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={styles.airlineBadge}>
          <Ionicons name="airplane" size={16} color={COLORS.gold} />
          <Text style={styles.airlineName}>HẠT GẠO SKY</Text>
        </View>
        <View style={styles.pnrBadge}>
          <Text style={styles.pnrLabel}>MÃ PNR</Text>
          <Text style={styles.pnrCode}>{pnr}</Text>
        </View>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {/* Route Row */}
        <View style={styles.routeRow}>
          <View>
            <Text style={styles.airportCode}>{flight.originAirport?.code || 'SGN'}</Text>
            <Text style={styles.cityText}>{flight.originAirport?.city || 'Hồ Chí Minh'}</Text>
          </View>
          <View style={styles.flightIconRow}>
            <View style={styles.line} />
            <Ionicons name="airplane" size={20} color={COLORS.cyan} />
            <View style={styles.line} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.airportCode}>{flight.destinationAirport?.code || 'HAN'}</Text>
            <Text style={styles.cityText}>{flight.destinationAirport?.city || 'Hà Nội'}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>HÀNH KHÁCH</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {`${passenger.lastName} ${passenger.firstName}`.toUpperCase()}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>CHUYẾN BAY</Text>
            <Text style={styles.fieldValue}>{flight.flightNumber || 'VSK-102'}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>NGÀY BAY</Text>
            <Text style={styles.fieldValue}>{formatDate(depTime)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>GIỜ CẤT CÁNH</Text>
            <Text style={[styles.fieldValue, { color: COLORS.cyan }]}>{formatTime(depTime)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>HẠNG VÉ</Text>
            <Text style={styles.fieldValue}>
              {cabinClass === 'BUSINESS' ? '✨ Thương gia' : 'Phổ thông'}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>GHẾ NGỒI</Text>
            <Text style={[styles.fieldValue, styles.seatValue]}>{seat}</Text>
          </View>
        </View>
      </View>

      {/* Perforation Line */}
      <View style={styles.perforationContainer}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={styles.dashedDivider} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>

      {/* Boarding Info & QR Section */}
      <View style={styles.boardingSection}>
        <View style={styles.boardingDetails}>
          <View>
            <Text style={styles.boardingLabel}>GIỜ LÊN TÀU</Text>
            <Text style={styles.boardingTime}>{formatTime(boardingTime)}</Text>
          </View>
          <View>
            <Text style={styles.boardingLabel}>CỬA RA (GATE)</Text>
            <Text style={styles.boardingGate}>08</Text>
          </View>
          <View>
            <Text style={styles.boardingLabel}>NHÀ GA</Text>
            <Text style={styles.boardingGate}>T1</Text>
          </View>
        </View>

        {/* QR Code Simulation */}
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <Ionicons name="qr-code-outline" size={72} color={COLORS.navy} />
          </View>
          <Text style={styles.scanNotice}>Quét tại cổng an ninh & lên tàu bay</Text>
        </View>

        {/* Barcode Lines Simulation */}
        <View style={styles.barcodeLines}>
          {[4, 2, 6, 3, 5, 2, 7, 3, 2, 6, 4, 2, 5, 3, 7, 2, 4, 3, 5, 2, 6, 4, 2].map((w, i) => (
            <View key={i} style={[styles.barcodeBar, { width: w, marginHorizontal: 1 }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  topBanner: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  pnrBadge: {
    alignItems: 'flex-end',
  },
  pnrLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gold,
  },
  pnrCode: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  body: {
    padding: 20,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  airportCode: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.navy,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  flightIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    width: 32,
    height: 1,
    backgroundColor: COLORS.slate300,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate400,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  seatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },
  perforationContainer: {
    position: 'relative',
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  notchLeft: {
    left: -12,
  },
  notchRight: {
    right: -12,
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.slate300,
    marginHorizontal: 16,
  },
  boardingSection: {
    padding: 20,
    backgroundColor: '#fbfcfd',
  },
  boardingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  boardingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate400,
    textAlign: 'center',
  },
  boardingTime: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.rose,
    textAlign: 'center',
    marginTop: 2,
  },
  boardingGate: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
    textAlign: 'center',
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrBox: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scanNotice: {
    fontSize: 10,
    color: COLORS.slate400,
    marginTop: 6,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: COLORS.slate800,
  },
});
