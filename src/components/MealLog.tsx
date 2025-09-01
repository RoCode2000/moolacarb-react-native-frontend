import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ListRenderItem } from 'react-native';
import { colors } from '../theme/colors';
import Plus from 'react-native-bootstrap-icons/icons/plus';
import Pencil from 'react-native-bootstrap-icons/icons/pencil';
import Trash from 'react-native-bootstrap-icons/icons/trash';


export type FoodEntry = { id: string; name: string; kcal: number };

type Props = {
  items: FoodEntry[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  title?: string;
};

export default function MealLog({ items, onAdd, onEdit, onDelete, title = "Today’s Meal Log" }: Props) {
  const total = useMemo(() => items.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0), [items]);

  const renderItem: ListRenderItem<FoodEntry> = ({ item }) => {
    const isZero = !item.kcal || item.kcal <= 0;
    return (
      <View style={styles.row}>
        <Text numberOfLines={2} style={[styles.name, isZero ? styles.muted : null]}>{item.name}</Text>

        <View style={[styles.kcalPill, isZero ? styles.kcalMuted : styles.kcalLogged]}>
          <Text style={[styles.kcalTxt, isZero && styles.kcalTxtMuted]}>{item.kcal} kcal</Text>
        </View>

        <Pressable onPress={() => onEdit?.(item.id)} style={styles.iconBtn}>
          <Pencil width={16} height={16} color={colors.primaryBlue} />
        </Pressable>

        <Pressable onPress={() => onDelete?.(item.id)} style={[styles.iconBtn, { marginLeft: 8 }]}>
          <Trash width={16} height={16} color={colors.primaryBlue} />
        </Pressable>

      </View>
    );
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.totalPill}><Text style={styles.totalTxt}>{total} kcal</Text></View>
        <Pressable onPress={onAdd} style={styles.addBtn}><Text style={styles.addTxt}>＋</Text></Pressable>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyCard]}><Text style={{ color: colors.mute }}>No food logged yet</Text></View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          scrollEnabled={false} // let the Home screen ScrollView handle scrolling
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
