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
import { useNavigation } from "@react-navigation/native";

const W = Dimensions.get("window").width;

/** Accepts "YYYY-MM-DDTHH:mm:ss" OR "YYYY-MM-DD HH:mm:ss" and returns a local Date */
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

// Reusable function to fetch recipe data
const fetchRecipeData = async (recipeId: string) => {
  const tryFetch = async (path: string) => {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  };

  try {
    let data: any | null = await tryFetch(`/api/recipes/${encodeURIComponent(recipeId)}`);
    return data;
  } catch (e) {
    let data: any | null = await tryFetch(`/api/recipe/${encodeURIComponent(recipeId)}`);
    return data;
  }
};

// A small helper to normalize a local Date
const normalizeLocal = (d: Date) =>
  new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    0
  );

/** Shape used by AddEditMealModal.initial (id is optional) */
type ModalInitial = {
  id?: string;
  name: string;
  kcal: number;
  time: Date;
  remarks?: string;
};

export default function HomeScreen() {
  const { user } = useUser();
  const userId = user?.firebaseId ?? auth.currentUser?.uid ?? null;
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [recs, setRecs] = useState<{ id: string; name: string; kcal: number; img?: string | null }[]>([]);

  const [showModal, setShowModal] = useState(false);
  // Store a draft for the modal, not necessarily an existing item (id optional)
  const [draft, setDraft] = useState<ModalInitial | null>(null);

  // ---- Load meal logs ------------------------------------------------------
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
        timeConsumed: string;
      };

      const data: ApiMeal[] = await res.json();

      const mapped: MealItem[] = data.map((m) => {
        const t = parseLocalDateTime(m.timeConsumed) ?? new Date(); // fallback to now if parsing fails
        return {
          id: String(m.mealLogId),
          name: m.foodsConsumed ?? "(Unnamed)",
          kcal: Number(m.calories ?? 0),
          remarks: m.remarks ?? undefined,
          time: t,
        };
      });

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

  // ---- Compute today's totals ---------------------------------------------
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

  // ---- Fetch daily goal first ---------------------------------------------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/calorie-goal/today?firebaseId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (typeof data?.dailyTarget === "number") {
          setDailyTarget(Math.round(data.dailyTarget));
        } else {
          setDailyTarget(0);
        }
      } catch {
        setDailyTarget(0);
      }
    })();
  }, [userId]);

  // ---- Fetch 3 meal recommendations (approx to daily target) ---------------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const url = `${BASE_URL}/api/calorie-goal/recommendations?firebaseId=${encodeURIComponent(userId)}&count=3`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${txt ? ` - ${txt}` : ""}`);
        }
        const data = await res.json();
        setRecs(
          (Array.isArray(data) ? data : []).map((r: any) => ({
            id: String(r.id),
            name: r.title,
            kcal: Number(r.kcal ?? r.calories ?? 0),
            img: r.imageLink ?? null,
          }))
        );
      } catch (e) {
        console.log("recs error", e);
        setRecs([]);
      }
    })();
  }, [userId]);

  // ---- UI handlers ---------------------------------------------------------
  const handleAdd = () => {
    // fresh draft with "now" as default time
    setDraft({
      name: "",
      kcal: 0,
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
    kcal: number;
    img?: string | null;
  }) => {
    Alert.alert("What would you like to do?", recipe.name, [
      {
        text: "View Recipe",
        onPress: () => {
          navigation.navigate("RecipeDetailScreen", {
            recipeId: recipe.id,
          });
        },
      },
      {
        text: "Add to today’s meal log",
        onPress: async () => {
          try {
            const data = await fetchRecipeData(recipe.id);

            const draftFromRecipe: ModalInitial = {
              // no id here -> modal will POST (add), not PUT (edit)
              name: data?.title ?? recipe.name,
              kcal: Number(data?.calories ?? recipe.kcal ?? 0),
              time: normalizeLocal(new Date()), // "today" by default; user can change in modal
              remarks: data?.remarks ?? "",
            };

            setDraft(draftFromRecipe);
            setShowModal(true);
          } catch (e: any) {
            console.error("Add to log failed", e);
            Alert.alert("Couldn’t load recipe", e?.message ?? "Please try again.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.canvas}>
        <CalorieGoal consumed={consumedToday} goal={dailyTarget} />

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
          initial={draft} // <-- optional id; modal decides POST vs PUT
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
