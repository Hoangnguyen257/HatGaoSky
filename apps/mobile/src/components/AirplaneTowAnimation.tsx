import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Path, Ellipse, Rect, Circle, Line, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface AirplaneTowAnimationProps {
  isLanded: boolean;
  onAnimationComplete?: () => void;
}

export const AirplaneTowAnimation: React.FC<AirplaneTowAnimationProps> = ({
  isLanded,
  onAnimationComplete,
}) => {
  // Animation drivers
  const planeAnim = useRef(new Animated.Value(0)).current;
  const cableOpacity = useRef(new Animated.Value(1)).current;
  const dustAnim = useRef(new Animated.Value(0)).current;
  const [hasFlownAway, setHasFlownAway] = React.useState(false);

  useEffect(() => {
    if (!isLanded) {
      setHasFlownAway(false);
      planeAnim.setValue(0);
      cableOpacity.setValue(1);
      dustAnim.setValue(0);

      // Sequence:
      // 0.0s -> 1.5s: Plane tows the card down
      // 1.5s: Touchdown dust shockwave
      // 1.5s -> 2.3s: Plane detaches cables, boosts jet engines and flies away
      Animated.sequence([
        Animated.timing(planeAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(cableOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(dustAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(dustAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(planeAnim, {
            toValue: 2,
            duration: 800,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setHasFlownAway(true);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [isLanded]);

  if (hasFlownAway && isLanded) return null;

  // Plane position interpolation:
  // Phase 1 (0 -> 1): Swoops down from top-left to center above the card
  // Phase 2 (1 -> 2): Blasts upward and off screen to the top-right
  const planeTranslateX = planeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-width * 0.4, 0, width * 0.9],
  });

  const planeTranslateY = planeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-120, -10, -180],
  });

  const planeRotate = planeAnim.interpolate({
    inputRange: [0, 1, 1.2, 2],
    outputRange: ['12deg', '0deg', '-15deg', '-28deg'],
  });

  const planeScale = planeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.75, 1, 1.25],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* 1. Towing Cables (connected to the plane hook) */}
      <Animated.View style={[styles.cablesWrapper, { opacity: cableOpacity }]}>
        <Svg width={width - 32} height={120} viewBox="0 0 320 120" style={styles.cablesSvg}>
          {/* Left cable with yellow/gold stripe */}
          <Line
            x1="160"
            y1="20"
            x2="40"
            y2="115"
            stroke={COLORS.gold}
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
          {/* Right cable */}
          <Line
            x1="160"
            y1="20"
            x2="280"
            y2="115"
            stroke={COLORS.gold}
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
          {/* Tow hooks */}
          <Circle cx="160" cy="20" r="5" fill={COLORS.navy} stroke={COLORS.gold} strokeWidth="2" />
          <Circle cx="40" cy="115" r="4.5" fill={COLORS.navy} stroke={COLORS.gold} strokeWidth="2" />
          <Circle cx="280" cy="115" r="4.5" fill={COLORS.navy} stroke={COLORS.gold} strokeWidth="2" />
        </Svg>
      </Animated.View>

      {/* 2. The Boeing/Airbus Jet Airplane */}
      <Animated.View
        style={[
          styles.planeContainer,
          {
            transform: [
              { translateX: planeTranslateX },
              { translateY: planeTranslateY },
              { rotate: planeRotate },
              { scale: planeScale },
            ],
          },
        ]}
      >
        <Svg viewBox="0 0 320 110" width={240} height={82}>
          {/* Dual Jet Exhaust Flame & Contrail */}
          <G>
            {/* Contrail trail */}
            <Path
              d="M 20 62 L -60 62"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8,6"
            />
            <Path
              d="M 35 68 L -50 68"
              stroke="rgba(56,189,248,0.7)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Jet flame */}
            <Ellipse cx="48" cy="64" rx="14" ry="5" fill="#f59e0b" />
            <Ellipse cx="50" cy="64" rx="8" ry="3" fill="#38bdf8" />
            <Ellipse cx="52" cy="64" rx="4" ry="1.5" fill="#ffffff" />
          </G>

          {/* Main Fuselage Body */}
          <Path
            d="M 60 62 C 90 62 140 60 210 58 C 250 56 280 50 300 46 C 308 44 312 40 305 38 C 290 34 260 30 220 30 C 140 30 90 32 60 38 Z"
            fill="#ffffff"
          />

          {/* VietSky Signature Deep Navy Underside */}
          <Path
            d="M 60 62 C 100 62 160 60 220 56 C 265 52 295 47 305 38 C 295 44 260 50 215 54 C 140 58 90 60 60 62 Z"
            fill={COLORS.navy}
          />

          {/* Golden Lotus Speedline */}
          <Path
            d="M 68 56 C 120 54 180 52 240 48 C 275 44 295 41 300 39"
            stroke={COLORS.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Cockpit Window */}
          <Path
            d="M 285 37 C 295 38 300 40 298 42 C 290 42 280 40 282 38 Z"
            fill="#0369a1"
          />

          {/* Cabin Passenger Windows */}
          <G fill={COLORS.navy} opacity={0.85}>
            {[120, 136, 152, 168, 184, 200, 216, 232, 248].map((x) => (
              <Rect key={x} x={x} y="39" width="6" height="4" rx="2" />
            ))}
          </G>

          {/* Tail Fin */}
          <Path d="M 70 36 L 38 4 C 36 2 34 2 32 5 L 42 38 Z" fill={COLORS.navy} />
          {/* Golden Lotus emblem on tail */}
          <Path d="M 45 15 L 49 24 L 41 24 Z" fill={COLORS.gold} />
          <Circle cx="45" cy="20" r="2.5" fill="#f59e0b" />

          {/* Main Wing Swept with gold winglet */}
          <Path
            d="M 175 48 L 135 84 C 133 86 135 88 138 88 L 160 84 L 205 50 Z"
            fill="#cbd5e1"
          />
          <Path d="M 134 85 L 132 94 C 132 96 134 97 136 96 L 140 88 Z" fill={COLORS.gold} />

          {/* Jet Engine Turbofan */}
          <Rect x="155" y="58" width="34" height="13" rx="5" fill="#475569" />
          <Ellipse cx="188" cy="64.5" rx="3.5" ry="6" fill={COLORS.navy} stroke={COLORS.gold} strokeWidth="1" />
          <Ellipse cx="156" cy="64.5" rx="3" ry="5" fill="#0284c7" />

          {/* Tow Winch Hook */}
          <Circle cx="70" cy="58" r="4" fill="#334155" stroke={COLORS.gold} strokeWidth="1.5" />
        </Svg>
      </Animated.View>

      {/* 3. Touchdown Shockwave / Runway Dust */}
      <Animated.View
        style={[
          styles.dustShockwave,
          {
            opacity: dustAnim,
            transform: [
              {
                scaleX: dustAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1.2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  cablesWrapper: {
    position: 'absolute',
    top: 35,
    width: '100%',
    alignItems: 'center',
  },
  cablesSvg: {
    overflow: 'visible',
  },
  planeContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  dustShockwave: {
    position: 'absolute',
    bottom: -320,
    width: width * 0.75,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
  },
});
