// HomeScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Text,
} from "react-native";
import CalorieGoal from "../components/CalorieGoal";
import MealRecom from "../components/MealRecom";
import GroupedMealLog, { MealItem } from "../components/GroupedMealLog";
import AddEditMealModal from "../components/AddEditMealModal";
import { colors } from "../theme/colors";
import { BASE_URL } from "../config/api";
import { auth } from "../config/firebaseConfig";
import { useUser } from "../context/UserContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useRecipes } from "../context/RecipeContext";

const W = Dimensions.get("window").width;

function parseLocalDateTime(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [_, y, mo, d, h, mi, se] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, se);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

const normalizeLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);

type ModalInitial = {
  id?: string;
  name: string;
  kcal: number | null;
  time: Date;
  remarks?: string;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
};

const toNullableInt = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isNaN(n) ? null : Math.max(0, n);
};

const toNullableFloat = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v));
  if (Number.isNaN(n)) return null;
  return n < 0 ? 0 : n;
};

export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.firebaseId ?? auth.currentUser?.uid ?? null;
  const navigation = useNavigation<any>();
  const { addRecipe } = useRecipes();

  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [isGoalLoading, setIsGoalLoading] = useState(false);

  const [recs, setRecs] = useState<
    { id: string; name: string; kcal: number | null; carbs?: number | null; protein?: number | null; fat?: number | null; img?: string | null }[]
  >([]);

  const [allRecipes, setAllRecipes] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<ModalInitial | null>(null);

  // ---- Fetch full recipes once ----
  const fetchAllRecipes = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/recipe/active`);
      const data = await response.json();
      setAllRecipes(data);
      console.log("Full recipes fetched:", data);
    } catch (err) {
      console.error("Failed to fetch full recipes:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllRecipes();
  }, [fetchAllRecipes]);

  // ---- Load meal logs ----
  const fetchMealLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/meallogs/by-firebase/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();

      const mapped: MealItem[] = data.map((m) => ({
        id: String(m.mealLogId),
        name: m.foodsConsumed ?? "(Unnamed)",
        kcal: m.calories == null ? 0 : Number(m.calories),
        remarks: m.remarks ?? undefined,
        time: parseLocalDateTime(m.timeConsumed) ?? new Date(),
        carbs: m.carbs ?? null,
        protein: m.protein ?? null,
        fat: m.fat ?? null,
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

  // ---- Fetch daily goal when screen gains focus ----
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      let isActive = true;
      const fetchGoal = async () => {
        setIsGoalLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/api/calorie-goal/today?firebaseId=${encodeURIComponent(userId)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const newGoal = typeof data?.dailyTarget === "number" ? Math.round(data.dailyTarget) : 0;
          if (isActive) {
            setDailyTarget((prev) => (prev !== newGoal ? newGoal : prev));
          }
        } catch {
          if (isActive) setDailyTarget(0);
        } finally {
          if (isActive) setIsGoalLoading(false);
        }
      };

      fetchGoal();
      return () => {
        isActive = false;
      };
    }, [userId])
  );

  // ---- Fetch meal recommendations when daily goal changes ----
  useEffect(() => {
    if (!userId || !dailyTarget) return;
    const fetchRecs = async () => {
      try {
        const url = `${BASE_URL}/api/calorie-goal/recommendations?firebaseId=${encodeURIComponent(userId)}&count=3`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRecs(
          (Array.isArray(data) ? data : []).map((r: any) => ({
            id: String(r.id),
            name: r.title,
            kcal: r.kcal ?? r.calories ?? null,
            carbs: r.carbohydrates ?? r.carbs ?? null,
            protein: r.protein ?? null,
            fat: r.fat ?? null,
            img: r.imageLink ?? null,
          }))
        );
      } catch (e) {
        console.log("recs error", e);
        setRecs([]);
      }
    };
    fetchRecs();
  }, [userId, dailyTarget]);

  // ---- Modal / Meal log handlers ----
  const handleAdd = () => {
    setDraft({
      name: "",
      kcal: null,
      time: normalizeLocal(new Date()),
      remarks: "",
    });
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    const found = items.find((x) => x.id === id);
    if (!found) return;
    setDraft({
      id: found.id,
      name: found.name,
      kcal: found.kcal,
      time: normalizeLocal(found.time),
      remarks: found.remarks,
      carbs: found.carbs ?? null,
      protein: found.protein ?? null,
      fat: found.fat ?? null,
    });
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

  const handleRecipeCardPress = (recipe: {
    id: string;
    name: string;
    kcal: number | null;
    carbs?: number | null;
    protein?: number | null;
    fat?: number | null;
    img?: string | null;
  }) => {
    const fullRecipe = allRecipes.find((r) => String(r.recipeId) === recipe.id);
    console.log("Full recipe matched:", fullRecipe);

    if (!fullRecipe) {
      Alert.alert("Recipe not found", "Could not find full recipe details.");
      return;
    }

    Alert.alert("What would you like to do?", recipe.name, [
      {
        text: "View Recipe",
        onPress: () => {
          addRecipe({
            recipeId: fullRecipe.recipeId,
            title: fullRecipe.title,
            calories: fullRecipe.calories ?? 0,
            carbohydrates: fullRecipe.carbohydrates ?? 0,
            protein: fullRecipe.protein ?? 0,
            fat: fullRecipe.fat ?? 0,
            imageLink: fullRecipe.imageLink ?? undefined,
            ingredients: fullRecipe.ingredients ?? [],
            instructions: fullRecipe.instructions ?? "",
            prepTime: fullRecipe.prepTime ?? null,
            cookTime: fullRecipe.cookTime ?? null,
            totalTime: fullRecipe.totalTime ?? null,
          });
          navigation.navigate("RecipeDetailScreen", { recipeId: recipe.id });
        },
      },
      {
        text: "Add to today’s meal log",
        onPress: () => {
          const draftFromRecipe: ModalInitial = {
            name: fullRecipe.title ?? recipe.name,
            kcal: toNullableInt(fullRecipe.calories ?? recipe.kcal),
            carbs: toNullableFloat(fullRecipe.carbohydrates ?? recipe.carbs),
            protein: toNullableFloat(fullRecipe.protein ?? recipe.protein),
            fat: toNullableFloat(fullRecipe.fat ?? recipe.fat),
            time: normalizeLocal(new Date()),
            remarks: "",
          };
          setDraft(draftFromRecipe);
          setShowModal(true);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.canvas}>
        {isGoalLoading ? (
          <ActivityIndicator style={{ marginVertical: 12 }} />
        ) : (
          <CalorieGoal consumed={consumedToday} goal={dailyTarget} />
        )}

        {recs.length > 0 ? (
          <MealRecom width={W - 32} items={recs} onPressCard={handleRecipeCardPress} />
        ) : (
          <Text style={{ color: colors.mute, marginBottom: 6 }}>No meal recommendations yet.</Text>
        )}

        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={{ color: "red", marginBottom: 8 }}>Something went wrong! Please try again.</Text>
        ) : (
          <GroupedMealLog items={todayItems} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </View>

      {userId && (
        <AddEditMealModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSaved={fetchMealLogs}
          userId={userId}
          baseUrl={BASE_URL}
          initial={draft}
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
