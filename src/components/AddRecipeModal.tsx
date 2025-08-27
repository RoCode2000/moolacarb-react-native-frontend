import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Recipe } from "../types/Recipe"; // create a types file if you want
import { useUser } from "../context/UserContext";

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void; // optional callback after save to refresh list
}

const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ visible, onClose, onSave }) => {
  const { user } = useUser();
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.7 },
      (response) => {
        if (!response.didCancel && response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          setImageUri(uri);
          setNewRecipe({ ...newRecipe, imageLink: uri });
        }
      }
    );
  };


  const takePhoto = () => {
    launchCamera(
      { mediaType: "photo", quality: 0.7 },
      (response) => {
        if (!response.didCancel && response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          setImageUri(uri);
          setNewRecipe({ ...newRecipe, imageLink: uri });
        }
      }
    );
  };


  const handleSaveRecipe = async () => {
    try {
      if (!user?.userId) throw new Error("User not found");

      const payload = {
        ...newRecipe,
        author: user.userId,
        overallRating: 0,
      };

      const response = await fetch("http://10.0.2.2:8080/api/recipe/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save recipe");

      Alert.alert("Success", "Recipe added!");
      setNewRecipe({});
      setImageUri(null);
      onClose();
      onSave?.();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not add recipe.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.header}>Add New Recipe</Text>

            {/* Title */}
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={newRecipe.title || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, title: text })}
            />

            {/* Serving */}
            <TextInput
              placeholder="Serving"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.serving?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, serving: parseInt(text) || 0 })
              }
            />

            {/* Ingredients */}
            <TextInput
              placeholder="Ingredients"
              style={styles.input}
              multiline
              value={newRecipe.ingredients || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, ingredients: text })}
            />

            {/* Instructions */}
            <TextInput
              placeholder="Instructions"
              style={styles.input}
              multiline
              value={newRecipe.instructions || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, instructions: text })}
            />

            {/* Calories */}
            <TextInput
              placeholder="Calories"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.calories?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, calories: parseFloat(text) || 0 })
              }
            />

            {/* Repeat other numeric fields (carbs, protein, fat, sodium...) */}
            <TextInput
              placeholder="Carbohydrates"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.carbohydrates?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, carbohydrates: parseFloat(text) || 0 })
              }
            />

            {/* Prep, Cook, Resting Time */}
            <TextInput
              placeholder="Prep Time (mins)"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.prepTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, prepTime: parseInt(text) || 0 })
              }
            />
            <TextInput
              placeholder="Cook Time (mins)"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.cookTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, cookTime: parseInt(text) || 0 })
              }
            />
            <TextInput
              placeholder="Resting Time (mins)"
              style={styles.input}
              keyboardType="numeric"
              value={newRecipe.restingTime?.toString() || ""}
              onChangeText={(text) =>
                setNewRecipe({ ...newRecipe, restingTime: parseInt(text) || 0 })
              }
            />

            {/* Cuisine */}
            <TextInput
              placeholder="Cuisine"
              style={styles.input}
              value={newRecipe.cuisine || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, cuisine: text })}
            />

            {/* Description */}
            <TextInput
              placeholder="Description"
              style={styles.input}
              multiline
              value={newRecipe.description || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, description: text })}
            />

            {/* Meal Type */}
            <TextInput
              placeholder="Meal Type"
              style={styles.input}
              value={newRecipe.mealType || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, mealType: text })}
            />

            {/* Status */}
            <TextInput
              placeholder="Status"
              style={styles.input}
              value={newRecipe.status || ""}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, status: text })}
            />

            {/* Image */}
            <Button title="Pick Image" onPress={pickImage} />
            <Button title="Take Photo" onPress={takePhoto} />
            {imageUri && <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, marginVertical: 10 }} />}

            {/* Buttons */}
            <Button title="Save Recipe" onPress={handleSaveRecipe} />
            <Button title="Cancel" color="red" onPress={onClose} />
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
});
