import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ListRenderItem } from 'react-native';
import { colors } from '../theme/colors';

export type ExerciseEntry = { id: string; name: string; kcal: number };

type Props = {
  items: ExerciseEntry[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function ExerciseLog({ items, onAdd, onEdit, onDelete }: Props) {
  const total = useMemo(() => items.reduce((s, e) => s + (Number.isFinite(e.kcal) ? e.kcal : 0), 0), [items]);

  const renderItem: ListRenderItem<ExerciseEntry> = ({ item }) => {
    const isZero = !item.kcal || item.kcal <= 0;
    return (
      <View style={styles.row}>
        <Text numberOfLines={2} style={[styles.name, isZero ? styles.muted : null]}>{item.name}</Text>

        <View style={[styles.kcalPill, isZero ? styles.kcalMuted : styles.kcalLogged]}>
          <Text style={[styles.kcalTxt, isZero && styles.kcalTxtMuted]}>{item.kcal} kcal</Text>
        </View>

        <Pressable onPress={() => onEdit?.(item.id)} style={styles.iconBtn}><Text style={styles.iconTxt}>✏️</Text></Pressable>
        <Pressable onPress={() => onDelete?.(item.id)} style={[styles.iconBtn, { marginLeft: 8 }]}><Text style={styles.iconTxt}>🗑</Text></Pressable>
      </View>
    );
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today’s Exercise Log</Text>
        <View style={styles.totalPill}><Text style={styles.totalTxt}>{total} kcal</Text></View>
        <Pressable onPress={onAdd} style={styles.addBtn}><Text style={styles.addTxt}>＋</Text></Pressable>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyCard]}><Text style={{ color: colors.mute }}>No exercise logged yet</Text></View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { color: colors.primaryBlue, fontSize: 16, fontWeight: '800', flex: 1 },
  totalPill: { backgroundColor: colors.primaryBlue, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4 },
  totalTxt: { color: colors.primaryGreen, fontWeight: '800' },
  addBtn: { marginLeft: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: colors.primaryGreen, fontWeight: '800', fontSize: 16, lineHeight: 16 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgPrimary, borderRadius: 12, borderWidth: 1, borderColor: colors.mute,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  name: { flex: 1, color: colors.primaryBlue, fontWeight: '700' },
  muted: { color: colors.mute },
  kcalPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  kcalLogged: { backgroundColor: colors.bgLightest },
  kcalMuted: { backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.mute },
  kcalTxt: { color: colors.primaryBlue, fontWeight: '800' },
  kcalTxtMuted: { color: colors.mute, fontWeight: '700' },

  emptyCard: {
    backgroundColor: colors.bgPrimary, borderRadius: 12, borderWidth: 1, borderColor: colors.mute,
    paddingVertical: 14, alignItems: 'center',
  },
  iconBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.mute,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },
  iconTxt: { color: colors.primaryBlue, fontWeight: '800' },
});
