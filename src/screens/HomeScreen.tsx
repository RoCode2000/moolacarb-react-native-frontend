// src/screens/HomeScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Alert, Dimensions, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CalorieGoal from "../components/CalorieGoal";
import MealRecom from "../components/MealRecom";
import GroupedMealLog, { MealItem } from "../components/GroupedMealLog";
import AddEditMealModal from "../components/AddEditMealModal";
import ExerciseLog, { ExerciseEntry } from "../components/ExerciseLog";
import { colors } from "../theme/colors";
import { BASE_URL } from "../config/api";

const W = Dimensions.get("window").width;

// Parse "yyyy-MM-dd'T'HH:mm:ss" as LOCAL time
function parseLocalDateTime(isoNoZone: string): Date {
  const m = isoNoZone.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return new Date(isoNoZone);
  const [_, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MealItem | null>(null);

  // Load UID from AsyncStorage (set during login)
  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem("userId");
      setUserId(uid);
    })();
  }, []);

  const fetchMealLogs = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${BASE_URL}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`;
      console.log("GET", url, "UID:", userId);

      const res = await fetch(url);
      const text = await res.text();
      console.log("HTTP", res.status, text);

      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      const data = JSON.parse(text) as Array<{
        mealLogId: number;
        foodsConsumed: string;
        calories: number;
        remarks?: string;
        timeConsumed: string; // "yyyy-MM-dd'T'HH:mm:ss"
      }>;

      const mapped: MealItem[] = data.map((m) => ({
        id: String(m.mealLogId),
        name: m.foodsConsumed ?? "(Unnamed)",
        kcal: Number(m.calories ?? 0),
        remarks: m.remarks ?? undefined,
        time: parseLocalDateTime(m.timeConsumed), // 👈 local, no TZ shift
      }));

      // Sort desc by time (latest first) so "today log" is naturally ordered
      mapped.sort((a, b) => b.time.getTime() - a.time.getTime());

      setItems(mapped);
    } catch (err: any) {
      console.log("NETWORK ERR:", err);
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMealLogs();
  }, [fetchMealLogs]);

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

  // Hardcoded recommendations (today)
  const recs = useMemo(
    () => [
      { id: "1", name: "Grilled Chicken", kcal: 320 },
      { id: "2", name: "Salad", kcal: 180 },
      { id: "3", name: "Tomyum Fried Rice", kcal: 480 },
    ],
    []
  );

  // Today-only view
  const todayItems = useMemo(() => {
    const now = new Date();
    return items.filter((it) => isSameLocalDay(it.time, now));
  }, [items]);

  const consumedToday = useMemo(
    () => todayItems.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0),
    [todayItems]
  );

  const goal = 2000;
  const exercisesToday: ExerciseEntry[] = []; // empty state for now

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.canvas}>
        <CalorieGoal consumed={consumedToday} goal={goal} />

        <MealRecom width={W} items={recs} />

        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
        ) : todayItems.length === 0 ? (
          <Text style={{ color: colors.mute, marginBottom: 8 }}>No meal logged yet.</Text>
        ) : (
          <GroupedMealLog items={todayItems} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        <Text style={styles.sectionTitle}>Today&apos;s Exercise Log</Text>
        {exercisesToday.length === 0 ? (
          <Text style={{ color: colors.mute, marginBottom: 8 }}>No exercise logged yet.</Text>
        ) : (
          <ExerciseLog items={exercisesToday} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
        )}
      </View>

      {/* Add / Edit modal */}
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
