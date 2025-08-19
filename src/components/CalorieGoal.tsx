import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = { consumed: number; goal: number };

const TRACK_H = 14;

export default function CalorieGoal({ consumed, goal }: Props) {
  const progress = Math.max(0, Math.min(1, goal ? consumed / goal : 0));

  return (
    <View style={styles.card}>
      {/* green pill title */}
      <View style={styles.titlePill}>
        <Text style={styles.titlePillTxt}>Today’s Calorie Goal</Text>
      </View>

      {/* rounded track + rounded fill */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.count}>{consumed}/{goal} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    padding: 14,
    marginBottom: 12,
  },
  titlePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryGreen,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  titlePillTxt: { color: colors.bgLightest, fontWeight: '800' },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    overflow: 'hidden',
    backgroundColor: colors.bgLightest,
  },
  fill: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.primaryGreen,
  },
  count: { marginTop: 8, color: colors.primaryGreen, fontWeight: '800' },
});
