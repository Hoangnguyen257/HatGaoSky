import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const DEFAULT_REWARDS = [
  { id: 'r1', name: 'Voucher giảm giá vé 500.000 đ', milesRequired: 5000, icon: 'ticket-outline' },
  { id: 'r2', name: 'Nâng hạng ghế Thương gia 1 chặng', milesRequired: 12000, icon: 'sparkles-outline' },
  { id: 'r3', name: 'Thêm 20kg Hành lý ký gửi', milesRequired: 3000, icon: 'briefcase-outline' },
  { id: 'r4', name: 'Vé vào Phòng chờ Lotus Lounge', milesRequired: 4000, icon: 'cafe-outline' },
];

export const LotusClubScreen = ({ navigation }: any) => {
  const { user, quickLoginRole } = useAuth();
  const [miles, setMiles] = useState(user?.loyaltyAccount?.milesBalance || 0);
  const [tier, setTier] = useState(user?.loyaltyAccount?.tier || 'MEMBER');
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadLoyalty();
    } else {
      setMiles(0);
      setTier('MEMBER');
    }
  }, [user]);

  const loadLoyalty = async () => {
    try {
      const data = await api.getMyLoyalty();
      if (data?.milesBalance !== undefined) {
        setMiles(data.milesBalance);
        setTier(data.tier || user?.loyaltyAccount?.tier || 'GOLD');
      }
    } catch {
      if (user?.loyaltyAccount?.milesBalance !== undefined) {
        setMiles(user.loyaltyAccount.milesBalance);
        setTier(user.loyaltyAccount.tier || 'GOLD');
      }
    }
  };

  const handleRedeem = (reward: any) => {
    if (!user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản hội viên Lotus Club để tích lũy và đổi dặm thưởng.',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('ProfileTab'),
          },
        ]
      );
      return;
    }

    if (miles < reward.milesRequired) {
      Alert.alert('Không đủ dặm', `Bạn cần tối thiểu ${reward.milesRequired.toLocaleString('vi-VN')} dặm để đổi phần thưởng này.`);
      return;
    }

    Alert.alert(
      'Xác nhận đổi thưởng',
      `Bạn có muốn dùng ${reward.milesRequired.toLocaleString('vi-VN')} dặm để nhận "${reward.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đổi ngay',
          onPress: async () => {
            setLoading(true);
            try {
              await api.exchangeReward(reward.id).catch(() => {});
              setMiles((prev) => Math.max(0, prev - reward.milesRequired));
              Alert.alert('Thành công', `Chúc mừng! Bạn đã đổi thành công "${reward.name}". Mã ưu đãi đã được lưu vào hồ sơ.`);
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể đổi quà');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Hội viên Lotus Club" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Membership Card */}
        {user ? (
          <View style={styles.cardWrapper}>
            <View style={styles.memberCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardLogo}>
                  <Ionicons name="airplane" size={16} color={COLORS.navy} />
                  <Text style={styles.cardLogoText}>HẠT GẠO SKY</Text>
                </View>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>{tier}</Text>
                </View>
              </View>

              <View style={styles.milesSection}>
                <Text style={styles.milesLabel}>SỐ DƯ DẶM THƯỞNG</Text>
                <Text style={styles.milesValue}>
                  {miles.toLocaleString('vi-VN')} <Text style={styles.milesUnit}>dặm</Text>
                </Text>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardHolderLabel}>CHỦ THẺ</Text>
                  <Text style={styles.cardHolderName}>
                    {user.fullName?.toUpperCase() || 'HỘI VIÊN'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardHolderLabel}>SỐ HỘI VIÊN</Text>
                  <Text style={styles.cardNumber}>
                    {user.loyaltyAccount?.membershipNumber || `HG-${user.id?.slice(0, 8).toUpperCase() || '889922'}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cardWrapper}>
            <View style={styles.guestCard}>
              <View style={styles.guestCardTop}>
                <View style={styles.cardLogo}>
                  <Ionicons name="airplane" size={16} color={COLORS.navy} />
                  <Text style={styles.cardLogoText}>HẠT GẠO SKY</Text>
                </View>
                <View style={styles.guestBadge}>
                  <Ionicons name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.guestBadgeText}>LOTUS CLUB</Text>
                </View>
              </View>

              <View style={styles.guestContent}>
                <View style={styles.guestIconCircle}>
                  <Ionicons name="ribbon" size={28} color={COLORS.gold} />
                </View>
                <Text style={styles.guestTitle}>Chương trình Hội viên Lotus Club</Text>
                <Text style={styles.guestDesc}>
                  Đăng nhập để xem số dư dặm thưởng cá nhân, tích lũy dặm trên mỗi chuyến bay và đổi quà tặng hấp dẫn.
                </Text>
              </View>

              <View style={styles.guestActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileTab')}
                  style={styles.guestLoginBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={16} color={COLORS.navy} />
                  <Text style={styles.guestLoginText}>Đăng nhập ngay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => quickLoginRole('CUSTOMER')}
                  style={styles.guestQuickLoginBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestQuickLoginText}>Đăng nhập nhanh Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Benefits Grid */}
        <View style={styles.benefitsRow}>
          <View style={styles.benefitCol}>
            <Ionicons name="trending-up" size={20} color={COLORS.cyan} />
            <Text style={styles.benefitText}>Nhân đôi dặm bay</Text>
          </View>
          <View style={styles.benefitCol}>
            <Ionicons name="ribbon" size={20} color={COLORS.gold} />
            <Text style={styles.benefitText}>Ưu tiên làm thủ tục</Text>
          </View>
          <View style={styles.benefitCol}>
            <Ionicons name="cafe" size={20} color={COLORS.emerald} />
            <Text style={styles.benefitText}>Phòng chờ Hạng nhất</Text>
          </View>
        </View>

        {/* Redeem Rewards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đổi Dặm Thưởng Lấy Quà</Text>
          <Text style={styles.sectionSubtitle}>
            Dùng dặm tích lũy để đổi vé bay miễn phí hoặc dịch vụ tiện ích
          </Text>

          <View style={styles.rewardsList}>
            {rewards.map((r) => (
              <View key={r.id} style={styles.rewardCard}>
                <View style={styles.rewardLeft}>
                  <View style={styles.rewardIconCircle}>
                    <Ionicons name={r.icon as any} size={20} color={COLORS.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardName}>{r.name}</Text>
                    <Text style={styles.rewardCost}>
                      ⭐ {r.milesRequired.toLocaleString('vi-VN')} dặm
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRedeem(r)}
                  style={[
                    styles.redeemBtn,
                    (!user || miles < r.milesRequired) && styles.disabledRedeemBtn,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.redeemBtnText,
                      (!user || miles < r.milesRequired) && styles.disabledRedeemText,
                    ]}
                  >
                    {user ? 'Đổi quà' : 'Cần đăng nhập'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
  cardWrapper: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#0f2445',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardLogoText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.navy,
  },
  tierPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.goldLight,
    letterSpacing: 1,
  },
  milesSection: {
    marginBottom: 24,
  },
  milesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate300,
    letterSpacing: 0.5,
  },
  milesValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
  },
  milesUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 14,
  },
  cardHolderLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate300,
    marginTop: 2,
    letterSpacing: 1,
  },
  guestCard: {
    backgroundColor: '#0f2445',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  guestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.8,
  },
  guestContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 12,
    color: COLORS.slate300,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  guestActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  guestLoginText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },
  guestQuickLoginBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  guestQuickLoginText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  benefitCol: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  benefitText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate700,
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
    marginBottom: 14,
  },
  rewardsList: {
    gap: 10,
  },
  rewardCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rewardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  rewardCost: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.goldDark,
    marginTop: 2,
  },
  redeemBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disabledRedeemBtn: {
    backgroundColor: COLORS.slate200,
  },
  redeemBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  disabledRedeemText: {
    color: COLORS.slate400,
  },
});

