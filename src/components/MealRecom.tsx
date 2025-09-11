import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";

type Item = { id: string; name: string; kcal: number; img?: string | null };
type Props = {
  width?: number; // total available width
  items: Item[];
  onPressCard?: (item: Item) => void;
};

const CARD_H = 175;

export default function MealRecom({ width = 360, items, onPressCard }: Props) {
  const GAP = 8; // space between cards
  // we render exactly 3 cards side-by-side
  // total = CARD_W*3 + GAP*2
  const CARD_W = Math.floor((width - GAP * 2) / 3);

  return (
    <>
      <Text style={styles.title}>Today’s Meal Recommendation</Text>
      <View style={styles.row}>
        {items.slice(0, 3).map((m, idx) => (
          <TouchableOpacity
            key={m.id}
            activeOpacity={0.85}
            onPress={() => onPressCard?.(m)}
            style={[
              styles.card,
              {
                width: CARD_W,
                height: CARD_H,
                marginRight: idx < 2 ? GAP : 0, // add gap between first two cards
              },
            ]}
          >
            {m.img ? (
              <Image source={{ uri: m.img }} style={styles.img} />
            ) : (
              <View style={[styles.img, { backgroundColor: colors.bgMidLight }]} />
            )}
            <Text numberOfLines={2} style={styles.name}>
              {m.name}
            </Text>
            <Text style={styles.kcal}>{m.kcal} kcal</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.primaryBlue,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
    // no gap here; we manually add marginRight on each card to maximize compatibility
  },
  card: {
    backgroundColor: colors.bgLighter,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bgLighter,
    padding: 10,
    alignItems: "center",
  },
  img: { width: 73, height: 73, borderRadius: 36.5, marginBottom: 10 },
  name: { color: colors.primaryBlue, fontWeight: "800", textAlign: "center" },
  kcal: { color: colors.primaryGreen, fontWeight: "800", marginTop: 6 },
});
