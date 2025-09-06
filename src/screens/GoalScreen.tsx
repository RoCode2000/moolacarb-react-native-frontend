import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { colors } from "../theme/colors";

export default function GoalScreen() {
  const [goal, setGoal] = useState("");

  const handleSaveGoal = () => {
    if (!goal) {
      Alert.alert("Error", "Please enter a goal value.");
      return;
    }
    Alert.alert("Goal Updated", `Your daily goal is set to ${goal} calories`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Calorie Goal</Text>

      <Text style={styles.subtitle}>
        Set or update your daily calorie goal to better manage your diet plan.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter calories (e.g. 2000)"
        placeholderTextColor={colors.mute}
        keyboardType="numeric"
        value={goal}
        onChangeText={setGoal}
      />

      <TouchableOpacity style={styles.button} onPress={handleSaveGoal}>
        <Text style={styles.buttonText}>Save Goal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primaryBlue,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.mute,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: colors.bgLightest,
    color: colors.primaryBlue,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
