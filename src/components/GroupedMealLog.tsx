import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ListRenderItem,
  FlatList,
} from "react-native";
import { colors } from "../theme/colors";
import Pencil from "react-native-bootstrap-icons/icons/pencil";
import Trash from "react-native-bootstrap-icons/icons/trash";
import Plus from "react-native-bootstrap-icons/icons/plus";

export type MealItem = {
  id: string;
  name: string;
  kcal: number;
  time: Date;
  remarks?: string;
};

type Props = {
  items: MealItem[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  title?: string;
  /** Hide title/total/add row when embedding in Report’s Daily tab */
  showTopBar?: boolean; // default true
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function GroupedMealLog({
  items,
  onAdd,
  onEdit,
  onDelete,
  title = "Today's Meal Log",
  showTopBar = true,
}: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.time.getTime() - b.time.getTime()),
    [items]
  );

  const total = useMemo(
    () => items.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0),
    [items]
  );

  const renderItem: ListRenderItem<MealItem> = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>
          {fmtTime(item.time)}{item.remarks ? ` • ${item.remarks}` : ""}
        </Text>
      </View>

      <View style={[styles.kcalPill, styles.kcalLogged]}>
        <Text style={styles.kcalTxt}>{item.kcal} kcal</Text>
      </View>

      {onEdit && (
        <Pressable onPress={() => onEdit(item.id)} style={styles.iconBtn}>
          <Pencil width={16} height={16} color={colors.primaryBlue} />
        </Pressable>
      )}
      {onDelete && (
        <Pressable onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 8 }]}>
          <Trash width={16} height={16} color={colors.primaryBlue} />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={{ marginTop: 8 }}>
      {showTopBar && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.totalPill}><Text style={styles.totalTxt}>{total} kcal</Text></View>
          {onAdd && (
            <Pressable onPress={onAdd} style={styles.addBtn}>
              <Plus width={18} height={18} color={colors.primaryGreen} />
            </Pressable>
          )}
        </View>
      )}

      {items.length === 0 ? (
        <Text style={{ color: colors.mute, marginBottom: 8 }}>No meal logged yet for this day.</Text>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          scrollEnabled={false} // parent ScrollView handles scrolling
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { color: colors.primaryBlue, fontSize: 16, fontWeight: "800", flex: 1 },
  totalPill: { backgroundColor: colors.primaryBlue, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4 },
  totalTxt: { color: colors.primaryGreen, fontWeight: "800" },
  addBtn: {
    marginLeft: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryBlue, alignItems: "center", justifyContent: "center"
  },

  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bgPrimary, borderRadius: 12, borderWidth: 1, borderColor: colors.mute,
    paddingVertical: 10, paddingHorizontal: 12
  },
  name: { color: colors.primaryBlue, fontWeight: "700" },
  sub: { color: colors.mute, fontSize: 12, marginTop: 2 },

  kcalPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginLeft: "auto", marginRight: 6 },
  kcalLogged: { backgroundColor: colors.bgLightest },
  kcalTxt: { color: colors.primaryBlue, fontWeight: "800" },

  iconBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.mute,
    alignItems: "center", justifyContent: "center"
  },
});
