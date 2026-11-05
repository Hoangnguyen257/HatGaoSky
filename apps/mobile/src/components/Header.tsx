import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Hạt Gạo Sky', showBack = false, onBack, rightAction }) => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Ionicons name="airplane" size={18} color={COLORS.gold} />
          </View>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Hãng hàng không Quốc gia</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.userBadge}>
            <Ionicons
              name={user ? (user.role === 'ADMIN' ? 'shield-checkmark' : 'person-circle') : 'person-outline'}
              size={18}
              color={user ? COLORS.gold : COLORS.slate300}
            />
            <Text style={styles.userName} numberOfLines={1}>
              {user ? user.fullName?.split(' ').slice(-1)[0] : 'Khách'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.navy,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.gold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

