import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Alert, Dimensions, Text } from "react-native";
import CalorieGoal from "../components/CalorieGoal";
import MealRecom from "../components/MealRecom";
import GroupedMealLog, { MealItem } from "../components/GroupedMealLog";
import AddEditMealModal from "../components/AddEditMealModal";
import ExerciseLog, { ExerciseEntry } from "../components/ExerciseLog";
import { colors } from "../theme/colors";
import { BASE_URL } from "../config/api";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";

const W = Dimensions.get("window").width;

const recs = [
  { id: "1", name: "Grilled Chicken", kcal: 320 },
  { id: "2", name: "Salad", kcal: 180 },
  { id: "3", name: "Tomyum Fried Rice", kcal: 480 },
];

/** Accepts "YYYY-MM-DDTHH:mm:ss" OR "YYYY-MM-DD HH:mm:ss" and returns a *local* Date */
function parseLocalDateTime(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return new Date(s); // fallback
  const [_, y, mo, d, h, mi, se] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, se); // local wall time
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.firebaseId ?? auth.currentUser?.uid ?? null;

  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MealItem | null>(null);

  const fetchMealLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${BASE_URL}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      type ApiMeal = {
        mealLogId: number;
        foodsConsumed: string;
        calories: number;
        remarks?: string;
        timeConsumed: string; // "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
      };

      const data: ApiMeal[] = await res.json();

      const mapped: MealItem[] = data.map(m => ({
        id: String(m.mealLogId),
        name: m.foodsConsumed ?? "(Unnamed)",
        kcal: Number(m.calories ?? 0),
        remarks: m.remarks ?? undefined,
        time: parseLocalDateTime(m.timeConsumed),
      }));

      mapped.sort((a, b) => b.time.getTime() - a.time.getTime());
      setItems(mapped);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    fetchMealLogs();
  }, [userId, fetchMealLogs]);

  const handleAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    const it = items.find((x) => x.id === id) ?? null;
    setEditItem(it);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete meal", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/meallogs/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchMealLogs();
          } catch (e: any) {
            Alert.alert("Delete failed", e?.message ?? "Unknown error");
          }
        },
      },
    ]);
  };

  // Robust “today” filter using start/end-of-day
  const todayItems = useMemo(() => {
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);
    return items.filter((it) => it.time >= start && it.time < end);
  }, [items]);

  const consumedToday = useMemo(
    () => todayItems.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0),
    [todayItems]
  );

  const goal = 2000;
  const exercisesToday: ExerciseEntry[] = [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.canvas}>
        <CalorieGoal consumed={consumedToday} goal={goal} />

        <MealRecom width={W} items={recs} />

        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
        ) : (
          <GroupedMealLog
            items={todayItems}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Text style={styles.sectionTitle}>Today's Exercise Log</Text>
        {exercisesToday.length === 0 ? (
          <Text style={{ color: colors.mute, marginBottom: 8 }}>No exercise logged yet for today.</Text>
        ) : (
          <ExerciseLog items={exercisesToday} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
        )}
      </View>

      {userId && (
        <AddEditMealModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSaved={fetchMealLogs}
          userId={userId}
          baseUrl={BASE_URL}
          initial={editItem}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, padding: 16, backgroundColor: colors.bgPrimary },
  sectionTitle: {
    color: colors.primaryBlue,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
});
