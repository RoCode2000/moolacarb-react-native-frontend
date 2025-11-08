// src/screens/RecipeDetailScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../theme/colors";
import type { RouteProp } from "@react-navigation/native";
import { useRecipes } from "../context/RecipeContext";
import { BASE_URL } from "../config/api";

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
  saturatedFat?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number;
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

const RecipeDetailScreen: React.FC<Props> = ({ route }) => {
  const { recipeId } = route.params;
  const { getRecipe } = useRecipes();
  const recipeFromCtx = getRecipe?.(recipeId) as RecipeDTO | undefined;

  const [remote, setRemote] = useState<RecipeDTO | null>(null);
  const [loading, setLoading] = useState(false);

  // fetch from backend if not in context
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

  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<string[]>([]);

  const handleSendReview = () => {
    if (!reviewText.trim()) return;
    setReviews((prev) => [reviewText, ...prev]);
    setReviewText("");
  };

  const ingredientsArray = useMemo(
    () => (recipe.ingredients ? recipe.ingredients.split("\n") : []),
    [recipe.ingredients]
  );
  const instructionsArray = useMemo(
    () => (recipe.instructions ? recipe.instructions.split("\n") : []),
    [recipe.instructions]
  );

  const imageSource =
    recipe.imageLink && recipe.imageLink.length > 0
      ? { uri: recipe.imageLink }
      : recipe.imageBinary
      ? { uri: `data:image/jpeg;base64,${recipe.imageBinary}` }
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          style={styles.container}
          data={reviews}
          keyExtractor={(item, idx) => idx.toString()}

          ListHeaderComponent={
            <View>
              {imageSource ? (
                <Image source={imageSource} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: "#eee" }]} />
              )}

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

              <View style={styles.infoRow}>
                {typeof recipe.serving === "number" && (
                  <Text style={styles.infoItem}>Serving: {recipe.serving}</Text>
                )}
                {typeof recipe.prepTime === "number" && (
                  <Text style={styles.infoItem}>
                    Prep Time: {recipe.prepTime} mins
                  </Text>
                )}
                {typeof recipe.cookTime === "number" && (
                  <Text style={styles.infoItem}>
                    Cook Time: {recipe.cookTime} mins
                  </Text>
                )}
                {typeof recipe.restingTime === "number" && (
                  <Text style={styles.infoItem}>
                    Resting Time: {recipe.restingTime} mins
                  </Text>
                )}
                {!!recipe.cuisine && (
                  <Text style={styles.infoItem}>Cuisine: {recipe.cuisine}</Text>
                )}
                {!!recipe.mealType && (
                  <Text style={styles.infoItem}>Meal Type: {recipe.mealType}</Text>
                )}
                {!!recipe.author && (
                  <Text style={styles.infoItem}>Author: {recipe.author}</Text>
                )}
                {typeof recipe.overallRating === "number" && (
                  <Text style={styles.infoItem}>
                    Overall Rating: {recipe.overallRating}
                  </Text>
                )}
              </View>

              {!!recipe.description && (
                <>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.listItem}>{recipe.description}</Text>
                </>
              )}

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
  infoRow: { marginBottom: 15 },
  infoItem: { fontSize: 14, marginBottom: 3, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 8 },
  listItem: { fontSize: 14, marginBottom: 4, lineHeight: 20 },
  reviewItem: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  reviewInputRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  reviewInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: colors.primaryGreen,
    borderRadius: 20,
    padding: 10,
  },
});
