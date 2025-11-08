// src/screens/RecipeDetailScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { colors } from "../theme/colors";
import type { RouteProp } from "@react-navigation/native";
import { useRecipes } from "../context/RecipeContext";
import { BASE_URL } from "../config/api";
import AddEditMealModal from "../components/AddEditMealModal";
import { auth } from "../config/firebaseConfig";

type RootStackParamList = {
  RecipeDetailScreen: { recipeId: string };
};

type RecipeDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "RecipeDetailScreen"
>;

interface Props {
  route: RecipeDetailScreenRouteProp;
}

type RecipeDTO = {
  recipeId: string;
  title: string;
  ingredients: string;
  instructions: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  serving?: number;
  prepTime?: number;
  cookTime?: number;
  restingTime?: number;
  cuisine?: string;
  mealType?: string;
  author?: string;
  overallRating?: number;
  description?: string;
  imageLink?: string | null;
  imageBinary?: string | null; // base64
};

type ModalInitial = {
  name: string;
  kcal: number | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
  time: Date;
  remarks?: string;
};

const normalizeLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);

const RecipeDetailScreen: React.FC<Props> = ({ route }) => {
  const { recipeId } = route.params;
  const { getRecipe } = useRecipes();
  const recipeFromCtx = getRecipe?.(recipeId) as RecipeDTO | undefined;

  const [remote, setRemote] = useState<RecipeDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<ModalInitial | null>(null);

  const userId = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (recipeFromCtx) {
      setRemote(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const tryFetch = async (path: string) => {
          const res = await fetch(`${BASE_URL}${path}`);
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        };
        let data: RecipeDTO | null = null;
        try {
          data = await tryFetch(`/api/recipes/${encodeURIComponent(recipeId)}`);
        } catch {
          data = await tryFetch(`/api/recipe/${encodeURIComponent(recipeId)}`);
        }
        if (alive) setRemote(data ?? null);
      } catch {
        if (alive) setRemote(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [recipeId, recipeFromCtx]);

  const recipe = recipeFromCtx ?? remote;

  if (!recipe) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}
      >
        <Text>{loading ? "Loading recipe..." : "No recipe data available."}</Text>
      </View>
    );
  }

  const ingredientsArray = useMemo(
    () => (recipe.ingredients ? recipe.ingredients.split("\n") : []),
    [recipe.ingredients]
  );
  const instructionsArray = useMemo(
    () => (recipe.instructions ? recipe.instructions.split("\n") : []),
    [recipe.instructions]
  );

  const isHttpLink =
    typeof recipe.imageLink === "string" &&
    (recipe.imageLink.startsWith("http://") || recipe.imageLink.startsWith("https://"));

  const hasBinary =
    typeof recipe.imageBinary === "string" &&
    recipe.imageBinary.trim().length > 0;

  const imageSource =
    isHttpLink
      ? { uri: recipe.imageLink }
      : hasBinary
      ? { uri: `data:image/jpeg;base64,${recipe.imageBinary}` }
      : require("../../assets/logo.png");

  // ---- Meal logging button ----
  const handleAddMeal = () => {
    if (!userId) return;
    setDraft({
      name: recipe.title ?? "",
      kcal: recipe.calories ?? null,
      carbs: recipe.carbohydrates ?? null,
      protein: recipe.protein ?? null,
      fat: recipe.fat ?? null,
      time: normalizeLocal(new Date()),
      remarks: "",
    });
    setShowModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          style={styles.container}
          data={[]}
          keyExtractor={(item, idx) => idx.toString()}
          ListHeaderComponent={
            <View>
              <Image source={imageSource} style={styles.image} />

              <Text style={styles.title}>{recipe.title}</Text>

              <View style={styles.nutritionRow}>
                {typeof recipe.calories === "number" && (
                  <Text style={styles.nutritionItem}>{recipe.calories} kcal</Text>
                )}
                {typeof recipe.protein === "number" && (
                  <Text style={styles.nutritionItem}>{recipe.protein}g Protein</Text>
                )}
                {typeof recipe.carbohydrates === "number" && (
                  <Text style={styles.nutritionItem}>
                    {recipe.carbohydrates}g Carbs
                  </Text>
                )}
                {typeof recipe.fat === "number" && (
                  <Text style={styles.nutritionItem}>{recipe.fat}g Fat</Text>
                )}
              </View>

              <Pressable style={styles.logButton} onPress={handleAddMeal}>
                <Text style={styles.logButtonText}>Log this meal</Text>
              </Pressable>

              {ingredientsArray.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {ingredientsArray.map((ing, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {ing}
                    </Text>
                  ))}
                </>
              )}

              {instructionsArray.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {instructionsArray.map((step, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      {idx + 1}. {step}
                    </Text>
                  ))}
                </>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </KeyboardAvoidingView>

      {userId && draft && (
        <AddEditMealModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            alert("Meal logged successfully!");
          }}
          userId={userId}
          baseUrl={BASE_URL}
          initial={draft}
        />
      )}
    </SafeAreaView>
  );
};

export default RecipeDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  nutritionRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  nutritionItem: {
    backgroundColor: "#e0f0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  logButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  logButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 8 },
  listItem: { fontSize: 14, marginBottom: 4, lineHeight: 20 },
});
