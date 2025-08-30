// RecipeDetailScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors } from "../theme/colors";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../App";
import { useRecipes } from "../context/RecipeContext";

type RecipeDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "RecipeDetailScreen"
>;

interface Props {
  route: RecipeDetailScreenRouteProp;
}

const RecipeDetailScreen: React.FC<Props> = ({ route }) => {
  const { recipeId } = route.params;
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No recipe data available.</Text>
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

  const ingredientsArray = recipe.ingredients.split("\n");
  const instructionsArray = recipe.instructions.split("\n");

  return (
    <FlatList
      style={styles.container}
      data={reviews}
      keyExtractor={(item, idx) => idx.toString()}
      renderItem={({ item }) => <Text style={styles.reviewItem}>{item}</Text>}
      ListEmptyComponent={
        <Text style={styles.reviewItem}>No reviews yet.</Text>
      }
      ListHeaderComponent={
        <View>
          <Image
            source={{ uri: `data:image/jpeg;base64,${recipe.imageBinary}` }}
            style={styles.image}
          />

          <Text style={styles.title}>{recipe.title}</Text>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionItem}>{recipe.calories} kcal</Text>
            <Text style={styles.nutritionItem}>{recipe.protein}g Protein</Text>
            <Text style={styles.nutritionItem}>
              {recipe.carbohydrates}g Carbs
            </Text>
            <Text style={styles.nutritionItem}>{recipe.fat}g Fat</Text>
            <Text style={styles.nutritionItem}>
              {recipe.saturatedFat}g Sat Fat
            </Text>
            <Text style={styles.nutritionItem}>{recipe.sodium}mg Sodium</Text>
            <Text style={styles.nutritionItem}>
              {recipe.cholesterol}mg Cholesterol
            </Text>
            <Text style={styles.nutritionItem}>
              {recipe.potassium}mg Potassium
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoItem}>Serving: {recipe.serving}</Text>
            <Text style={styles.infoItem}>
              Prep Time: {recipe.prepTime} mins
            </Text>
            <Text style={styles.infoItem}>
              Cook Time: {recipe.cookTime} mins
            </Text>
            <Text style={styles.infoItem}>
              Resting Time: {recipe.restingTime} mins
            </Text>
            <Text style={styles.infoItem}>Cuisine: {recipe.cuisine}</Text>
            <Text style={styles.infoItem}>Meal Type: {recipe.mealType}</Text>
            <Text style={styles.infoItem}>Author: {recipe.author}</Text>
            <Text style={styles.infoItem}>
              Overall Rating: {recipe.overallRating}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.listItem}>{recipe.description}</Text>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredientsArray.map((ing, idx) => (
            <Text key={idx} style={styles.listItem}>
              • {ing}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructionsArray.map((step, idx) => (
            <Text key={idx} style={styles.listItem}>
              {idx + 1}. {step}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Reviews</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.reviewInputRow}>
          <TextInput
            style={styles.reviewInput}
            placeholder="Leave a review..."
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Ionicons
            name="send"
            size={28}
            color="#fff"
            style={styles.sendButton}
            onPress={handleSendReview}
          />
        </View>
      }
    />
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
  reviewInputRow: { flexDirection: "row", marginTop: 10, alignItems: "center" },
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
