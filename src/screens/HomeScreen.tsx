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

import { BASE_URL } from '../config/api';

const W = Dimensions.get("window").width;

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems]   = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState<MealItem | null>(null);

  // Load UID from AsyncStorage (set during login)
  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem("userId");
      setUserId(uid);
    })();
  }, []);

  const fetchMealLogs = useCallback(async () => {
    if (!userId) return;                    // <- guard until UID is loaded

    setLoading(true);
    setError(null);

    try {
      const url = `${BASE_URL}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`;
      console.log('GET', url, 'UID:', userId);

      const res = await fetch(url);
      const text = await res.text();
      console.log('HTTP', res.status, text);

      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      const data = JSON.parse(text) as Array<{
        mealLogId: number;
        foodsConsumed: string;
        calories: number;
        remarks?: string;
        timeConsumed: string;
      }>;

      const mapped: MealItem[] = data.map(m => ({
        id: String(m.mealLogId),
        name: m.foodsConsumed ?? '(Unnamed)',
        kcal: Number(m.calories ?? 0),
        remarks: m.remarks ?? undefined,
        time: new Date(m.timeConsumed),
      }));

      setItems(mapped);
    } catch (err: any) {
      console.log('NETWORK ERR:', err);
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => { fetchMealLogs(); }, [fetchMealLogs]);

  const handleAdd = () => { setEditItem(null); setShowModal(true); };
  const handleEdit = (id: string) => {
    const it = items.find(x => x.id === id) ?? null;
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
        }
      }
    ]);
  };

  // Optional: sample recs, exercises
  const recs = useMemo(() => [
    { id: "1", name: "Grilled Chicken", kcal: 320 },
    { id: "2", name: "Salad",           kcal: 180 },
    { id: "3", name: "Tomyum Fried Rice", kcal: 480 },
  ], []);
  const exercises: ExerciseEntry[] = [];

  // Total consumed from grouped items
  const consumed = useMemo(
    () => items.reduce((s, f) => s + (Number.isFinite(f.kcal) ? f.kcal : 0), 0),
    [items]
  );
  const goal = 2000;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.canvas}>
        <Text style={{ color: colors.primaryBlue, marginBottom: 8 }}>
          firebaseId: {userId ?? "(null)"}
        </Text>

        <CalorieGoal consumed={consumed} goal={goal} />
        <MealRecom width={W} items={recs} />

        {loading ? <ActivityIndicator /> : (
          <>
            {error ? <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text> : null}
            <GroupedMealLog
              items={items}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        <ExerciseLog items={exercises} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
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
});
