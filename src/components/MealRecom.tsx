import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/colors';

type Item = { id: string; name: string; kcal: number; img?: string | null };
type Props = { width?: number; items: Item[] };

const CARD_H = 175;

export default function MealRecom({ width = 395, items }: Props) {
  const GAP = 5;
  const CARD_W = (width - GAP * 2) / 3;

  return (
    <>
      <Text style={styles.title}>Today’s Meal Recommendation</Text>
      <View style={[styles.row, { columnGap: GAP }]}>
        {items.slice(0, 3).map((m) => (
          <View key={m.id} style={[styles.card, { width: CARD_W, height: CARD_H }]}>
            {m.img ? (
              <Image source={{ uri: m.img }} style={styles.img} />
            ) : (
              <View style={[styles.img, { backgroundColor: colors.bgMidLight }]} />
            )}
            <Text numberOfLines={2} style={styles.name}>{m.name}</Text>
            <Text style={styles.kcal}>{m.kcal} kcal</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.primaryBlue, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 4 },
  card: {
    backgroundColor: colors.bgLighter,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bgLighter,
    padding: 10,
    alignItems: 'center',
  },
  img: { width: 73, height: 73, borderRadius: 36.5, marginBottom: 10 },
  name: { color: colors.primaryBlue, fontWeight: '800', textAlign: 'center' },
  kcal: { color: colors.primaryGreen, fontWeight: '800', marginTop: 6 },
});
