// RecipeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { colors } from "../theme/colors";
import { useUser } from "../context/UserContext";
import Ionicons from "react-native-vector-icons/Ionicons";

interface Recipe {
  recipeId: string;
  title: string;
  serving: number;
  ingredients: string;
  instructions: string;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  status: string;
  author: string;
  prepTime: number;
  cookTime: number;
  restingTime: number;
  cuisine: string;
  description: string;
  mealType: string;
  overallRating: number;
  imageLink: string;
}

const RecipeScreen: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const { user } = useUser();
  const isPremium = user?.premium === "P";

  // Fetch all recipes
  const fetchRecipes = async () => {
    try {
      const response = await fetch("http://10.0.2.2:8080/api/recipe/active");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Recipe[] = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    }
  };

  // Fetch favourite recipes (only needed for premium users)
  const fetchFavourites = async () => {
    if (!isPremium || !user?.userId) return;

    try {
      const response = await fetch("http://10.0.2.2:8080/api/fav/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const favRecipes: Recipe[] = await response.json();
      setFavourites(favRecipes.map((r) => r.recipeId));
    } catch (error) {
      console.error("Failed to fetch favourites:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    fetchFavourites();
  }, [user]);

  const toggleFavourite = async (id: string) => {
    if (!isPremium || !user?.userId) return;

    try {
      const response = await fetch("http://10.0.2.2:8080/api/fav/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, recipeId: id }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setFavourites((prev) =>
        prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
      );
    } catch (error) {
      console.error("Failed to toggle favourite:", error);
    }
  };

  const displayedRecipes = isPremium
    ? recipes
        .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
        .filter((r) => (showFavourites ? favourites.includes(r.recipeId) : true))
        .sort((a, b) => (sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)))
    : recipes.sort(() => 0.5 - Math.random()).slice(0, 3);

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const isFav = favourites.includes(item.recipeId);

    return (
      <View style={styles.card}>
        {isPremium && (
          <TouchableOpacity
            style={styles.heartIcon}
            onPress={() => toggleFavourite(item.recipeId)}
          >
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color={isFav ? "red" : "#999"} />
          </TouchableOpacity>
        )}

        <Image source={{ uri: item.imageLink }} style={styles.image} />

        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.tagsRow}>
            <Text style={styles.tag}>Prep {item.prepTime} mins</Text>
            <Text style={styles.tag}>Cook {item.cookTime} mins</Text>
            <View style={[styles.kcalPill, styles.kcalLogged]}>
              <Text style={styles.kcalTxt}>{item.calories} kcal</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>View Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isPremium && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.sortButton} onPress={() => setSortAsc(!sortAsc)}>
            <Text>{sortAsc ? "A-Z" : "Z-A"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPremium && (
        <TouchableOpacity
          onPress={() => setShowFavourites((prev) => !prev)}
          style={{
            backgroundColor: "#ff6347",
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {showFavourites ? "All Recipes" : "View Favourites"}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={displayedRecipes}
        keyExtractor={(item) => item.recipeId.toString()}
        renderItem={renderRecipe}
        contentContainerStyle={{ paddingBottom: 50 }}
      />

      {!isPremium && (
        <TouchableOpacity style={styles.unlockButton}>
          <Text style={styles.unlockText}>🔓 Sign Up to Unlock More Recipes</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RecipeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  card: { flexDirection: "row", marginBottom: 15, backgroundColor: "#f9f9f9", borderRadius: 12, overflow: "hidden", elevation: 2, position: "relative" },
  image: { width: 100, height: 100 },
  heartIcon: { position: "absolute", top: -4, right: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, padding: 6, zIndex: 20 },
  cardContent: { flex: 1, padding: 10 },
  title: { fontWeight: "bold", fontSize: 16, paddingRight: 36 },
  tagsRow: { flexDirection: "row", marginTop: 5 },
  tag: { backgroundColor: "#e0f0ff", marginRight: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 12 },
  button: { backgroundColor: "#001f3f", padding: 6, marginTop: 5, borderRadius: 6, alignItems: "center" },
  buttonText: { color: "#fff" },
  unlockButton: { backgroundColor: "#d0f0d0", padding: 12, borderRadius: 6, alignItems: "center", marginTop: 10 },
  unlockText: { color: "#003300", fontWeight: "bold" },
  searchRow: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8 },
  sortButton: { marginLeft: 10, padding: 8, borderRadius: 8, backgroundColor: "#eee" },
  kcalPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  kcalLogged: { backgroundColor: colors.bgLightest },
  kcalTxt: { color: colors.primaryBlue, fontWeight: "800" },
});


