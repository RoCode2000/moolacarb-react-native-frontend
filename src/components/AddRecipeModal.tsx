import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Text,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { readFile } from "react-native-fs";
import { useUser } from "../context/UserContext";
import { Recipe } from "../types/Recipe";
import { BASE_URL } from "../config";

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ visible, onClose, onSave }) => {
  const { user } = useUser();
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, async (response) => {
      if (!response.didCancel && response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri!;
        setImageUri(uri);
        setNewRecipe({ ...newRecipe, imageLink: uri });
        const base64 = await readFile(uri, "base64");
        setImageBase64(base64);
      }
    });
  };

  const takePhoto = () => {
    launchCamera({ mediaType: "photo", quality: 0.7 }, async (response) => {
      if (!response.didCancel && response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri!;
        setImageUri(uri);
        setNewRecipe({ ...newRecipe, imageLink: uri });
        const base64 = await readFile(uri, "base64");
        setImageBase64(base64);
      }
    });
  };

  const handleSaveRecipe = async () => {
    try {
      if (!user?.userId) throw new Error("User not found");
      if (!imageBase64) throw new Error("Image is required");

      const payload = {
        title: newRecipe.title || "",
        serving: newRecipe.serving || 1,
        ingredients: newRecipe.ingredients || "",
        instructions: newRecipe.instructions || "",
        calories: newRecipe.calories || 0,
        carbohydrates: newRecipe.carbohydrates || 0,
        protein: newRecipe.protein || 0,
        fat: newRecipe.fat || 0,
        saturatedFat: newRecipe.saturatedFat || 0,
        sodium: newRecipe.sodium || 0,
        cholesterol: newRecipe.cholesterol || 0,
        potassium: newRecipe.potassium || 0,
        prepTime: newRecipe.prepTime || 0,
        cookTime: newRecipe.cookTime || 0,
        restingTime: newRecipe.restingTime || 0,
        cuisine: newRecipe.cuisine || "",
        description: newRecipe.description || "",
        mealType: newRecipe.mealType || "",
        status: user.userId === "admin" ? "A" : "P",
        overallRating: newRecipe.overallRating || 0,
        imageLink: newRecipe.imageLink || "",
        imageBinary: imageBase64,
        author: user.userId,
      };

      const url = `${BASE_URL}/api/recipe/add`;
      console.log("[AddRecipeModal] POST", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      Alert.alert("Success", "Recipe added!");
      setNewRecipe({});
      setImageUri(null);
      setImageBase64(null);
      onClose();
      onSave?.();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not add recipe.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.header}>Add New Recipe</Text>

            <TextInput
              placeholder="Title"
              style={styles.input}
              value={newRecipe.title || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, title: text })}
            />

            <TextInput
              placeholder="Serving"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.serving?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, serving: parseInt(text) || 0 })
              }
            />

            <TextInput
              placeholder="Ingredients"
              style={styles.input}
              multiline
              value={newRecipe.ingredients || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, ingredients: text })}
            />

            <TextInput
              placeholder="Instructions"
              style={styles.input}
              multiline
              value={newRecipe.instructions || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, instructions: text })}
            />

            <TextInput
              placeholder="Calories"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.calories?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, calories: parseFloat(text) || 0 })
              }
            />

            <TextInput
              placeholder="Carbohydrates"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.carbohydrates?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, carbohydrates: parseFloat(text) || 0 })
              }
            />

            <TextInput
              placeholder="Protein"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.protein?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, protein: parseFloat(text) || 0 })
              }
            />

            <TextInput
              placeholder="Fat"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.fat?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, fat: parseFloat(text) || 0 })
              }
            />

            <TextInput
              placeholder="Prep Time"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.prepTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, prepTime: parseInt(text) || 0 })
              }
            />

            <TextInput
              placeholder="Cook Time"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.cookTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, cookTime: parseInt(text) || 0 })
              }
            />

            <TextInput
              placeholder="Resting Time"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.restingTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, restingTime: parseInt(text) || 0 })
              }
            />

            <TextInput
              placeholder="Cuisine"
              style={styles.input}
              value={newRecipe.cuisine || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, cuisine: text })}
            />

            <TextInput
              placeholder="Description"
              style={styles.input}
              multiline
              value={newRecipe.description || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, description: text })}
            />

            <TextInput
              placeholder="Meal Type"
              style={styles.input}
              value={newRecipe.mealType || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, mealType: text })}
            />

            <TouchableOpacity
              onPress={pickImage}
              style={styles.pickBtn}
            >
              <Text style={styles.pickTxt}>Pick Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
              style={styles.photoBtn}
            >
              <Text style={styles.photoTxt}>Take Photo</Text>
            </TouchableOpacity>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity onPress={handleSaveRecipe} style={styles.saveBtn}>
              <Text style={styles.saveTxt}>Save Recipe</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddRecipeModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "90%",
    borderRadius: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  header: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  pickBtn: {
    backgroundColor: "#E8EAF6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  pickTxt: { color: "#3F51B5", fontWeight: "600" },
  photoBtn: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  photoTxt: { color: "#1976D2", fontWeight: "600" },
  preview: {
    width: "100%",
    height: 160,
    marginVertical: 10,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveTxt: { color: "white", fontWeight: "600" },
  cancelBtn: {
    backgroundColor: "#FFCDD2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelTxt: { color: "#B71C1C", fontWeight: "600" },
});
