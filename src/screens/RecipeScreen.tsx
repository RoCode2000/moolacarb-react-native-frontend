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
import AddRecipeModal from "../components/AddRecipeModal";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useRecipes } from "../context/RecipeContext";
import { useMemo } from "react";
import { BASE_URL } from "../config/api";

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
  imageBinary: string;
}

type RecipeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RecipeScreen"
>;

const RecipeScreen: React.FC = () => {
  const navigation = useNavigation<RecipeScreenNavigationProp>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Favourites" | "My">("All");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [favouriteRecipes, setFavouriteRecipes] = useState<Recipe[]>([]);
  const { user } = useUser();
  const isPremium = user?.premium === "P";
  const { addRecipe } = useRecipes();

  // Fetch all recipes
  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/recipe/active`);
      const data: Recipe[] = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    }
  };

  // Fetch favourites for premium users
  const fetchFavourites = async () => {
    if (!isPremium || !user?.userId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/fav/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      const favRecipes: Recipe[] = await response.json();
      setFavourites(favRecipes.map((r) => r.recipeId));
    } catch (error) {
      console.error("Failed to fetch favourites:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchFavourites();
  }, []);

  useEffect(() => {
    if (activeTab === "Favourites") {
      fetchFavouriteRecipes();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "My") {
      fetchMyRecipes();
    } else {
      fetchRecipes(); // All or Favourites tab
    }
  }, [activeTab]);

  const toggleFavourite = async (id: string) => {
    if (!isPremium || !user?.userId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/fav/toggle`, {
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

  // Filter recipes based on active tab
//   const filteredRecipes =
//     activeTab === "Favourites"
//       ? favouriteRecipes
//       : activeTab === "My"
//       ? recipes.filter((r) => r.author === user?.userId)
//       : recipes;// search
//
//   const searchedRecipes = filteredRecipes.filter((r) =>
//     r.title.toLowerCase().includes(search.toLowerCase())
//   );
//
//   const sortedRecipes = searchedRecipes.sort((a, b) =>
//     sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
//   );
  const filteredRecipes =
    activeTab === "Favourites"
      ? favouriteRecipes || []
      : activeTab === "My"
      ? (recipes || []).filter((r) => r.author === user?.userId)
      : recipes || [];

  const searchedRecipes = (filteredRecipes || []).filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const sortedRecipes = (searchedRecipes || []).sort((a, b) =>
    sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );

  const limitedRecipes =
    !isPremium && (sortedRecipes?.length ?? 0) > 0
      ? [...sortedRecipes].sort(() => 0.5 - Math.random()).slice(0, 3)
      : sortedRecipes || [];

   const visibleRecipes = useMemo(() => {
         if (isPremium) {
           return sortedRecipes; // premium sees all
         }
         // free users → pick 3 random recipes
         if (sortedRecipes.length <= 3) return sortedRecipes;
         const shuffled = [...sortedRecipes].sort(() => Math.random() - 0.5);
         return shuffled.slice(0, 3);
       }, [sortedRecipes, isPremium]);

  const fetchFavouriteRecipes = async () => {
    if (!isPremium || !user?.userId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/fav/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Recipe[] = await response.json();
      setFavouriteRecipes(data);
    } catch (error) {
      console.error("Failed to fetch favourite recipes:", error);
    }
  };


  const fetchMyRecipes = async () => {
    if (!user?.userId) return;
    try {
      const response = await fetch(`${BASE_URL}/api/recipe/${user.userId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Recipe[] = await response.json();

      setRecipes(prev => {
        const others = prev.filter(r => r.author !== user.userId);
        return [...others, ...data];
      });
    } catch (error) {
      console.error("Failed to fetch my recipes:", error);
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => {
const isHttpLink =
  typeof item.imageLink === "string" &&
  (item.imageLink.startsWith("http://") || item.imageLink.startsWith("https://"));

const hasBinary =
  typeof item.imageBinary === "string" &&
  item.imageBinary.trim().length > 0;

const imageSource =
  isHttpLink
    ? { uri: item.imageLink }                              // seeded / external
    : hasBinary
    ? { uri: `data:image/jpeg;base64,${item.imageBinary}` } // user uploads (from backend)
    : require("../../assets/logo.png");                     // fallback

//     const imageSource = { uri: `data:image/jpeg;base64,${item.imageBinary}` };
    const isFav = favourites.includes(item.recipeId);
    return (
      <View style={styles.card}>
        {isPremium && (
          <TouchableOpacity
            style={styles.heartIcon}
            onPress={() => toggleFavourite(item.recipeId)}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={24}
              color={isFav ? "red" : "#999"}
            />
          </TouchableOpacity>
        )}

        <Image source={imageSource} style={styles.image} />

        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>

          <View style={styles.tagsAndButton}>
            <View style={styles.tagsRow}>
              <Text style={styles.tag}>Prep {item.prepTime} mins</Text>
              <Text style={styles.tag}>Cook {item.cookTime} mins</Text>
              <View style={[styles.kcalPill, styles.kcalLogged]}>
                <Text style={styles.kcalTxt}>{item.calories} kcal</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button}
            onPress={() => {
                          addRecipe(item); // store in context
                          navigation.navigate("RecipeDetailScreen", { recipeId: item.recipeId });
                        }}>
              <Text style={styles.buttonText}>View Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "All" && styles.activeTab]}
          onPress={() => setActiveTab("All")}
        >
          <Text style={styles.tabText}>All Recipes</Text>
        </TouchableOpacity>

        {isPremium && (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "Favourites" && styles.activeTab]}
            onPress={() => setActiveTab("Favourites")}
          >
            <Text style={styles.tabText}>Favourites</Text>
          </TouchableOpacity>
        )}

        {isPremium && (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "My" && styles.activeTab]}
            onPress={() => setActiveTab("My")}
          >
            <Text style={styles.tabText}>My Recipes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search + Sort */}
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

      <FlatList
        data={limitedRecipes ?? []}
        keyExtractor={(item) => item.recipeId.toString()}
        renderItem={renderRecipe}
        contentContainerStyle={{ paddingBottom: 50 }}
      />

      {!isPremium && (
        <TouchableOpacity style={styles.unlockButton}>
          <Text style={styles.unlockText}>🔓 Sign Up to Unlock More Recipes</Text>
        </TouchableOpacity>
      )}
    {activeTab === "My" && isPremium && (
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
    <AddRecipeModal
      visible={showAddDialog}
      onClose={() => setShowAddDialog(false)}
      onSave={() => fetchRecipes()}
    />
    </View>

  );
};


export default RecipeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  card: { flexDirection: "row", marginBottom: 15, backgroundColor: "#f9f9f9", borderRadius: 12, overflow: "hidden", elevation: 2, position: "relative", height: 140 },
  image: { width: 100, height:"100%" },
  heartIcon: { position: "absolute", top: -4, right: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, padding: 6, zIndex: 20 },
  cardContent: { flex: 1, padding: 10, flexDirection: "column", justifyContent: "space-between" },
  title: { fontWeight: "bold", fontSize: 16, paddingRight: 36 },
  tagsAndButton: { marginTop: "auto"},
  tagsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7},
  tag: { backgroundColor: "#e0f0ff", marginRight: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 12 },
  tabsRow: { flexDirection: "row", marginBottom: 10 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  activeTab: { borderBottomColor: colors.primaryGreen },
  tabText: { fontWeight: "bold", color: "#333" },
  button: { backgroundColor: "#001f3f", padding: 6, marginTop: 5, borderRadius: 6, alignItems: "center", marginTop: "auto", marginBottom: 1},
  buttonText: { color: "#fff" },
  unlockButton: { backgroundColor: "#d0f0d0", padding: 12, borderRadius: 6, alignItems: "center", marginTop: 10 },
  unlockText: { color: "#003300", fontWeight: "bold" },
  searchRow: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8 },
  sortButton: { marginLeft: 10, padding: 8, borderRadius: 8, backgroundColor: "#eee" },
  kcalPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  kcalLogged: { backgroundColor: colors.bgLightest },
  kcalTxt: { color: colors.primaryBlue, fontWeight: "800" },
  fabButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.primaryGreen,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

});


